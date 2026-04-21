'use client';

import { useState } from 'react';
import { CurriculumPlan, LEVEL_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/types/carePlan';
import { ClassInfo } from '@/types/settings';

interface WeeklyPlanViewProps {
  weekStart: string; // YYYY-MM-DD (Monday)
  classId: string;
  classInfo: ClassInfo | undefined;
  weeklyPlan: CurriculumPlan | null;
  dailyPlans: CurriculumPlan[];
  currentStaffId: string;
  onSavePlan: (plan: CurriculumPlan) => void;
  onGenerateWeekly: (classId: string, weekStart: string) => void;
  isGenerating?: boolean;
}

function getWeekDates(weekStart: string): string[] {
  const dates: string[] = [];
  const start = new Date(weekStart);
  for (let i = 0; i < 5; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

const DAY_LABELS = ['月', '火', '水', '木', '金'];

export function WeeklyPlanView({
  weekStart,
  classId,
  classInfo,
  weeklyPlan,
  dailyPlans,
  currentStaffId,
  onSavePlan,
  onGenerateWeekly,
  isGenerating,
}: WeeklyPlanViewProps) {
  const [editMode, setEditMode] = useState(false);
  const weekDates = getWeekDates(weekStart);

  const [formData, setFormData] = useState<CurriculumPlan>(weeklyPlan ?? {
    id: `weekly-${classId}-${weekStart}`,
    level: 'weekly',
    classId,
    title: `${weekStart}週 ${classInfo?.name ?? ''} 週案`,
    period: `${weekStart}週`,
    objectives: [''],
    content: '',
    childrenActivities: [''],
    teacherSupport: [''],
    environment: [''],
    evaluation: '',
    status: 'draft',
    authorId: currentStaffId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const handleSave = () => {
    onSavePlan({ ...formData, updatedAt: new Date() });
    setEditMode(false);
  };

  return (
    <div className="space-y-4">
      {/* 週案ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-headline">
          {classInfo?.name} 週案
        </h3>
        <div className="flex gap-2">
          {!weeklyPlan && (
            <button
              onClick={() => onGenerateWeekly(classId, weekStart)}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {isGenerating ? 'AI生成中...' : 'AI週案生成'}
            </button>
          )}
          {weeklyPlan && !editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="px-3 py-1.5 text-xs text-button hover:text-button/80 transition-colors"
            >
              編集
            </button>
          )}
          {editMode && (
            <>
              <button onClick={() => setEditMode(false)} className="px-3 py-1.5 text-xs text-paragraph/60">キャンセル</button>
              <button onClick={handleSave} className="px-4 py-1.5 bg-button text-white text-xs font-medium rounded-lg">保存</button>
            </>
          )}
        </div>
      </div>

      {/* 日案サマリーテーブル */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-secondary/10">
              <th className="text-left px-2 py-1.5 border border-secondary/20 w-16"></th>
              {weekDates.map((d, i) => {
                const dp = dailyPlans.find(p => p.date === d);
                return (
                  <th key={d} className="text-center px-2 py-1.5 border border-secondary/20">
                    <div>{DAY_LABELS[i]}</div>
                    <div className="text-paragraph/50 font-normal">{d.slice(5)}</div>
                    {dp && (
                      <span className={`inline-block mt-0.5 px-1.5 py-0 rounded text-[10px] ${STATUS_COLORS[dp.status]}`}>
                        {STATUS_LABELS[dp.status]}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {(['objectives', 'childrenActivities', 'teacherSupport'] as const).map(field => (
              <tr key={field}>
                <td className="px-2 py-1.5 border border-secondary/20 font-medium bg-secondary/5">
                  {field === 'objectives' ? 'ねらい' : field === 'childrenActivities' ? '活動' : '援助'}
                </td>
                {weekDates.map(d => {
                  const dp = dailyPlans.find(p => p.date === d);
                  const values = dp?.[field]?.filter(Boolean) ?? [];
                  return (
                    <td key={d} className="px-2 py-1.5 border border-secondary/20 text-paragraph/70">
                      {values.length > 0 ? values.join('、') : <span className="text-paragraph/30">-</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 週案内容 */}
      {weeklyPlan && !editMode && (
        <div className="bg-emerald-50/30 rounded-xl border border-emerald-200/40 p-4 space-y-3">
          <div>
            <h5 className="text-xs font-bold text-emerald-700 mb-1">週のねらい</h5>
            <ul className="space-y-0.5">
              {weeklyPlan.objectives.filter(Boolean).map((obj, i) => (
                <li key={i} className="text-sm text-paragraph">{obj}</li>
              ))}
            </ul>
          </div>
          {weeklyPlan.content && (
            <div>
              <h5 className="text-xs font-bold text-emerald-700 mb-1">内容</h5>
              <p className="text-sm text-paragraph">{weeklyPlan.content}</p>
            </div>
          )}
          {weeklyPlan.evaluation && (
            <div>
              <h5 className="text-xs font-bold text-emerald-700 mb-1">評価・反省</h5>
              <p className="text-sm text-paragraph">{weeklyPlan.evaluation}</p>
            </div>
          )}
        </div>
      )}

      {editMode && (
        <div className="space-y-3 bg-surface rounded-xl border border-secondary/20 p-4">
          <div>
            <label className="text-xs font-medium text-paragraph/80 mb-1 block">週のねらい</label>
            {formData.objectives.map((obj, i) => (
              <input
                key={i}
                type="text"
                value={obj}
                onChange={e => {
                  const next = [...formData.objectives];
                  next[i] = e.target.value;
                  setFormData(prev => ({ ...prev, objectives: next }));
                }}
                className="w-full px-3 py-1.5 border border-secondary/30 rounded-lg text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-button/40"
                placeholder="ねらいを入力"
              />
            ))}
            <button
              onClick={() => setFormData(prev => ({ ...prev, objectives: [...prev.objectives, ''] }))}
              className="text-xs text-button"
            >+ 追加</button>
          </div>
          <div>
            <label className="text-xs font-medium text-paragraph/80 mb-1 block">内容</label>
            <textarea
              value={formData.content}
              onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm min-h-[60px] resize-y focus:outline-none focus:ring-2 focus:ring-button/40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-paragraph/80 mb-1 block">評価・反省</label>
            <textarea
              value={formData.evaluation}
              onChange={e => setFormData(prev => ({ ...prev, evaluation: e.target.value }))}
              className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm min-h-[60px] resize-y focus:outline-none focus:ring-2 focus:ring-button/40"
            />
          </div>
        </div>
      )}

      {!weeklyPlan && !editMode && (
        <div className="text-center py-6 text-paragraph/40 text-sm">
          週案がまだ作成されていません。日案のデータからAIで自動生成できます。
        </div>
      )}
    </div>
  );
}
