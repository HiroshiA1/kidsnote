'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useApp } from '@/components/AppLayout';
import { RadarChartView } from '@/components/growth/RadarChartView';
import { GrowthEvaluationForm } from '@/components/growth/GrowthEvaluationForm';
import { GrowthTimeline } from '@/components/growth/GrowthTimeline';
import { GrowthCategoryId, GrowthEvaluation, GrowthItemScore, GrowthPeriod } from '@/types/growth';
import { growthCategories } from '@/lib/constants/growthCategories';

const DEFAULT_PERIODS: GrowthPeriod[] = [
  { year: 2024, semester: 1, label: '2024年度 1学期' },
  { year: 2024, semester: 2, label: '2024年度 2学期' },
  { year: 2024, semester: 3, label: '2024年度 3学期' },
  { year: 2025, semester: 1, label: '2025年度 1学期' },
];

export default function RecordPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { children: childrenData, updateChild } = useApp();

  const initialTab = (searchParams.get('tab') as GrowthCategoryId) || 'ten_figures';
  const [activeTab, setActiveTab] = useState<GrowthCategoryId>(initialTab);
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState(() => DEFAULT_PERIODS.length - 1);
  const [showTimeline, setShowTimeline] = useState(false);

  const child = childrenData.find(c => c.id === params.id);

  if (!child) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-paragraph/60">園児が見つかりません</p>
      </div>
    );
  }

  const childName = `${child.lastNameKanji || child.lastName} ${child.firstNameKanji || child.firstName}`;
  const evaluations = child.growthEvaluations || [];
  const selectedPeriod = DEFAULT_PERIODS[selectedPeriodIdx];

  // 現在選択中の学期の評価を取得（なければ作成）
  const currentEval = evaluations.find(
    ev => ev.period.year === selectedPeriod.year && ev.period.semester === selectedPeriod.semester
  );

  const currentScores = currentEval?.scores || [];

  // カテゴリ別にフィルタした評価データ
  const categoryEvals = evaluations.map(ev => ({
    ...ev,
    scores: ev.scores.filter(s => {
      const cat = growthCategories.find(c => c.id === activeTab);
      return cat?.items.some(item => item.id === s.itemId);
    }),
  }));

  const handleUpdateScores = (newScores: GrowthItemScore[]) => {
    const activeCategory = growthCategories.find(c => c.id === activeTab);
    if (!activeCategory) return;

    const activeItemIds = new Set(activeCategory.items.map(i => i.id));

    // 現在のカテゴリ以外のスコアはそのまま保持
    const otherScores = currentScores.filter(s => !activeItemIds.has(s.itemId));
    const mergedScores = [...otherScores, ...newScores.filter(s => activeItemIds.has(s.itemId))];

    let updatedEvaluations: GrowthEvaluation[];
    if (currentEval) {
      updatedEvaluations = evaluations.map(ev =>
        ev.id === currentEval.id ? { ...ev, scores: mergedScores, updatedAt: new Date() } : ev
      );
    } else {
      const newEval: GrowthEvaluation = {
        id: `eval-${child.id}-${selectedPeriod.year}-${selectedPeriod.semester}`,
        childId: child.id,
        period: selectedPeriod,
        scores: mergedScores,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      updatedEvaluations = [...evaluations, newEval];
    }

    updateChild({ ...child, growthEvaluations: updatedEvaluations });
  };

  // アクティブカテゴリのスコアのみ
  const activeCatScores = currentScores.filter(s => {
    const cat = growthCategories.find(c => c.id === activeTab);
    return cat?.items.some(item => item.id === s.itemId);
  });

  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/children/${params.id}`} className="text-paragraph/60 hover:text-paragraph transition-colors text-sm">
              ← 園児詳細に戻る
            </Link>
            <h1 className="text-xl font-bold text-headline">成長記録</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* 園児情報 + 学期セレクター */}
        <section className="bg-surface rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-headline">{childName}</h2>
              <p className="text-sm text-paragraph/60">{child.className}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTimeline(!showTimeline)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  showTimeline ? 'bg-button text-white border-button' : 'bg-surface border-secondary/30 text-paragraph hover:bg-secondary/20'
                }`}
              >
                時間軸比較
              </button>
              <select
                value={selectedPeriodIdx}
                onChange={e => setSelectedPeriodIdx(Number(e.target.value))}
                className="px-4 py-2 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
              >
                {DEFAULT_PERIODS.map((p, i) => (
                  <option key={i} value={i}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* 時間軸比較ビュー */}
        {showTimeline && categoryEvals.length > 0 && (
          <section className="bg-surface rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-headline mb-4">
              {growthCategories.find(c => c.id === activeTab)?.icon}{' '}
              {growthCategories.find(c => c.id === activeTab)?.label} — 時間軸比較
            </h3>
            <GrowthTimeline evaluations={categoryEvals} categoryId={activeTab} />
          </section>
        )}

        {/* カテゴリタブ */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {growthCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === cat.id
                  ? 'text-white shadow-sm'
                  : 'bg-surface border border-secondary/30 text-paragraph hover:bg-secondary/20'
              }`}
              style={activeTab === cat.id ? { backgroundColor: cat.color } : undefined}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* レーダーチャート */}
        <section className="bg-surface rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-headline mb-4">
            {growthCategories.find(c => c.id === activeTab)?.label}
          </h3>
          {currentEval ? (
            <RadarChartView
              categoryId={activeTab}
              evaluations={[currentEval].map(ev => ({
                ...ev,
                scores: ev.scores.filter(s => {
                  const cat = growthCategories.find(c => c.id === activeTab);
                  return cat?.items.some(item => item.id === s.itemId);
                }),
              }))}
              height={350}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-paragraph/50">
              この学期の評価データはまだありません。下のフォームから入力してください。
            </div>
          )}
        </section>

        {/* 評価フォーム */}
        <section className="bg-surface rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-headline mb-4">評価入力</h3>
          <GrowthEvaluationForm
            categoryId={activeTab}
            scores={activeCatScores}
            onUpdate={handleUpdateScores}
          />
        </section>
      </main>
    </div>
  );
}
