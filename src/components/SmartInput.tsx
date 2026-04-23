'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export interface Attachment {
  id: string;
  type: 'image' | 'file';
  name: string;
  url: string;
  file: File;
}

interface SmartInputProps {
  onSubmit: (text: string, attachments?: Attachment[], options?: { emergency?: boolean }) => void | Promise<void>;
  isProcessing?: boolean;
  placeholder?: string;
  sidebarCollapsed?: boolean;
  /** サイドバーが左/右どちらに固定されているか。md以上で下部入力バーの残りスペースを決める */
  sidebarPosition?: 'left' | 'right';
  selectedChildName?: string | null;
  onError?: (message: string) => void;
}

export function SmartInput({ onSubmit, isProcessing = false, placeholder, sidebarCollapsed = false, sidebarPosition = 'left', selectedChildName, onError }: SmartInputProps) {
  const [input, setInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Speech Recognition初期化
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ja-JP';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript;
            } else {
              interim += transcript;
            }
          }

          if (final) {
            setInput(prev => prev + final);
            setInterimTranscript('');
          } else {
            setInterimTranscript(interim);
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          // "aborted"はユーザー操作やクリーンアップによる正常な停止なので無視
          if (event.error !== 'aborted') {
            onError?.(`音声入力でエラーが発生しました (${event.error})`);
          }
          setIsListening(false);
          setInterimTranscript('');
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript('');
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // テキストエリアの高さ調整
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input, interimTranscript]);

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    if (showAttachMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAttachMenu]);

  const handleSubmit = useCallback(async () => {
    if (!((input.trim() || attachments.length > 0) && !isProcessing)) return;
    // 音声入力中なら停止
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    try {
      await onSubmit(
        input.trim(),
        attachments.length > 0 ? attachments : undefined,
        emergencyMode ? { emergency: true } : undefined,
      );
      // 成功時のみクリア・緊急OFF(失敗時は入力内容と緊急モードを保持して再送信可能に)
      setInput('');
      setInterimTranscript('');
      setAttachments([]);
      setEmergencyMode(false);
    } catch {
      // addMessage 側で Toast 通知済みなのでここでは状態保持のみ
    }
  }, [input, attachments, isProcessing, isListening, onSubmit, emergencyMode]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      type: file.type.startsWith('image/') ? 'image' : 'file',
      name: file.name,
      url: URL.createObjectURL(file),
      file,
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
    setShowAttachMenu(false);
    e.target.value = '';
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === id);
      if (attachment) {
        URL.revokeObjectURL(attachment.url);
      }
      return prev.filter(a => a.id !== id);
    });
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // IME変換中は送信しない
    if (e.key === 'Enter' && !e.shiftKey && !isComposing && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        onError?.('音声入力を開始できませんでした');
      }
    }
  }, [isListening, onError]);

  const displayText = input + (interimTranscript ? interimTranscript : '');

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-background border-t border-secondary/20 transition-all duration-300 ${
        sidebarPosition === 'right'
          ? sidebarCollapsed
            ? 'md:right-16'
            : 'md:right-64'
          : sidebarCollapsed
            ? 'md:left-16'
            : 'md:left-64'
      }`}
    >
      <div className="max-w-3xl mx-auto">
        {/* 緊急モードインジケーター */}
        {emergencyMode && (
          <div className="flex items-center justify-center gap-2 mb-2 py-2 px-4 bg-alert/15 border border-alert/40 rounded-full">
            <svg className="w-5 h-5 text-alert" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-medium text-alert">緊急モード: ヒヤリハット(重要度:高)として確認画面に出ます</span>
          </div>
        )}
        {/* 音声入力中のインジケーター */}
        {isListening && (
          <div className="flex items-center justify-center gap-2 mb-2 py-2 px-4 bg-button/20 rounded-full">
            <span className="flex gap-1">
              <span className="w-2 h-2 bg-button rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-button rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-button rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            <span className="text-sm text-headline">音声入力中...</span>
          </div>
        )}

        {/* 添付ファイルプレビュー */}
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
            {attachments.map(attachment => (
              <div
                key={attachment.id}
                className="relative flex-shrink-0 group"
              >
                {attachment.type === 'image' ? (
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="w-16 h-16 object-cover rounded-lg border border-secondary/30"
                  />
                ) : (
                  <div className="w-16 h-16 bg-secondary/20 rounded-lg border border-secondary/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-paragraph/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  aria-label={`添付「${attachment.name}」を外す`}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-alert text-white rounded-full flex items-center justify-center text-sm shadow-md hover:scale-110 transition-transform"
                >
                  ×
                </button>
                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 truncate rounded-b-lg">
                  {attachment.name.length > 8 ? attachment.name.slice(0, 8) + '...' : attachment.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 選択中の園児チップ */}
        {selectedChildName && (
          <div className="flex items-center gap-2 mb-1 px-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-button/10 border border-button/30 rounded-full text-xs font-medium text-button">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {selectedChildName}
            </span>
            <span className="text-xs text-paragraph/40">に関する入力として記録</span>
          </div>
        )}

        <div className={`flex items-end gap-3 p-3 bg-surface rounded-2xl shadow-lg border transition-colors ${emergencyMode ? 'border-alert ring-2 ring-alert/30' : 'border-secondary/30'}`}>
          {/* [＋] ボタン */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              disabled={isProcessing}
              className="flex-shrink-0 w-11 h-11 rounded-full bg-secondary/30 text-paragraph hover:bg-secondary/50 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="ファイル添付"
            >
              <svg className={`w-5 h-5 transition-transform ${showAttachMenu ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* 添付メニュー */}
            {showAttachMenu && (
              <div className="absolute bottom-14 left-0 bg-surface rounded-xl shadow-lg border border-secondary/30 py-2 min-w-[160px] z-20">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full px-4 py-2 text-left text-sm text-paragraph hover:bg-secondary/20 flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-button" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  カメラで撮影
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-2 text-left text-sm text-paragraph hover:bg-secondary/20 flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  画像を選択
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-2 text-left text-sm text-paragraph hover:bg-secondary/20 flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-paragraph/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  ファイルを添付
                </button>
              </div>
            )}

            {/* 隠しファイル入力 */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <textarea
            ref={textareaRef}
            value={displayText}
            onChange={(e) => {
              setInput(e.target.value);
              setInterimTranscript('');
            }}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={
              emergencyMode
                ? '何が起きたか、誰が、どこで...（例: 年中太郎くん、滑り台で転倒）'
                : (placeholder || "何でも話しかけてください...（記録・申し送り・報告など）")
            }
            className="flex-1 resize-none bg-transparent text-paragraph placeholder:text-paragraph/50 focus:outline-none min-h-[44px] max-h-[120px] py-2"
            rows={1}
            disabled={isProcessing}
          />

          {/* 緊急モードトグル */}
          <button
            type="button"
            onClick={() => setEmergencyMode(v => !v)}
            disabled={isProcessing}
            aria-pressed={emergencyMode}
            aria-label={emergencyMode ? '緊急ヒヤリハットモードを解除' : '緊急ヒヤリハットモードを有効化'}
            className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              emergencyMode
                ? 'bg-alert text-white ring-2 ring-alert/40'
                : 'bg-secondary/30 text-alert hover:bg-secondary/50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={emergencyMode ? '緊急モード解除' : '緊急(ヒヤリハット)として送信'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </button>

          {/* 音声入力ボタン */}
          {speechSupported && (
            <button
              onClick={toggleListening}
              disabled={isProcessing}
              className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-alert text-white animate-pulse'
                  : 'bg-secondary/50 text-paragraph hover:bg-secondary'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isListening ? '音声入力を停止' : '音声入力を開始'}
            >
              {isListening ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
          )}

          {/* 送信ボタン */}
          <button
            onClick={handleSubmit}
            disabled={(!input.trim() && attachments.length === 0) || isProcessing}
            className="flex-shrink-0 w-11 h-11 rounded-full bg-button text-white flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-center text-xs text-paragraph/60 mt-2">
          {speechSupported ? 'マイクボタンで音声入力 / ' : ''}AIが自動で内容を分類します
        </p>
      </div>
    </div>
  );
}
