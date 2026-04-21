'use client';

import { useState } from 'react';
import { useApp } from './AppLayout';
import { intentConfig } from '@/lib/constants/intentConfig';
import { IntentContentRenderer } from './IntentContentRenderer';

interface FloatingPopupProps {
  sidebarCollapsed: boolean;
}

export function FloatingPopup({ sidebarCollapsed }: FloatingPopupProps) {
  const { messages, confirmMessage, cancelMessage, markForRecord } = useApp();
  const [dismissed, setDismissed] = useState<string[]>([]);

  // pending/confirmed messages (not yet saved)
  const pendingMessages = messages.filter(
    m => (m.status === 'processing' || m.status === 'confirmed') && !dismissed.includes(m.id)
  );

  if (pendingMessages.length === 0) return null;

  const current = pendingMessages[0];
  const queueCount = pendingMessages.length;

  const handleConfirm = () => {
    // 緊急モードは最優先 — rule_query 分岐より前に confirmMessage へ流して incident/high 強制を発火させる
    if (current.isEmergency) {
      confirmMessage(current.id);
      return;
    }
    if (current.result?.intent === 'rule_query') {
      // rule_query は dismiss のみ
      setDismissed(prev => [...prev, current.id]);
    } else {
      confirmMessage(current.id);
    }
  };

  const handleCancel = () => {
    cancelMessage(current.id);
  };

  const handleMarkForRecord = () => {
    markForRecord(current.id);
  };

  const config = current.result ? intentConfig[current.result.intent] : null;
  const isRuleQuery = current.result?.intent === 'rule_query';
  const isEmergency = current.isEmergency === true;
  const aiIntent = current.result?.intent;
  const aiMisalignedWithEmergency = isEmergency && aiIntent && aiIntent !== 'incident';

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
            {isEmergency ? <span className="text-lg">🚨</span> : config && <span className="text-lg">{config.icon}</span>}
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

        {/* Actions */}
        {current.status === 'confirmed' && current.result && (
          <div className="px-4 py-3 border-t border-paragraph/10">
            {!isRuleQuery && (
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
                className={`flex-1 py-2 px-3 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity ${
                  isEmergency ? 'bg-alert' : 'bg-button'
                }`}
              >
                {isEmergency ? '🚨 緊急登録する' : (config?.actionLabel ?? '確認')}
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
