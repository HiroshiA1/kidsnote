'use client';

import { useState } from 'react';
import { GrowthCategoryId, GrowthEvaluation } from '@/types/growth';
import { RadarChartView } from './RadarChartView';
import { growthCategories } from '@/lib/constants/growthCategories';

interface GrowthTimelineProps {
  evaluations: GrowthEvaluation[];
  categoryId: GrowthCategoryId;
}

export function GrowthTimeline({ evaluations, categoryId }: GrowthTimelineProps) {
  const [selectedPeriods, setSelectedPeriods] = useState<Set<string>>(() => {
    const all = new Set<string>();
    evaluations.forEach(ev => all.add(ev.id));
    return all;
  });

  const category = growthCategories.find(c => c.id === categoryId);

  const togglePeriod = (evalId: string) => {
    setSelectedPeriods(prev => {
      const next = new Set(prev);
      if (next.has(evalId)) {
        next.delete(evalId);
      } else {
        next.add(evalId);
      }
      return next;
    });
  };

  const selectedEvals = evaluations.filter(ev => selectedPeriods.has(ev.id));

  // 改善/後退した項目を検出
  const changes = (() => {
    if (selectedEvals.length < 2) return [];
    const first = selectedEvals[0];
    const last = selectedEvals[selectedEvals.length - 1];
    if (!category) return [];

    return category.items.map(item => {
      const firstScore = first.scores.find(s => s.itemId === item.id)?.score ?? 0;
      const lastScore = last.scores.find(s => s.itemId === item.id)?.score ?? 0;
      const diff = lastScore - firstScore;
      return { item, diff, firstScore, lastScore };
    }).filter(c => c.diff !== 0).sort((a, b) => b.diff - a.diff);
  })();

  return (
    <div className="space-y-4">
      {/* 学期選択チェックボックス */}
      <div className="flex flex-wrap gap-2">
        {evaluations.map(ev => (
          <label
            key={ev.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
              selectedPeriods.has(ev.id)
                ? 'border-button bg-button/10 text-headline'
                : 'border-secondary/30 text-paragraph/50 hover:bg-secondary/10'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedPeriods.has(ev.id)}
              onChange={() => togglePeriod(ev.id)}
              className="sr-only"
            />
            <span className={`w-3 h-3 rounded border flex items-center justify-center ${
              selectedPeriods.has(ev.id) ? 'bg-button border-button' : 'border-paragraph/30'
            }`}>
              {selectedPeriods.has(ev.id) && (
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </span>
            {ev.period.label}
          </label>
        ))}
      </div>

      {/* オーバーレイレーダーチャート */}
      {selectedEvals.length > 0 && (
        <RadarChartView categoryId={categoryId} evaluations={selectedEvals} height={350} />
      )}

      {/* 変化のハイライト */}
      {changes.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-paragraph/60 mb-2">期間内の変化</p>
          {changes.map(({ item, diff, firstScore, lastScore }) => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <span className={`text-xs font-bold ${diff > 0 ? 'text-tertiary' : 'text-alert'}`}>
                {diff > 0 ? `+${diff}` : diff}
              </span>
              <span className="text-headline">{item.label}</span>
              <span className="text-paragraph/40 text-xs">{firstScore} → {lastScore}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
