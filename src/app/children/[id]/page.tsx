'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Child, GrowthLevel, GrowthDomain, growthDomainLabels, growthLevelLabels } from '@/types/child';
import { InputMessage, GrowthData } from '@/types/intent';

// サンプルデータ
const sampleChild: Child & { growthLevels: GrowthLevel[] } = {
  id: '1',
  firstName: 'たろう',
  lastName: 'やまだ',
  firstNameKanji: '太郎',
  lastNameKanji: '山田',
  birthDate: new Date('2020-04-15'),
  classId: 'sakura',
  className: 'さくら組',
  gender: 'male',
  allergies: ['卵'],
  characteristics: ['活発', '友達思い'],
  emergencyContact: {
    name: '山田花子',
    phone: '090-1234-5678',
    relationship: '母',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  growthLevels: [
    { domain: 'health', level: 3, lastUpdated: new Date('2025-01-08'), linkedEpisodeIds: ['ep1', 'ep2'] },
    { domain: 'relationships', level: 2, lastUpdated: new Date('2025-01-05'), linkedEpisodeIds: ['ep3'] },
    { domain: 'environment', level: 2, lastUpdated: new Date('2025-01-03'), linkedEpisodeIds: [] },
    { domain: 'language', level: 3, lastUpdated: new Date('2025-01-10'), linkedEpisodeIds: ['ep4'] },
    { domain: 'expression', level: 2, lastUpdated: new Date('2025-01-01'), linkedEpisodeIds: [] },
  ],
};

const sampleEpisodes: InputMessage[] = [
  {
    id: 'ep1',
    content: '今日は初めて鉄棒で逆上がりができた',
    timestamp: new Date('2025-01-08T10:30:00'),
    status: 'saved',
    isMarkedForRecord: true,
    result: {
      intent: 'growth',
      data: {
        child_names: ['たろう'],
        summary: '初めて鉄棒で逆上がりができた',
        tags: ['運動', '達成'],
      } as GrowthData,
    },
  },
  {
    id: 'ep2',
    content: '給食を残さず食べられるようになった',
    timestamp: new Date('2025-01-06T12:00:00'),
    status: 'saved',
    isMarkedForRecord: false,
    result: {
      intent: 'growth',
      data: {
        child_names: ['たろう'],
        summary: '給食を残さず食べられるようになった',
        tags: ['食事', '成長'],
      } as GrowthData,
    },
  },
  {
    id: 'ep3',
    content: '友達と協力してブロックで大きな城を作った',
    timestamp: new Date('2025-01-05T14:00:00'),
    status: 'saved',
    isMarkedForRecord: true,
    result: {
      intent: 'growth',
      data: {
        child_names: ['たろう', 'けんた'],
        summary: '友達と協力してブロックで大きな城を作った',
        tags: ['協調性', '創作'],
      } as GrowthData,
    },
  },
  {
    id: 'ep4',
    content: '絵本の内容を自分の言葉で説明できた',
    timestamp: new Date('2025-01-10T11:00:00'),
    status: 'saved',
    isMarkedForRecord: true,
    result: {
      intent: 'growth',
      data: {
        child_names: ['たろう'],
        summary: '絵本の内容を自分の言葉で説明できた',
        tags: ['言語', '理解力'],
      } as GrowthData,
    },
  },
];

function GrowthLevelBar({ level, domain }: { level: 1 | 2 | 3 | 4; domain: GrowthDomain }) {
  const colors = {
    1: 'bg-paragraph/30',
    2: 'bg-secondary',
    3: 'bg-tertiary',
    4: 'bg-button',
  };

  return (
    <div className="flex-1">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-headline">{growthDomainLabels[domain]}</span>
        <span className="text-xs text-paragraph/60">
          Lv.{level} {growthLevelLabels[level]}
        </span>
      </div>
      <div className="h-3 bg-paragraph/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[level]} rounded-full transition-all duration-500`}
          style={{ width: `${level * 25}%` }}
        />
      </div>
    </div>
  );
}

function GrowthLevelSelector({
  currentLevel,
  onSelect,
}: {
  currentLevel: 1 | 2 | 3 | 4;
  onSelect: (level: 1 | 2 | 3 | 4) => void;
}) {
  return (
    <div className="flex gap-2">
      {([1, 2, 3, 4] as const).map(level => (
        <button
          key={level}
          onClick={() => onSelect(level)}
          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
            level === currentLevel
              ? 'bg-button text-white'
              : 'bg-secondary/30 text-paragraph hover:bg-secondary/50'
          }`}
        >
          Lv.{level}
        </button>
      ))}
    </div>
  );
}

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
  const [child, setChild] = useState(sampleChild);
  const [selectedDomain, setSelectedDomain] = useState<GrowthDomain | null>(null);
  const [episodes] = useState(sampleEpisodes);

  const age = Math.floor(
    (new Date().getTime() - child.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  const handleLevelChange = (domain: GrowthDomain, newLevel: 1 | 2 | 3 | 4) => {
    setChild(prev => ({
      ...prev,
      growthLevels: prev.growthLevels.map(gl =>
        gl.domain === domain ? { ...gl, level: newLevel, lastUpdated: new Date() } : gl
      ),
    }));
  };

  const currentGrowthLevel = selectedDomain
    ? child.growthLevels.find(gl => gl.domain === selectedDomain)
    : null;

  return (
    <div className="min-h-screen pb-8">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/children"
              className="text-paragraph/60 hover:text-paragraph transition-colors text-sm"
            >
              ← 一覧に戻る
            </Link>
            <h1 className="text-xl font-bold text-headline">園児詳細</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 基本情報カード */}
        <section className="bg-surface rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-headline">
                {child.lastName} {child.firstName}
              </h2>
              {(child.lastNameKanji || child.firstNameKanji) && (
                <p className="text-sm text-paragraph/60 mt-1">
                  {child.lastNameKanji} {child.firstNameKanji}
                </p>
              )}
            </div>
            <span className="px-3 py-1 bg-secondary/30 rounded-full text-sm text-paragraph">
              {child.className}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
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
        </section>

        {/* 成長記録 */}
        <section className="bg-surface rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-headline">成長記録 (5領域)</h3>
            <Link
              href={`/children/${child.id}/record`}
              className="text-sm text-button hover:text-button/80 transition-colors"
            >
              要録を作成 →
            </Link>
          </div>

          <div className="space-y-4">
            {child.growthLevels.map(gl => (
              <button
                key={gl.domain}
                onClick={() => setSelectedDomain(selectedDomain === gl.domain ? null : gl.domain)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedDomain === gl.domain
                    ? 'bg-button/10 ring-2 ring-button'
                    : 'hover:bg-secondary/20'
                }`}
              >
                <GrowthLevelBar level={gl.level} domain={gl.domain} />
                <p className="text-xs text-paragraph/50 mt-1">
                  最終更新: {gl.lastUpdated.toLocaleDateString('ja-JP')} / 根拠エピソード: {gl.linkedEpisodeIds.length}件
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* 選択した領域の詳細 */}
        {selectedDomain && currentGrowthLevel && (
          <section className="bg-surface rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-headline mb-4">
              {growthDomainLabels[selectedDomain]}の詳細
            </h3>

            <div className="mb-6">
              <p className="text-sm text-paragraph/60 mb-2">レベルを変更</p>
              <GrowthLevelSelector
                currentLevel={currentGrowthLevel.level}
                onSelect={(level) => handleLevelChange(selectedDomain, level)}
              />
            </div>

            <div>
              <p className="text-sm text-paragraph/60 mb-2">
                関連エピソード ({currentGrowthLevel.linkedEpisodeIds.length}件)
              </p>
              <div className="space-y-2">
                {episodes
                  .filter(ep => currentGrowthLevel.linkedEpisodeIds.includes(ep.id))
                  .map(ep => (
                    <EpisodeCard key={ep.id} episode={ep} isLinked={true} />
                  ))}
                {currentGrowthLevel.linkedEpisodeIds.length === 0 && (
                  <p className="text-sm text-paragraph/50 py-4 text-center">
                    まだ根拠となるエピソードがありません
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 全エピソード */}
        <section className="bg-surface rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-headline mb-4">
            全エピソード ({episodes.length}件)
          </h3>
          <div className="space-y-2">
            {episodes.map(ep => (
              <EpisodeCard
                key={ep.id}
                episode={ep}
                isLinked={child.growthLevels.some(gl => gl.linkedEpisodeIds.includes(ep.id))}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
