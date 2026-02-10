'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppLayout';
import { IntentCard } from '@/components/IntentCard';
import { IntentType, InputMessage, GrowthData, IncidentData, HandoverData, ChildUpdateData } from '@/types/intent';
import { sampleRecords } from '@/lib/sampleData';

const intentConfig: Record<string, { label: string; bgColor: string; borderColor: string; icon: string; cardBg: string; href: string }> = {
  growth: {
    label: '成長記録',
    bgColor: 'bg-tertiary/30',
    borderColor: 'border-tertiary',
    cardBg: 'bg-tertiary/20',
    icon: '🌱',
    href: '/records/growth',
  },
  incident: {
    label: 'ヒヤリハット',
    bgColor: 'bg-alert/20',
    borderColor: 'border-alert',
    cardBg: 'bg-alert/10',
    icon: '⚠️',
    href: '/records/incident',
  },
  handover: {
    label: '申し送り',
    bgColor: 'bg-secondary/30',
    borderColor: 'border-button',
    cardBg: 'bg-secondary/20',
    icon: '📝',
    href: '/records/handover',
  },
  child_update: {
    label: '園児情報更新',
    bgColor: 'bg-surface',
    borderColor: 'border-paragraph/30',
    cardBg: 'bg-paragraph/5',
    icon: '👤',
    href: '/records/child-update',
  },
};

const recordIntentTypes = ['growth', 'incident', 'handover', 'child_update'] as const;

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function getRecordSummary(message: InputMessage): string {
  if (!message.result) return message.content;
  const { intent, data } = message.result;
  switch (intent) {
    case 'growth':
      return `${(data as GrowthData).child_names.join('、')}: ${(data as GrowthData).summary}`;
    case 'incident':
      return `${(data as IncidentData).child_name}: ${(data as IncidentData).description}`;
    case 'handover':
      return (data as HandoverData).message;
    case 'child_update':
      return `${(data as ChildUpdateData).child_name}: ${(data as ChildUpdateData).new_value}`;
    default:
      return message.content;
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function TodayRecordSection({
  intentType,
  records,
}: {
  intentType: string;
  records: InputMessage[];
}) {
  const [expanded, setExpanded] = useState(records.length > 0);
  const config = intentConfig[intentType];
  const isEmpty = records.length === 0;

  return (
    <div className={`rounded-xl border ${isEmpty ? 'border-paragraph/10 opacity-50' : 'border-secondary/20'} overflow-hidden`}>
      <button
        onClick={() => !isEmpty && setExpanded(!expanded)}
        className={`w-full flex items-center gap-3 px-4 py-3 ${isEmpty ? 'bg-paragraph/5 cursor-default' : `${config.bgColor} cursor-pointer hover:opacity-90`} transition-opacity`}
      >
        <span className="text-xl">{config.icon}</span>
        <span className={`font-medium ${isEmpty ? 'text-paragraph/40' : 'text-headline'}`}>
          {config.label}
        </span>
        <span className={`ml-auto text-sm px-2 py-0.5 rounded-full ${
          isEmpty
            ? 'bg-paragraph/10 text-paragraph/40'
            : `${config.cardBg} text-headline`
        }`}>
          {records.length}件
        </span>
        {!isEmpty && (
          <svg
            className={`w-4 h-4 text-paragraph/60 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {expanded && !isEmpty && (
        <div className="bg-surface divide-y divide-secondary/10">
          {records
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .map(record => (
              <div key={record.id} className="px-4 py-3 hover:bg-secondary/5 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-xs text-paragraph/50 whitespace-nowrap mt-0.5">
                    {formatTime(record.timestamp)}
                  </span>
                  <p className="text-sm text-headline flex-1">{getRecordSummary(record)}</p>
                  {record.result?.intent === 'incident' && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      (record.result.data as IncidentData).severity === 'high'
                        ? 'bg-alert/20 text-alert'
                        : (record.result.data as IncidentData).severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-paragraph/10 text-paragraph/60'
                    }`}>
                      {(record.result.data as IncidentData).severity === 'high' ? '重大' :
                       (record.result.data as IncidentData).severity === 'medium' ? '中度' : '軽微'}
                    </span>
                  )}
                  {record.result?.intent === 'handover' && (record.result.data as HandoverData).urgent && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-alert/20 text-alert">
                      至急
                    </span>
                  )}
                </div>
                {record.result?.intent === 'growth' && (data => (
                  data.tags.length > 0 && (
                    <div className="flex gap-1 mt-1.5 ml-12">
                      {data.tags.map(tag => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full bg-tertiary/20 text-paragraph/60">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )
                ))(record.result.data as GrowthData)}
              </div>
            ))}
          <Link href={config.href}>
            <div className="px-4 py-2 text-center text-xs text-button hover:bg-button/5 transition-colors">
              すべての{config.label}を見る →
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { messages, confirmMessage, editMessage, cancelMessage, markForRecord } = useApp();
  const [today, setToday] = useState('');

  useEffect(() => {
    setToday(new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }));
  }, []);

  // 新しい入力（processing/confirmed）
  const pendingMessages = messages.filter(m => m.status === 'processing' || m.status === 'confirmed');

  // 保存済みデータ（新しい入力 + サンプル）
  const savedMessages = [...messages.filter(m => m.status === 'saved'), ...sampleRecords];

  // 今日の記録のみ
  const todayRecords = savedMessages.filter(m => isToday(m.timestamp));

  // タイプ別に分類
  const recordsByType = (intentType: string) =>
    todayRecords.filter(m => m.result?.intent === intentType);

  const todayTotal = todayRecords.length;

  return (
    <div className="min-h-screen">
      {/* ページヘッダー */}
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-headline">ダッシュボード</h1>
          <span className="text-sm text-paragraph/60">{today}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6 space-y-8">
        {/* 新しい入力（確認待ち） */}
        {pendingMessages.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-button rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-headline">新しい入力</h2>
              <span className="ml-auto text-sm text-white bg-button px-2 py-0.5 rounded-full">
                {pendingMessages.length}件
              </span>
            </div>
            <div className="space-y-4">
              {pendingMessages.map(message => (
                <div key={message.id}>
                  {message.status === 'processing' && (
                    <div className="bg-surface rounded-lg p-4 shadow-sm animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-secondary/50 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-secondary/50 rounded w-3/4" />
                          <div className="h-3 bg-secondary/30 rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  )}
                  {message.status === 'confirmed' && message.result && (
                    <IntentCard
                      result={message.result}
                      originalText={message.content}
                      onConfirm={() => confirmMessage(message.id)}
                      onEdit={(newIntent) => editMessage(message.id, newIntent)}
                      onCancel={() => cancelMessage(message.id)}
                      onLinkToGrowth={() => {}}
                      onMarkForRecord={() => markForRecord(message.id)}
                      isMarkedForRecord={message.isMarkedForRecord}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 本日の記録（タイプ別セクション） */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-headline">本日の記録</h2>
            <span className="text-sm text-paragraph/50">合計 {todayTotal}件</span>
          </div>
          <div className="space-y-3">
            {recordIntentTypes.map(intentType => (
              <TodayRecordSection
                key={intentType}
                intentType={intentType}
                records={recordsByType(intentType)}
              />
            ))}
          </div>
        </section>

        {/* クイックリンク */}
        <section>
          <h2 className="text-lg font-bold text-headline mb-4">クイックアクセス</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/children">
              <div className="bg-surface rounded-xl p-4 border border-secondary/20 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-button/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-button" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-headline">園児一覧</p>
                    <p className="text-xs text-paragraph/60">園児情報を管理</p>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/staff">
              <div className="bg-surface rounded-xl p-4 border border-secondary/20 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-tertiary/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-headline">職員一覧</p>
                    <p className="text-xs text-paragraph/60">職員情報を管理</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
