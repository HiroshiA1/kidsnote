'use client';

import { IntentResult, IntentType } from '@/types/intent';
import { SAFETY_KEYWORDS } from '@/lib/safetyKeywords';
import { intentConfig } from '@/lib/constants/intentConfig';
import { IntentContentRenderer } from './IntentContentRenderer';

interface IntentCardProps {
  result: IntentResult;
  originalText: string;
  onConfirm: () => void;
  onEdit: (newIntent: IntentType) => void;
  onCancel: () => void;
  onLinkToGrowth?: () => void;
  onMarkForRecord?: () => void;
  isMarkedForRecord?: boolean;
  linkedChildIds?: string[];
  ruleAnswer?: { answer: string; referencedRuleIds: string[] };
}

function getConfidenceLevel(confidence?: number): 'high' | 'medium' | 'low' {
  if (!confidence || confidence < 0.7) return 'low';
  if (confidence < 0.9) return 'medium';
  return 'high';
}

function detectSafetyKeywords(text: string): string[] {
  return SAFETY_KEYWORDS.filter(kw => text.includes(kw));
}

export function IntentCard({
  result,
  originalText,
  onConfirm,
  onEdit,
  onCancel,
  onLinkToGrowth,
  onMarkForRecord,
  isMarkedForRecord = false,
  linkedChildIds,
  ruleAnswer,
}: IntentCardProps) {
  const config = intentConfig[result.intent];
  const confidenceLevel = getConfidenceLevel(result.confidence);
  const safetyHits = detectSafetyKeywords(originalText);
  const hasSafetyWarning = safetyHits.length > 0 && result.intent !== 'incident';
  const isRuleQuery = result.intent === 'rule_query';

  return (
    <div className={`${hasSafetyWarning ? 'bg-alert/10 border-l-4 border-alert ring-2 ring-alert/30' : `${config.bgColor} border-l-4 ${config.borderColor}`} rounded-lg p-4 shadow-sm`}>
      {hasSafetyWarning && (
        <div className="bg-alert/20 border border-alert/30 rounded-lg px-3 py-2 mb-3 flex items-start gap-2">
          <span className="text-alert text-lg mt-0.5">&#9888;</span>
          <div>
            <p className="text-sm font-medium text-alert">安全に関する記述が含まれています</p>
            <p className="text-xs text-alert/80 mt-0.5">
              検出キーワード: {safetyHits.join('、')} — ヒヤリハットとして記録することを検討してください
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <span className={`font-medium ${config.color}`}>{config.label}</span>
          {result.confidence !== undefined && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              confidenceLevel === 'high' ? 'bg-tertiary/30 text-tertiary' :
              confidenceLevel === 'medium' ? 'bg-secondary/30 text-paragraph/70' :
              'bg-alert/20 text-alert'
            }`}>
              {Math.round(result.confidence * 100)}%
            </span>
          )}
        </div>
        {!isRuleQuery && (
          <div className="flex gap-1">
            {Object.entries(intentConfig).map(([key, value]) => (
              key !== result.intent && key !== 'rule_query' && (
                <button
                  key={key}
                  onClick={() => onEdit(key as IntentType)}
                  className="text-xs px-2 py-1 bg-surface/80 rounded hover:bg-surface text-paragraph/70 hover:text-paragraph transition-colors"
                  title={`${value.label}に変更`}
                >
                  {value.icon}
                </button>
              )
            ))}
          </div>
        )}
      </div>

      <div className="mb-3 text-xs text-paragraph/60 bg-surface/30 p-2 rounded">
        入力: {originalText}
      </div>

      <IntentContentRenderer result={result} mode="full" linkedChildIds={linkedChildIds} ruleAnswer={ruleAnswer} />

      {!isRuleQuery && (
        <>
          <div className="flex gap-2 mt-4 pt-3 border-t border-paragraph/10">
            {onLinkToGrowth && (
              <button
                onClick={onLinkToGrowth}
                className="flex-1 py-2 px-3 text-sm bg-tertiary/30 text-headline rounded-lg hover:bg-tertiary/50 transition-colors flex items-center justify-center gap-2"
                title="このエピソードを根拠として園児の成長記録を更新"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                成長記録へ反映
              </button>
            )}
            {onMarkForRecord && (
              <button
                onClick={onMarkForRecord}
                className={`flex-1 py-2 px-3 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  isMarkedForRecord
                    ? 'bg-button text-white'
                    : 'bg-secondary/30 text-headline hover:bg-secondary/50'
                }`}
                title="年度末の指導要録に使用するエピソードとしてマーク"
              >
                <svg className="w-4 h-4" fill={isMarkedForRecord ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {isMarkedForRecord ? '要録用にマーク済' : '要録用にマーク'}
              </button>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            {hasSafetyWarning ? (
              <button onClick={onConfirm} className="flex-1 py-2 px-4 bg-alert text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                安全確認済み・保存する
              </button>
            ) : confidenceLevel === 'high' ? (
              <button onClick={onConfirm} className="flex-1 py-2 px-4 bg-button text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                保存する
              </button>
            ) : confidenceLevel === 'medium' ? (
              <button onClick={onConfirm} className="flex-1 py-2 px-4 bg-button text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                確認して保存
              </button>
            ) : (
              <button onClick={onConfirm} className="flex-1 py-2 px-4 bg-button/80 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                内容を確認して保存
              </button>
            )}
            <button onClick={onCancel} className="py-2 px-4 bg-surface text-paragraph rounded-lg hover:bg-secondary/20 transition-colors">
              キャンセル
            </button>
          </div>
        </>
      )}
    </div>
  );
}
