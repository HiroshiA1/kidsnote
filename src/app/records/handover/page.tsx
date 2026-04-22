'use client';

import { useState } from 'react';
import { HandoverData } from '@/types/intent';
import { ChildLinks } from '@/components/ChildLink';
import { formatDate, formatDateGroup } from '@/lib/formatters';
import { useRecordPage } from '@/hooks/useRecordPage';
import { PendingSection, EmptyState, RecordPageHeader } from '@/components/RecordPageTemplate';

type FilterMode = 'all' | 'unread' | 'urgent';

export default function HandoverRecordsPage() {
  const { pendingMessages, savedMessages, groupByDate, confirmMessage, editMessage, cancelMessage, markForRecord } = useRecordPage({ intentType: 'handover' });
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [escalatedIds, setEscalatedIds] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const filteredMessages = savedMessages.filter(m => {
    if (filterMode === 'unread') return !readIds.has(m.id);
    if (filterMode === 'urgent') return (m.result?.data as HandoverData)?.urgent;
    return true;
  });

  const unreadCount = savedMessages.filter(m => !readIds.has(m.id)).length;
  const urgentCount = savedMessages.filter(m => (m.result?.data as HandoverData)?.urgent).length;

  const toggleRead = (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleConfirmed = (id: string) => {
    setConfirmedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    // 確認したら既読にもする
    setReadIds(prev => new Set(prev).add(id));
  };

  const markAllRead = () => {
    setReadIds(new Set(savedMessages.map(m => m.id)));
  };

  const escalate = (id: string) => {
    setEscalatedIds(prev => new Set(prev).add(id));
  };


  const grouped = groupByDate(filteredMessages);

  return (
    <div className="min-h-screen">
      <RecordPageHeader
        title="申し送り"
        rightContent={
          <button
            onClick={markAllRead}
            className="text-xs px-3 py-1.5 text-button hover:bg-button/10 rounded-lg transition-colors"
          >
            すべて既読にする
          </button>
        }
      >
        <div className="flex gap-2">
          {([['all', `すべて (${savedMessages.length})`], ['unread', `未読 (${unreadCount})`], ['urgent', `至急 (${urgentCount})`]] as const).map(([mode, label]) => {
            const activeColor = mode === 'urgent' ? 'bg-alert text-white' : 'bg-button text-white';
            return (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filterMode === mode ? activeColor : 'bg-secondary/20 text-paragraph/70 hover:bg-secondary/30'}`}
              >
                {label}
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
          skeletonColor="bg-button"
        />

        {/* 保存済み（日付グループ） */}
        {Object.entries(grouped).map(([dateKey, dayMessages]) => (
          <section key={dateKey}>
            <h2 className="text-sm font-medium text-paragraph/60 mb-3">
              {formatDateGroup(dayMessages[0].timestamp)}
            </h2>
            <div className="space-y-3">
              {dayMessages.map(message => {
                const data = message.result?.data as HandoverData;
                const isRead = readIds.has(message.id);
                const isConfirmedByMe = confirmedIds.has(message.id);
                const isEscalated = escalatedIds.has(message.id);

                return (
                  <div
                    key={message.id}
                    className={`rounded-lg p-4 border-l-4 transition-all ${
                      data.urgent
                        ? 'bg-alert/10 border-alert'
                        : isRead
                          ? 'bg-secondary/10 border-secondary/40'
                          : 'bg-button/10 border-button'
                    }`}
                    onClick={() => !isRead && toggleRead(message.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {!isRead && (
                            <span className="w-2 h-2 bg-button rounded-full flex-shrink-0" title="未読" />
                          )}
                          {data.urgent && (
                            <span className="text-xs px-2 py-0.5 bg-alert rounded-full text-white font-medium">
                              至急
                            </span>
                          )}
                          {isEscalated && (
                            <span className="text-xs px-2 py-0.5 bg-purple-500 rounded-full text-white font-medium">
                              エスカレーション済
                            </span>
                          )}
                          {message.linkedChildIds && message.linkedChildIds.length > 0 && (
                            <span className="text-xs font-medium">
                              <ChildLinks childIds={message.linkedChildIds} />
                            </span>
                          )}
                          <span className="text-xs text-paragraph/60">宛先: {data.target}</span>
                        </div>
                        <p className={`text-sm ${isRead ? 'text-paragraph/70' : 'text-headline font-medium'}`}>
                          {data.message}
                        </p>

                        {/* アクションボタン */}
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleConfirmed(message.id); }}
                            className={`text-xs px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                              isConfirmedByMe
                                ? 'bg-tertiary/20 text-tertiary'
                                : 'bg-secondary/20 text-paragraph/60 hover:bg-secondary/30'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            {isConfirmedByMe ? '確認済' : '確認'}
                          </button>
                          {!isEscalated && (
                            <button
                              onClick={(e) => { e.stopPropagation(); escalate(message.id); }}
                              className="text-xs px-3 py-1 rounded-lg bg-secondary/20 text-paragraph/60 hover:bg-purple-100 hover:text-purple-600 transition-colors flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                              </svg>
                              エスカレーション
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleRead(message.id); }}
                            className="text-xs px-3 py-1 rounded-lg bg-secondary/20 text-paragraph/60 hover:bg-secondary/30 transition-colors"
                          >
                            {isRead ? '未読に戻す' : '既読にする'}
                          </button>
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            }
            message={filterMode === 'unread' ? '未読の申し送りはありません' : filterMode === 'urgent' ? '至急の申し送りはありません' : '申し送りがありません'}
          />
        )}
      </main>
    </div>
  );
}
