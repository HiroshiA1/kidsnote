'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppLayout';
import { IntentType, InputMessage, GrowthData, IncidentData, HandoverData, ChildUpdateData } from '@/types/intent';
import { sampleRecords } from '@/lib/sampleData';
import { ChildLinks } from '@/components/ChildLink';
import { getChildDisplayName } from '@/lib/childrenStore';
import { intentConfig, recordIntentTypes } from '@/lib/constants/intentConfig';
import { ChildSearchWidget } from '@/components/ChildSearchWidget';

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function getRecordSummaryText(message: InputMessage): string {
  if (!message.result) return message.content;
  const { intent, data } = message.result;
  switch (intent) {
    case 'growth':
      return (data as GrowthData).summary;
    case 'incident':
      return (data as IncidentData).description;
    case 'handover':
      return (data as HandoverData).message;
    case 'child_update':
      return (data as ChildUpdateData).new_value;
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
  intentType: IntentType;
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
                  <div className="text-sm text-headline flex-1">
                    {record.linkedChildIds && record.linkedChildIds.length > 0 && (
                      <span className="font-medium mr-1">
                        <ChildLinks childIds={record.linkedChildIds} />:
                      </span>
                    )}
                    <span>{getRecordSummaryText(record)}</span>
                  </div>
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

/** ウェルカムモーダル */
function WelcomeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-12 h-12 bg-gradient-to-br from-button to-tertiary rounded-xl flex items-center justify-center text-white text-xl font-bold">
            K
          </span>
          <div>
            <h2 className="text-xl font-bold text-headline">KidsNote へようこそ</h2>
            <p className="text-sm text-paragraph/60">保育業務をAIがサポートします</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">&#128172;</span>
            <div>
              <p className="font-medium text-headline text-sm">自然な言葉で入力</p>
              <p className="text-xs text-paragraph/70">画面下の入力欄に日常の出来事を自由に入力してください。AIが自動で分類します。</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">&#127793;</span>
            <div>
              <p className="font-medium text-headline text-sm">自動分類</p>
              <p className="text-xs text-paragraph/70">成長記録・ヒヤリハット・申し送りなどに自動で振り分けられます。</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">&#128203;</span>
            <div>
              <p className="font-medium text-headline text-sm">サンプル入力を試す</p>
              <p className="text-xs text-paragraph/70">例: 「たろうくんが初めて自分で靴を履けました」</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-button text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          はじめる
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { messages, children: childrenData, selectedChildId, setSelectedChildId } = useApp();
  const [today, setToday] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);

  const selectedChild = selectedChildId ? childrenData.find(c => c.id === selectedChildId) : null;

  useEffect(() => {
    setToday(new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }));
    // 初回アクセス判定
    if (!localStorage.getItem('kidsnote_welcomed')) {
      setShowWelcome(true);
    }
  }, []);

  // 保存済みデータ（新しい入力 + サンプル）
  const savedMessages = [...messages.filter(m => m.status === 'saved'), ...sampleRecords];

  // 今日の記録のみ
  const todayRecords = savedMessages.filter(m => isToday(m.timestamp));

  // タイプ別に分類
  const recordsByType = (intentType: string) =>
    todayRecords.filter(m => m.result?.intent === intentType);

  const todayTotal = todayRecords.length;

  const incidentCount = recordsByType('incident').length;

  return (
    <div className="min-h-screen">
      {/* ウェルカムモーダル */}
      {showWelcome && (
        <WelcomeModal onClose={() => {
          setShowWelcome(false);
          localStorage.setItem('kidsnote_welcomed', '1');
        }} />
      )}

      {/* ページヘッダー */}
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-headline">ダッシュボード</h1>
          <span className="text-sm text-paragraph/60">{today}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-8">
        {/* 園児検索 */}
        <section>
          <ChildSearchWidget
            children={childrenData}
            selectedChildId={selectedChildId}
            onSelect={setSelectedChildId}
          />
          {selectedChild && (
            <div className="mt-3 bg-surface rounded-xl border border-secondary/20 p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-button/10 flex items-center justify-center text-lg font-bold text-button">
                  {(selectedChild.lastNameKanji || selectedChild.lastName).charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-headline">
                    {getChildDisplayName(selectedChild.id, childrenData)}
                  </p>
                  <p className="text-sm text-paragraph/60">
                    {selectedChild.className} / {selectedChild.gender === 'male' ? '男の子' : selectedChild.gender === 'female' ? '女の子' : 'その他'}
                    {selectedChild.allergies.length > 0 && ` / アレルギー: ${selectedChild.allergies.join(', ')}`}
                  </p>
                </div>
                <Link href={`/children/${selectedChild.id}`} className="text-sm text-button hover:underline">
                  詳細 →
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* 日次安全確認 */}
        <section>
          <div className={`rounded-xl border p-4 flex items-center gap-4 ${
            incidentCount > 0
              ? 'border-alert/30 bg-alert/5'
              : 'border-tertiary/30 bg-tertiary/5'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              incidentCount > 0 ? 'bg-alert/20' : 'bg-tertiary/20'
            }`}>
              <span className="text-xl">{incidentCount > 0 ? '\u26A0\uFE0F' : '\u2705'}</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-headline text-sm">
                {incidentCount > 0
                  ? `本日のヒヤリハット: ${incidentCount}件`
                  : '本日のヒヤリハット: 0件'}
              </p>
              <p className="text-xs text-paragraph/60">
                {incidentCount > 0
                  ? '内容を確認し、必要な対策を検討してください'
                  : '本日は安全に関する報告はありません'}
              </p>
            </div>
            {incidentCount > 0 && (
              <Link
                href="/records/incident"
                className="text-sm text-alert hover:underline whitespace-nowrap"
              >
                詳細を確認
              </Link>
            )}
          </div>
        </section>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
