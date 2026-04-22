'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApp } from '@/components/AppLayout';
import { ChildEditModal } from '@/components/ChildEditModal';
import DocumentGenerateModal from '@/components/DocumentGenerateModal';
import { MiniRadarChart } from '@/components/growth/RadarChartView';
import { GrowthCategoryId, GrowthEvaluation } from '@/types/growth';
import { growthCategories } from '@/lib/constants/growthCategories';
import { InputMessage, GrowthData } from '@/types/intent';
import { ChildRelationships } from '@/components/ChildRelationships';

function EpisodeCard({ episode, isLinked }: { episode: InputMessage; isLinked: boolean }) {
  const formatDate = (date: Date) =>
    date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });

  return (
    <div
      className={`p-3 rounded-lg border ${
        isLinked ? 'border-button bg-button/5' : 'border-secondary/30 bg-surface'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm text-headline">
            {(episode.result?.data as GrowthData)?.summary || episode.content}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-paragraph/60">{formatDate(episode.timestamp)}</span>
            {episode.isMarkedForRecord && (
              <span className="text-xs px-2 py-0.5 bg-button/20 text-button rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                要録用
              </span>
            )}
          </div>
        </div>
        {isLinked && (
          <span className="text-xs px-2 py-0.5 bg-button text-white rounded-full">
            根拠
          </span>
        )}
      </div>
    </div>
  );
}

export default function ChildDetailPage() {
  const params = useParams();
  const { children: childrenData, messages, updateChild, setSelectedChildId } = useApp();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);

  const child = childrenData.find(c => c.id === params.id);

  // 園児詳細ページでは自動的にselectedChildIdを設定（AIチャット連携）
  useEffect(() => {
    if (child) {
      setSelectedChildId(child.id);
    }
    return () => setSelectedChildId(null);
  }, [child, setSelectedChildId]);

  // この園児に紐づくエピソード
  const episodes = useMemo(() => {
    if (!child) return [];
    return messages
      .filter(m => m.status === 'saved' && m.result?.intent === 'growth')
      .filter(m => {
        if (m.linkedChildIds?.includes(child.id)) return true;
        const data = m.result?.data as GrowthData;
        if (!data?.child_names) return false;
        const names = [child.firstName, child.lastName, child.firstNameKanji, child.lastNameKanji].filter(Boolean);
        return data.child_names.some(cn => names.some(n => cn.includes(n!)));
      });
  }, [messages, child]);

  if (!child) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-paragraph/60">園児が見つかりません</p>
          <Link href="/children" className="text-sm text-button hover:underline mt-2 inline-block">
            一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const age = Math.floor(
    (new Date().getTime() - child.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  const evaluations = child.growthEvaluations || [];

  return (
    <div className="min-h-screen pb-8">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/children" className="text-paragraph/60 hover:text-paragraph transition-colors text-sm">
              ← 戻る
            </Link>
            <h1 className="text-lg sm:text-xl font-bold text-headline">園児詳細</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDocModal(true)}
              className="px-3 sm:px-4 py-2 bg-tertiary text-headline rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
              title="文書を生成"
            >
              📝 <span className="hidden sm:inline">文書生成</span>
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="px-3 sm:px-4 py-2 bg-button text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="hidden sm:inline">編集</span>
            </button>
          </div>
        </div>
      </header>

      {/* 文書生成モーダル */}
      <DocumentGenerateModal
        open={showDocModal}
        onClose={() => setShowDocModal(false)}
        child={child}
        messages={messages}
      />

      {/* 編集モーダル */}
      {showEditModal && (
        <ChildEditModal
          child={child}
          onSave={(updated) => {
            updateChild(updated);
            setShowEditModal(false);
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}

      <main className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-6 space-y-6">
        {/* 基本情報カード */}
        <section className="bg-surface rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-headline">
                {child.lastNameKanji || child.lastName} {child.firstNameKanji || child.firstName}
              </h2>
              {(child.lastNameKanji || child.firstNameKanji) && (
                <p className="text-sm text-paragraph/60 mt-1">
                  {child.lastName} {child.firstName}
                </p>
              )}
            </div>
            <span className="px-3 py-1 bg-secondary/30 rounded-full text-sm text-paragraph">
              {child.className}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 text-sm">
            <div>
              <span className="text-paragraph/60">年齢</span>
              <p className="text-headline font-medium">{age}歳</p>
            </div>
            <div>
              <span className="text-paragraph/60">性別</span>
              <p className="text-headline font-medium">
                {child.gender === 'male' ? '男の子' : child.gender === 'female' ? '女の子' : 'その他'}
              </p>
            </div>
            <div>
              <span className="text-paragraph/60">生年月日</span>
              <p className="text-headline font-medium">
                {child.birthDate.toLocaleDateString('ja-JP')}
              </p>
            </div>
            <div>
              <span className="text-paragraph/60">緊急連絡先</span>
              <p className="text-headline font-medium">{child.emergencyContact.name}（{child.emergencyContact.relationship}）</p>
            </div>
          </div>

          {/* アレルギー */}
          {child.allergies.length > 0 && (
            <div className="mt-4 pt-4 border-t border-paragraph/10">
              <span className="text-sm text-paragraph/60">アレルギー</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {child.allergies.map((allergy, i) => (
                  <span key={i} className="px-3 py-1 bg-alert/20 text-alert rounded-full text-sm">
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 特性 */}
          {child.characteristics.length > 0 && (
            <div className="mt-4 pt-4 border-t border-paragraph/10">
              <span className="text-sm text-paragraph/60">特性・メモ</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {child.characteristics.map((char, i) => (
                  <span key={i} className="px-3 py-1 bg-tertiary/30 text-headline rounded-full text-sm">
                    {char}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 興味・関心 */}
          {child.interests && child.interests.length > 0 && (
            <div className="mt-4 pt-4 border-t border-paragraph/10">
              <span className="text-sm text-paragraph/60">現在の興味・関心</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {child.interests.map((interest, i) => (
                  <span key={i} className="px-3 py-1 bg-button/15 text-button rounded-full text-sm">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 友達関係 */}
        <ChildRelationships
          child={child}
          allChildren={childrenData}
          onUpdate={(relationships) => {
            updateChild({ ...child, relationships });
          }}
        />

        {/* 成長記録 (3カテゴリ) */}
        <section className="bg-surface rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-headline">成長記録</h3>
            <Link
              href={`/children/${child.id}/record`}
              className="text-sm text-button hover:text-button/80 transition-colors"
            >
              詳細な評価 →
            </Link>
          </div>

          {evaluations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {growthCategories.map(cat => (
                <div key={cat.id} className="border border-secondary/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{cat.icon}</span>
                    <h4 className="text-sm font-medium text-headline truncate">{cat.label}</h4>
                  </div>
                  <MiniRadarChart categoryId={cat.id as GrowthCategoryId} evaluations={evaluations} />
                  <Link
                    href={`/children/${child.id}/record?tab=${cat.id}`}
                    className="text-xs text-button hover:underline block text-center mt-2"
                  >
                    詳細を見る →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-paragraph/50 text-center py-8">
              まだ成長評価データがありません
            </p>
          )}
        </section>

        {/* 全エピソード */}
        <section className="bg-surface rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-headline mb-4">
            エピソード ({episodes.length}件)
          </h3>
          {episodes.length > 0 ? (
            <div className="space-y-2">
              {episodes.map(ep => (
                <EpisodeCard key={ep.id} episode={ep} isLinked={false} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-paragraph/50 text-center py-4">
              まだエピソードがありません。入力欄から記録を追加してください。
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
