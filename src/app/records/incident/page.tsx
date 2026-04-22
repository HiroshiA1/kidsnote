'use client';

import { useState } from 'react';
import { IncidentData } from '@/types/intent';
import { ChildLinks } from '@/components/ChildLink';
import { formatDate, formatDateGroup, severityLabels } from '@/lib/formatters';
import { useRecordPage } from '@/hooks/useRecordPage';
import { PendingSection, EmptyState, RecordPageHeader } from '@/components/RecordPageTemplate';

type FilterMode = 'all' | 'low' | 'medium' | 'high';
type EscalationStatus = 'none' | 'escalated' | 'responded';

interface IncidentExtra {
  escalation: EscalationStatus;
  escalatedTo?: string;
  escalatedAt?: Date;
  response?: string;
  respondedBy?: string;
  respondedAt?: Date;
  followUp?: string;
}

export default function IncidentRecordsPage() {
  const { pendingMessages, savedMessages, groupByDate, confirmMessage, editMessage, cancelMessage, markForRecord, staff } = useRecordPage({ intentType: 'incident' });
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [extras, setExtras] = useState<Record<string, IncidentExtra>>({});
  const [showEscalateModal, setShowEscalateModal] = useState<string | null>(null);
  const [showResponseModal, setShowResponseModal] = useState<string | null>(null);
  const [escalateForm, setEscalateForm] = useState({ to: '', note: '' });
  const [responseForm, setResponseForm] = useState({ response: '', followUp: '' });

  const filteredMessages = savedMessages.filter(m => {
    if (filterMode === 'all') return true;
    return (m.result?.data as IncidentData)?.severity === filterMode;
  });

  const countBySeverity = (sev: 'low' | 'medium' | 'high') =>
    savedMessages.filter(m => (m.result?.data as IncidentData)?.severity === sev).length;

  const escalatedCount = Object.values(extras).filter(e => e.escalation !== 'none').length;

  const getExtra = (id: string): IncidentExtra => extras[id] ?? { escalation: 'none' };

  const openEscalateModal = (id: string) => {
    setEscalateForm({ to: '', note: '' });
    setShowEscalateModal(id);
  };

  const submitEscalation = () => {
    if (!showEscalateModal || !escalateForm.to) return;
    setExtras(prev => ({
      ...prev,
      [showEscalateModal]: {
        ...getExtra(showEscalateModal),
        escalation: 'escalated',
        escalatedTo: escalateForm.to,
        escalatedAt: new Date(),
      },
    }));
    setShowEscalateModal(null);
  };

  const openResponseModal = (id: string) => {
    setResponseForm({ response: '', followUp: '' });
    setShowResponseModal(id);
  };

  const submitResponse = () => {
    if (!showResponseModal || !responseForm.response) return;
    const currentUser = staff[0]; // 現在のユーザー（仮）
    setExtras(prev => ({
      ...prev,
      [showResponseModal]: {
        ...getExtra(showResponseModal),
        escalation: 'responded',
        response: responseForm.response,
        respondedBy: `${currentUser.lastName} ${currentUser.firstName}`,
        respondedAt: new Date(),
        followUp: responseForm.followUp || undefined,
      },
    }));
    setShowResponseModal(null);
  };

  const severityBadgeColors: Record<string, string> = {
    low: 'bg-tertiary text-white',
    medium: 'bg-secondary text-headline',
    high: 'bg-alert text-white',
  };
  const severityBorders: Record<string, string> = { low: 'border-tertiary', medium: 'border-secondary', high: 'border-alert' };

  const grouped = groupByDate(filteredMessages);

  // エスカレーション先の候補（園長・主任）
  const escalationTargets = staff.filter(s =>
    ['園長', '主任', '副園長'].includes(s.role)
  );

  return (
    <div className="min-h-screen">
      <RecordPageHeader
        title="ヒヤリハット"
        rightContent={
          <div className="flex items-center gap-3 text-sm text-paragraph/60">
            {escalatedCount > 0 && (
              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">
                エスカレーション {escalatedCount}件
              </span>
            )}
            <span>{savedMessages.length}件</span>
          </div>
        }
      >
        <div className="flex gap-2">
          {(['all', 'high', 'medium', 'low'] as const).map(mode => {
            const labels = { all: `すべて (${savedMessages.length})`, high: `重大 (${countBySeverity('high')})`, medium: `中程度 (${countBySeverity('medium')})`, low: `軽微 (${countBySeverity('low')})` };
            const activeColors = { all: 'bg-button text-white', high: 'bg-alert text-white', medium: 'bg-button text-white', low: 'bg-tertiary text-white' };
            return (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filterMode === mode ? activeColors[mode] : 'bg-secondary/20 text-paragraph/70 hover:bg-secondary/30'}`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>
      </RecordPageHeader>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
        <PendingSection
          pendingMessages={pendingMessages}
          confirmMessage={confirmMessage}
          editMessage={editMessage}
          cancelMessage={cancelMessage}
          markForRecord={markForRecord}
          skeletonColor="bg-alert"
        />

        {/* 保存済み（日付グループ） */}
        {Object.entries(grouped).map(([dateKey, dayMessages]) => (
          <section key={dateKey}>
            <h2 className="text-sm font-medium text-paragraph/60 mb-3">
              {formatDateGroup(dayMessages[0].timestamp)}
            </h2>
            <div className="space-y-3">
              {dayMessages.map(message => {
                const data = message.result?.data as IncidentData;
                const extra = getExtra(message.id);

                return (
                  <div
                    key={message.id}
                    className={`rounded-lg p-4 border-l-4 ${severityBorders[data.severity]} bg-surface shadow-sm`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityBadgeColors[data.severity]}`}>
                            {severityLabels[data.severity]}
                          </span>
                          {extra.escalation === 'escalated' && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full font-medium">
                              エスカレーション中
                            </span>
                          )}
                          {extra.escalation === 'responded' && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full font-medium">
                              対応済
                            </span>
                          )}
                          <span className="font-medium text-headline">
                            {message.linkedChildIds && message.linkedChildIds.length > 0
                              ? <ChildLinks childIds={message.linkedChildIds} />
                              : data.child_name}
                          </span>
                        </div>
                        <p className="text-sm text-paragraph">{data.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-paragraph/70">
                          <span>場所: {data.location}</span>
                          <span>原因: {data.cause}</span>
                        </div>

                        {/* エスカレーション情報 */}
                        {extra.escalation !== 'none' && (
                          <div className="mt-3 p-3 bg-purple-50 rounded-lg text-xs space-y-1">
                            <div className="flex items-center gap-2 text-purple-700 font-medium">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                              </svg>
                              エスカレーション先: {extra.escalatedTo}
                            </div>
                            {extra.escalatedAt && (
                              <div className="text-paragraph/60">報告日時: {formatDate(extra.escalatedAt)}</div>
                            )}
                            {extra.response && (
                              <div className="mt-2 p-2 bg-white rounded border border-green-200">
                                <div className="text-green-700 font-medium mb-1">対応内容（{extra.respondedBy}）</div>
                                <div className="text-paragraph">{extra.response}</div>
                                {extra.followUp && (
                                  <div className="mt-1 text-paragraph/70">フォローアップ: {extra.followUp}</div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* アクションボタン */}
                        <div className="flex items-center gap-2 mt-3">
                          {extra.escalation === 'none' && (
                            <button
                              onClick={() => openEscalateModal(message.id)}
                              className="text-xs px-3 py-1 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                              </svg>
                              エスカレーション
                            </button>
                          )}
                          {extra.escalation === 'escalated' && (
                            <button
                              onClick={() => openResponseModal(message.id)}
                              className="text-xs px-3 py-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              対応を記録
                            </button>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-paragraph/50 ml-3 whitespace-nowrap">
                        {formatDate(message.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {filteredMessages.length === 0 && pendingMessages.length === 0 && (
          <EmptyState
            icon={
              <svg className="w-8 h-8 text-paragraph/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            }
            message={filterMode === 'all' ? 'ヒヤリハット記録がありません' : `${severityLabels[filterMode]}のヒヤリハットはありません`}
          />
        )}
      </main>

      {/* エスカレーションモーダル */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowEscalateModal(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-surface rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-headline mb-4">エスカレーション</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-paragraph/80 mb-1">報告先</label>
                <select
                  value={escalateForm.to}
                  onChange={e => setEscalateForm(f => ({ ...f, to: e.target.value }))}
                  className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="">選択してください</option>
                  {escalationTargets.map(s => (
                    <option key={s.id} value={`${s.lastName} ${s.firstName}（${s.role}）`}>
                      {s.lastName} {s.firstName}（{s.role}）
                    </option>
                  ))}
                  {escalationTargets.length === 0 && (
                    <option value="園長">園長</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-paragraph/80 mb-1">補足メモ（任意）</label>
                <textarea
                  value={escalateForm.note}
                  onChange={e => setEscalateForm(f => ({ ...f, note: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                  placeholder="補足情報があれば記入..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowEscalateModal(null)}
                className="px-4 py-2 text-sm text-paragraph/70 hover:bg-secondary/20 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={submitEscalation}
                disabled={!escalateForm.to}
                className="px-4 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-40"
              >
                エスカレーションする
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 対応記録モーダル */}
      {showResponseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowResponseModal(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-surface rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-headline mb-4">対応を記録</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-paragraph/80 mb-1">対応内容 *</label>
                <textarea
                  value={responseForm.response}
                  onChange={e => setResponseForm(f => ({ ...f, response: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                  placeholder="実施した対応を記入..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-paragraph/80 mb-1">フォローアップ（任意）</label>
                <textarea
                  value={responseForm.followUp}
                  onChange={e => setResponseForm(f => ({ ...f, followUp: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                  placeholder="今後の注意点やフォローアップ事項..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowResponseModal(null)}
                className="px-4 py-2 text-sm text-paragraph/70 hover:bg-secondary/20 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={submitResponse}
                disabled={!responseForm.response}
                className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-40"
              >
                記録する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
