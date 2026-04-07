'use client';

import { useState } from 'react';
import { GrowthCategoryId, GrowthItemScore } from '@/types/growth';
import { getCategoryById } from '@/lib/constants/growthCategories';

interface GrowthEvaluationFormProps {
  categoryId: GrowthCategoryId;
  scores: GrowthItemScore[];
  onUpdate: (scores: GrowthItemScore[]) => void;
  readOnly?: boolean;
}

export function GrowthEvaluationForm({ categoryId, scores, onUpdate, readOnly = false }: GrowthEvaluationFormProps) {
  const category = getCategoryById(categoryId);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const getScore = (itemId: string): GrowthItemScore | undefined =>
    scores.find(s => s.itemId === itemId);

  const handleScoreChange = (itemId: string, newScore: 1 | 2 | 3 | 4 | 5) => {
    const existing = scores.find(s => s.itemId === itemId);
    const updated = existing
      ? scores.map(s => s.itemId === itemId ? { ...s, score: newScore, updatedAt: new Date() } : s)
      : [...scores, { itemId, score: newScore, updatedAt: new Date() }];
    onUpdate(updated);
  };

  const handleEpisodeChange = (itemId: string, episode: string) => {
    const existing = scores.find(s => s.itemId === itemId);
    if (existing) {
      onUpdate(scores.map(s => s.itemId === itemId ? { ...s, episode, updatedAt: new Date() } : s));
    } else {
      onUpdate([...scores, { itemId, score: 3, episode, updatedAt: new Date() }]);
    }
  };

  const scoreLabels: Record<number, string> = { 1: '芽生え', 2: '発達中', 3: '安定', 4: '充実', 5: '発展' };

  return (
    <div className="space-y-2">
      {category.items.map(item => {
        const current = getScore(item.id);
        const isExpanded = expandedItem === item.id;

        return (
          <div key={item.id} className="border border-secondary/20 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedItem(isExpanded ? null : item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/10 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-headline">{item.label}</p>
                <p className="text-xs text-paragraph/50 truncate">{item.description}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {([1, 2, 3, 4, 5] as const).map(score => (
                  <div
                    key={score}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                      current?.score === score
                        ? 'bg-button text-white'
                        : current?.score && current.score >= score
                        ? 'bg-button/30 text-button'
                        : 'bg-secondary/20 text-paragraph/30'
                    }`}
                  >
                    {score}
                  </div>
                ))}
              </div>
              <svg
                className={`w-4 h-4 text-paragraph/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-secondary/10 pt-3">
                {!readOnly && (
                  <div>
                    <p className="text-xs text-paragraph/60 mb-2">評価を選択</p>
                    <div className="flex gap-2">
                      {([1, 2, 3, 4, 5] as const).map(score => (
                        <button
                          key={score}
                          onClick={() => handleScoreChange(item.id, score)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                            current?.score === score
                              ? 'bg-button text-white'
                              : 'bg-secondary/20 text-paragraph hover:bg-secondary/40'
                          }`}
                        >
                          {score} {scoreLabels[score]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-paragraph/60 mb-1">エピソード・メモ</p>
                  {readOnly ? (
                    <p className="text-sm text-paragraph">{current?.episode || 'なし'}</p>
                  ) : (
                    <textarea
                      value={current?.episode || ''}
                      onChange={e => handleEpisodeChange(item.id, e.target.value)}
                      placeholder="具体的なエピソードを記入..."
                      className="w-full h-20 px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30 resize-none"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
