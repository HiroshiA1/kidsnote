'use client';

import { useState } from 'react';
import { ChildWithGrowth } from '@/lib/childrenStore';
import { InputMessage, GrowthData } from '@/types/intent';
import { calculateAge } from '@/lib/formatters';

type DocumentType = 'record' | 'guardian_update' | 'growth_summary';

const DOCUMENT_TYPES: { id: DocumentType; label: string; description: string }[] = [
  {
    id: 'guardian_update',
    label: '保護者向け：最近の様子',
    description: '保護者へのお便り文を温かみのある文体で生成',
  },
  {
    id: 'growth_summary',
    label: '期間内の成長まとめ',
    description: '指定期間内の成長変化を5領域の視点でまとめる',
  },
  {
    id: 'record',
    label: '指導要録（所見）',
    description: '年度末提出書類向け、フォーマルな所見文',
  },
];

const PERIOD_OPTIONS = [
  { value: 7, label: '直近1週間' },
  { value: 14, label: '直近2週間' },
  { value: 30, label: '直近1ヶ月' },
  { value: 90, label: '直近3ヶ月' },
  { value: 180, label: '直近半年' },
  { value: 365, label: '直近1年' },
  { value: 0, label: '全期間' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  child: ChildWithGrowth;
  messages: InputMessage[];
}

export default function DocumentGenerateModal({ open, onClose, child, messages }: Props) {
  const [type, setType] = useState<DocumentType>('guardian_update');
  const [periodDays, setPeriodDays] = useState(30);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  // 対象園児に紐づくメッセージを期間でフィルタ
  const filteredEpisodes = (() => {
    const childMessages = messages.filter((m) => m.linkedChildIds?.includes(child.id));
    if (periodDays === 0) return childMessages;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodDays);
    return childMessages.filter((m) => m.timestamp >= cutoff);
  })();

  const periodLabel = periodDays === 0 ? '全期間' : PERIOD_OPTIONS.find((p) => p.value === periodDays)?.label;

  const handleGenerate = async () => {
    setError(null);
    setResult(null);
    setGenerating(true);
    try {
      const episodes = filteredEpisodes.map((m) => {
        const summary = (m.result?.data as GrowthData | undefined)?.summary;
        const tags = (m.result?.data as GrowthData | undefined)?.tags;
        return {
          date: m.timestamp.toLocaleDateString('ja-JP'),
          content: summary || m.content,
          tags,
        };
      });

      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          child: {
            id: child.id,
            firstName: child.firstName,
            lastName: child.lastName,
            firstNameKanji: child.firstNameKanji,
            lastNameKanji: child.lastNameKanji,
            grade: child.grade,
            className: child.className,
            gender: child.gender,
            age: calculateAge(child.birthDate),
            allergies: child.allergies,
            characteristics: child.characteristics,
            interests: child.interests,
            growthLevels: child.growthLevels?.map((gl) => ({ domain: gl.domain, level: gl.level })),
          },
          episodes,
          periodLabel,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? '生成に失敗しました');
      setResult(json.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成に失敗しました');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-secondary/20 flex items-center justify-between sticky top-0 bg-surface z-10">
          <h2 className="text-lg font-bold text-headline">📝 文書を生成</h2>
          <button onClick={handleClose} className="text-paragraph/60 hover:text-paragraph">✕</button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* 文書種類選択 */}
          <div>
            <label className="block text-xs font-medium text-paragraph/70 mb-2">文書の種類</label>
            <div className="space-y-2">
              {DOCUMENT_TYPES.map((dt) => (
                <label
                  key={dt.id}
                  className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                    type === dt.id ? 'border-button bg-button/5' : 'border-secondary/30 hover:bg-secondary/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="docType"
                      checked={type === dt.id}
                      onChange={() => setType(dt.id)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-headline">{dt.label}</div>
                      <div className="text-xs text-paragraph/60 mt-0.5">{dt.description}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 期間 */}
          <div>
            <label className="block text-xs font-medium text-paragraph/70 mb-1">対象期間</label>
            <select
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm text-paragraph"
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <div className="text-xs text-paragraph/60 mt-1">
              対象エピソード: <strong>{filteredEpisodes.length}件</strong>
            </div>
          </div>

          {/* 生成ボタン */}
          <button
            onClick={handleGenerate}
            disabled={generating || filteredEpisodes.length === 0}
            className="w-full py-2.5 bg-button text-white rounded-lg font-medium hover:bg-button/90 disabled:opacity-50"
          >
            {generating ? '生成中...（10〜30秒）' : '✨ 生成する'}
          </button>
          {filteredEpisodes.length === 0 && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              対象期間にこの園児の観察記録がありません。期間を広げてください。
            </div>
          )}

          {/* エラー */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {/* 結果プレビュー */}
          {result && (
            <div className="border border-secondary/30 rounded-lg overflow-hidden">
              <div className="bg-secondary/10 px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-medium text-headline">生成結果</span>
                <button
                  onClick={handleCopy}
                  className="text-xs px-2 py-1 bg-button text-white rounded hover:bg-button/90"
                >
                  {copied ? '✓ コピー済み' : 'コピー'}
                </button>
              </div>
              <div className="p-4 text-sm text-paragraph whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                {result}
              </div>
            </div>
          )}

          <div className="text-xs text-paragraph/50 border-t border-secondary/20 pt-3">
            ⚠️ 生成された内容はAIによる下書きです。必ず内容を確認・修正してから使用してください。
            個人情報は匿名化してAIに送信し、応答後に復元しています。
          </div>
        </div>
      </div>
    </div>
  );
}
