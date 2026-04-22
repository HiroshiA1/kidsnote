'use client';

import { useState } from 'react';
import { useApp } from './AppLayout';
import { intentConfig } from '@/lib/constants/intentConfig';
import { IntentContentRenderer } from './IntentContentRenderer';
import { useMessageActions } from '@/hooks/useMessageActions';

interface FloatingPopupProps {
  sidebarCollapsed: boolean;
}

export function FloatingPopup(_props: FloatingPopupProps) {
  const { messages, markForRecord } = useApp();
  const {
    selectedCandidateId,
    setSelectedCandidateId,
    getDeleteCandidates,
    canDelete,
    performConfirm,
    performCancel,
  } = useMessageActions();

  // rule_query の「閉じる」ためのローカル dismissed セット(message 自体は削除せずに popup から隠すだけ)
  const [dismissed, setDismissed] = useState<string[]>([]);

  // pending/confirmed messages (not yet saved)
  const pendingMessages = messages.filter(
    m => (m.status === 'processing' || m.status === 'confirmed') && !dismissed.includes(m.id)
  );

  const current = pendingMessages[0];
  const queueCount = pendingMessages.length;
  const deleteCandidates = getDeleteCandidates(current);

  if (pendingMessages.length === 0) return null;

  const config = current.result ? intentConfig[current.result.intent] : null;
  const isRuleQuery = current.result?.intent === 'rule_query';
  const isEmergency = current.isEmergency === true;
  const isDeleteChild = current.result?.intent === 'delete_child';
  const isAddRule = current.result?.intent === 'add_rule';
  const aiIntent = current.result?.intent;
  const aiMisalignedWithEmergency = isEmergency && aiIntent && aiIntent !== 'incident';

  const resolvedDeleteTarget =
    deleteCandidates.length === 1
      ? deleteCandidates[0]
      : selectedCandidateId
      ? deleteCandidates.find(c => c.id === selectedCandidateId) ?? null
      : null;

  const handleConfirm = async () => {
    const result = await performConfirm(current, deleteCandidates);
    if (result.dismiss) {
      setDismissed(prev => [...prev, current.id]);
    }
  };

  const handleCancel = () => {
    performCancel(current, deleteCandidates);
  };

  const handleMarkForRecord = () => {
    markForRecord(current.id);
  };

  const confirmDisabled =
    isDeleteChild && deleteCandidates.length > 1 && !resolvedDeleteTarget;

  return (
    <div
      className="fixed bottom-24 z-30 w-96 max-w-[calc(100vw-2rem)] transition-all duration-300 right-3 sm:right-6"
    >
      <div className={`rounded-xl shadow-lg border overflow-hidden ${
        isEmergency
          ? 'bg-alert/10 border-alert'
          : config ? `${config.bgColor} ${config.borderColor}` : 'bg-surface border-secondary/30'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-paragraph/10">
          <div className="flex items-center gap-2">
            {isEmergency ? (
              <svg className="w-5 h-5 text-alert" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : config && <span className="text-lg">{config.icon}</span>}
            <span className="font-medium text-headline text-sm">
              {isEmergency ? '緊急ヒヤリハット (重要度:高)' : (config?.label ?? '処理中...')}
            </span>
          </div>
          {queueCount > 1 && (
            <span className="text-xs bg-button text-white px-2 py-0.5 rounded-full">
              +{queueCount - 1}件
            </span>
          )}
        </div>

        {aiMisalignedWithEmergency && config && (
          <div className="px-4 py-2 bg-alert/5 border-b border-alert/20 text-xs text-paragraph">
            AIは「{config.label}」と判断しましたが、緊急モードで送信されたため
            <span className="font-medium text-alert">ヒヤリハット(重要度:高)</span>として記録します。
          </div>
        )}

        {/* Content */}
        <div className="px-4 py-3">
          {current.status === 'processing' ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-secondary/50 rounded w-3/4" />
              <div className="h-3 bg-secondary/30 rounded w-1/2" />
            </div>
          ) : current.result ? (
            <>
              <div className="text-xs text-paragraph/60 bg-surface/30 p-1.5 rounded mb-2 truncate">
                {current.content}
              </div>
              <IntentContentRenderer result={current.result} mode="compact" linkedChildIds={current.linkedChildIds} ruleAnswer={current.ruleAnswer} />
            </>
          ) : null}
        </div>

        {/* delete_child 用 候補選択 */}
        {isDeleteChild && current.status === 'confirmed' && (
          <div className="px-4 py-2 border-t border-alert/20 bg-alert/5 text-xs space-y-2">
            {!canDelete && (
              <p className="text-alert font-medium">※ 園児削除は管理者・主任のみ実行可能です。</p>
            )}
            {deleteCandidates.length === 0 && (
              <p className="text-paragraph">
                対象園児が特定できませんでした。フルネームやクラスで再度指定してください。
              </p>
            )}
            {deleteCandidates.length === 1 && (
              <p className="text-paragraph">
                対象: <span className="font-medium">
                  {deleteCandidates[0].lastNameKanji || deleteCandidates[0].lastName} {deleteCandidates[0].firstNameKanji || deleteCandidates[0].firstName}
                </span>
                （{deleteCandidates[0].className}）
              </p>
            )}
            {deleteCandidates.length > 1 && (
              <div>
                <p className="text-paragraph mb-1">同名の候補が{deleteCandidates.length}名います。対象を選択してください:</p>
                <div className="space-y-1">
                  {deleteCandidates.map(c => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-alert/10">
                      <input
                        type="radio"
                        name="delete-candidate"
                        checked={selectedCandidateId === c.id}
                        onChange={() => setSelectedCandidateId(c.id)}
                      />
                      <span>
                        {c.lastNameKanji || c.lastName} {c.firstNameKanji || c.firstName}
                        <span className="text-paragraph/60 ml-1">({c.className})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {current.status === 'confirmed' && current.result && (
          <div className="px-4 py-3 border-t border-paragraph/10">
            {!isRuleQuery && !isDeleteChild && !isAddRule && (
              <div className="flex gap-2 mb-2">
                <button
                  onClick={handleMarkForRecord}
                  className={`flex-1 py-1.5 px-2 text-xs rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    current.isMarkedForRecord
                      ? 'bg-button text-white'
                      : 'bg-secondary/30 text-headline hover:bg-secondary/50'
                  }`}
                >
                  <svg className="w-3 h-3" fill={current.isMarkedForRecord ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  {current.isMarkedForRecord ? '要録マーク済' : '要録用にマーク'}
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                disabled={confirmDisabled}
                className={`flex-1 py-2 px-3 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${
                  isEmergency || isDeleteChild ? 'bg-alert' : 'bg-button'
                }`}
              >
                {isEmergency ? (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    緊急登録する
                  </span>
                ) : isDeleteChild
                  ? '対象を確認して削除へ'
                  : isAddRule
                  ? '内容を確認して保存'
                  : (config?.actionLabel ?? '確認')}
              </button>
              {!isRuleQuery && (
                <button
                  onClick={handleCancel}
                  className="py-2 px-3 bg-surface text-paragraph rounded-lg text-sm hover:bg-secondary/20 transition-colors"
                >
                  キャンセル
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
