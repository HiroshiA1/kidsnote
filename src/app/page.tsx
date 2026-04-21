'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppLayout';
import { InputMessage } from '@/types/intent';
import { sampleRecords } from '@/lib/sampleData';
import { getChildDisplayName } from '@/lib/childrenStore';
import { ChildSearchWidget } from '@/components/ChildSearchWidget';
import { HandoverWidget } from '@/components/dashboard/HandoverWidget';
import { IncidentWidget } from '@/components/dashboard/IncidentWidget';
import { ClassGrowthWidget } from '@/components/dashboard/ClassGrowthWidget';
import { defaultClasses } from '@/types/settings';

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
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
  const {
    messages, children: childrenData, staff, settings,
    selectedChildId, setSelectedChildId, currentStaffId,
  } = useApp();

  const [today, setToday] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const classes = settings.classes ?? defaultClasses;
  const currentStaff = staff.find(s => s.id === currentStaffId);

  const selectedChild = selectedChildId ? childrenData.find(c => c.id === selectedChildId) : null;

  useEffect(() => {
    setToday(new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }));
    if (!localStorage.getItem('kidsnote_welcomed')) {
      setShowWelcome(true);
    }
  }, []);

  // 保存済みデータ（新しい入力 + サンプル）
  const savedMessages = [...messages.filter(m => m.status === 'saved'), ...sampleRecords];
  const todayRecords = savedMessages.filter(m => isToday(m.timestamp));

  const handoverRecords = todayRecords.filter(m => m.result?.intent === 'handover');
  const incidentRecords = todayRecords.filter(m => m.result?.intent === 'incident');
  const growthRecords = todayRecords.filter(m => m.result?.intent === 'growth');

  return (
    <div className="min-h-screen">
      {showWelcome && (
        <WelcomeModal onClose={() => {
          setShowWelcome(false);
          localStorage.setItem('kidsnote_welcomed', '1');
        }} />
      )}

      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-headline">ダッシュボード</h1>
          <span className="text-sm text-paragraph/60">{today}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-6">
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

        {/* 上部: 申し送り + ヒヤリハット 2カラム */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HandoverWidget records={handoverRecords} />
          <IncidentWidget records={incidentRecords} />
        </section>

        {/* 下部: 成長記録 */}
        <section>
          <ClassGrowthWidget
            records={growthRecords}
            children={childrenData}
            classes={classes}
            currentStaff={currentStaff}
          />
        </section>

        {/* クイックリンク */}
        <section>
          <h2 className="text-lg font-bold text-headline mb-4">クイックアクセス</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/children', icon: '&#128101;', label: '園児一覧', color: 'bg-button/10 text-button' },
              { href: '/staff', icon: '&#128100;', label: '職員一覧', color: 'bg-tertiary/20 text-tertiary' },
              { href: '/plans/curriculum', icon: '&#128221;', label: '保育計画', color: 'bg-amber-100 text-amber-700' },
              { href: '/calendar', icon: '&#128197;', label: 'カレンダー', color: 'bg-purple-100 text-purple-700' },
            ].map(item => (
              <Link key={item.href} href={item.href}>
                <div className="bg-surface rounded-xl p-4 border border-secondary/20 hover:shadow-md transition-shadow text-center">
                  <div className={`w-10 h-10 mx-auto rounded-lg ${item.color} flex items-center justify-center mb-2`}>
                    <span className="text-lg" dangerouslySetInnerHTML={{ __html: item.icon }} />
                  </div>
                  <p className="text-sm font-medium text-headline">{item.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
