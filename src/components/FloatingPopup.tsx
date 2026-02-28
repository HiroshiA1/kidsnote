'use client';

import { useState } from 'react';
import { useApp } from './AppLayout';
import { IntentType, GrowthData, IncidentData, HandoverData, ChildUpdateData, AddChildData, AddStaffData, RuleQueryData } from '@/types/intent';
import { ChildLinks } from './ChildLink';

interface FloatingPopupProps {
  sidebarCollapsed: boolean;
}

const intentConfig: Record<IntentType, { label: string; bgColor: string; borderColor: string; icon: string; actionLabel: string }> = {
  growth: { label: '成長記録', bgColor: 'bg-tertiary/30', borderColor: 'border-tertiary', icon: '🌱', actionLabel: '保存する' },
  incident: { label: 'ヒヤリハット', bgColor: 'bg-alert/20', borderColor: 'border-alert', icon: '⚠️', actionLabel: '保存する' },
  handover: { label: '申し送り', bgColor: 'bg-secondary/30', borderColor: 'border-button', icon: '📝', actionLabel: '保存する' },
  child_update: { label: '園児情報更新', bgColor: 'bg-surface', borderColor: 'border-paragraph/30', icon: '👤', actionLabel: '保存する' },
  add_child: { label: '園児追加', bgColor: 'bg-button/10', borderColor: 'border-button', icon: '👶', actionLabel: '追加する' },
  add_staff: { label: '職員追加', bgColor: 'bg-tertiary/20', borderColor: 'border-tertiary', icon: '👩‍🏫', actionLabel: '追加する' },
  rule_query: { label: 'ルール質問', bgColor: 'bg-button/10', borderColor: 'border-button/50', icon: '📚', actionLabel: '確認' },
};

function CompactContent({ result, ruleAnswer, linkedChildIds }: { result: NonNullable<import('@/types/intent').InputMessage['result']>; ruleAnswer?: { answer: string; referencedRuleIds: string[] }; linkedChildIds?: string[] }) {
  const { rules } = useApp();

  switch (result.intent) {
    case 'growth': {
      const data = result.data as GrowthData;
      return (
        <div className="text-sm space-y-1">
          {linkedChildIds && linkedChildIds.length > 0 ? (
            <p><span className="font-medium">対象:</span> <ChildLinks childIds={linkedChildIds} /></p>
          ) : data.child_names.length > 0 && (
            <p><span className="font-medium">対象:</span> {data.child_names.join('、')}</p>
          )}
          <p>{data.summary}</p>
          {data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {data.tags.map((tag, i) => <span key={i} className="text-xs px-1.5 py-0.5 bg-tertiary/50 rounded-full">{tag}</span>)}
            </div>
          )}
        </div>
      );
    }
    case 'incident': {
      const data = result.data as IncidentData;
      const severityLabels = { low: '軽微', medium: '中程度', high: '重大' };
      const severityColors = { low: 'bg-tertiary', medium: 'bg-secondary', high: 'bg-alert' };
      return (
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${severityColors[data.severity]} text-headline`}>{severityLabels[data.severity]}</span>
            {linkedChildIds && linkedChildIds.length > 0 ? (
              <span className="font-medium"><ChildLinks childIds={linkedChildIds} /></span>
            ) : data.child_name && <span className="font-medium">{data.child_name}</span>}
          </div>
          <p>{data.description}</p>
        </div>
      );
    }
    case 'handover': {
      const data = result.data as HandoverData;
      return (
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2">
            {data.urgent && <span className="text-xs px-1.5 py-0.5 bg-alert rounded-full text-white">至急</span>}
            <span className="text-xs text-paragraph/80">宛先: {data.target}</span>
          </div>
          <p>{data.message}</p>
        </div>
      );
    }
    case 'child_update': {
      const data = result.data as ChildUpdateData;
      return (
        <div className="text-sm">
          <p><span className="font-medium">
            {linkedChildIds && linkedChildIds.length > 0
              ? <ChildLinks childIds={linkedChildIds} />
              : data.child_name}
          </span>の{data.field === 'allergy' ? 'アレルギー情報' : '特性'}を更新</p>
          <p className="bg-surface/50 p-1.5 rounded mt-1 text-xs">{data.new_value}</p>
        </div>
      );
    }
    case 'add_child': {
      const data = result.data as AddChildData;
      const genderLabels: Record<string, string> = { male: '男の子', female: '女の子' };
      return (
        <div className="text-sm space-y-1">
          <p><span className="font-medium">{data.name}</span>
            {data.gender && <span className="ml-1 text-xs px-1.5 py-0.5 bg-button/20 rounded-full">{genderLabels[data.gender]}</span>}
          </p>
          <div className="text-xs text-paragraph/80 flex gap-3">
            {data.class_name && <span>クラス: {data.class_name}</span>}
            {data.birth_date && <span>生年月日: {data.birth_date}</span>}
          </div>
        </div>
      );
    }
    case 'add_staff': {
      const data = result.data as AddStaffData;
      return (
        <div className="text-sm space-y-1">
          <p><span className="font-medium">{data.name}</span>
            {data.role && <span className="ml-1 text-xs px-1.5 py-0.5 bg-tertiary/30 rounded-full">{data.role}</span>}
          </p>
          <div className="text-xs text-paragraph/80 flex gap-3">
            {data.class_name && <span>担当: {data.class_name}</span>}
            {data.contact && <span>連絡先: {data.contact}</span>}
          </div>
        </div>
      );
    }
    case 'rule_query': {
      const data = result.data as RuleQueryData;
      return (
        <div className="text-sm space-y-2">
          <p className="font-medium">{data.question}</p>
          {ruleAnswer ? (
            <div className="bg-surface/50 p-2 rounded-lg text-xs space-y-1">
              <p className="whitespace-pre-wrap">{ruleAnswer.answer}</p>
              {ruleAnswer.referencedRuleIds.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 border-t border-paragraph/10">
                  {ruleAnswer.referencedRuleIds
                    .map(id => rules.find(r => r.id === id))
                    .filter(Boolean)
                    .map(rule => (
                      <span key={rule!.id} className="text-xs px-1.5 py-0.5 rounded-full bg-button/10 text-paragraph/70">{rule!.title}</span>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-paragraph/50">
              <div className="w-2 h-2 bg-paragraph/30 rounded-full animate-bounce" />
              回答を取得中...
            </div>
          )}
        </div>
      );
    }
  }
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

  return (
    <div
      className={`fixed bottom-24 right-6 z-30 w-96 max-w-[calc(100vw-3rem)] transition-all duration-300 ${
        sidebarCollapsed ? '' : 'md:right-6'
      }`}
    >
      <div className={`rounded-xl shadow-lg border overflow-hidden ${config ? `${config.bgColor} ${config.borderColor}` : 'bg-surface border-secondary/30'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-paragraph/10">
          <div className="flex items-center gap-2">
            {config && <span className="text-lg">{config.icon}</span>}
            <span className="font-medium text-headline text-sm">{config?.label ?? '処理中...'}</span>
          </div>
          {queueCount > 1 && (
            <span className="text-xs bg-button text-white px-2 py-0.5 rounded-full">
              +{queueCount - 1}件
            </span>
          )}
        </div>

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
              <CompactContent result={current.result} ruleAnswer={current.ruleAnswer} linkedChildIds={current.linkedChildIds} />
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
                className="flex-1 py-2 px-3 bg-button text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {config?.actionLabel ?? '確認'}
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
