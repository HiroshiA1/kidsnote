'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '@/components/AppLayout';
import { defaultClasses } from '@/types/settings';
import {
  CurriculumPlan, PlanLevel, PlanStatus, DailyReflection, ChildDailyReflection,
  LEVEL_LABELS, STATUS_LABELS, STATUS_COLORS, LEVEL_CONFIG, PRINT_LABELS, PrintConfig, PrintType,
} from '@/types/carePlan';
import { DailyPlanView } from '@/components/plans/DailyPlanView';
import { WeeklyPlanView } from '@/components/plans/WeeklyPlanView';
import { ClassSelector } from '@/components/plans/ClassSelector';

type ViewMode = 'daily' | 'weekly' | 'monthly' | 'annual';

// ─── ユーティリティ ───────────────────────────────
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getMonday(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return toDateStr(d);
}

function formatDateJa(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}(${days[d.getDay()]})`;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

// ─── 月案/年間計画の表示コンポーネ���ト ─────────────
function PlanListView({
  plans,
  level,
  classes,
  staff,
  onEdit,
  onStatusChange,
}: {
  plans: CurriculumPlan[];
  level: PlanLevel;
  classes: { id: string; name: string; color: string }[];
  staff: { id: string; lastName: string; firstName: string }[];
  onEdit: (plan: CurriculumPlan) => void;
  onStatusChange: (id: string, status: PlanStatus) => void;
}) {
  const filtered = plans.filter(p => p.level === level);
  const getClassName = (id: string) => classes.find(c => c.id === id)?.name ?? id;
  const getClassColor = (id: string) => classes.find(c => c.id === id)?.color ?? '#888';
  const getStaffName = (id: string) => {
    const s = staff.find(s => s.id === id);
    return s ? `${s.lastName} ${s.firstName}` : '';
  };

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-paragraph/40">
        <p className="text-lg mb-2">{LEVEL_LABELS[level]}がまだありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map(plan => (
        <div key={plan.id} className="bg-surface rounded-xl border border-secondary/20 p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getClassColor(plan.classId) }} />
              <span className="text-sm font-bold text-headline">{plan.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[plan.status]}`}>
                {STATUS_LABELS[plan.status]}
              </span>
              <select
                value={plan.status}
                onChange={e => onStatusChange(plan.id, e.target.value as PlanStatus)}
                className="text-xs border border-secondary/30 rounded px-1 py-0.5 bg-surface"
              >
                {(Object.entries(STATUS_LABELS) as [PlanStatus, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-paragraph/50 mb-3">
            <span>{getClassName(plan.classId)}</span>
            <span>{plan.period}</span>
            <span>作成者: {getStaffName(plan.authorId)}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plan.objectives.filter(Boolean).length > 0 && (
              <div className="bg-amber-50/50 rounded-lg p-2">
                <h5 className="text-xs font-bold text-amber-700 mb-1">ねらい</h5>
                <ul className="space-y-0.5">
                  {plan.objectives.filter(Boolean).map((obj, i) => (
                    <li key={i} className="text-xs text-paragraph">{obj}</li>
                  ))}
                </ul>
              </div>
            )}
            {plan.content && (
              <div className="bg-blue-50/50 rounded-lg p-2">
                <h5 className="text-xs font-bold text-blue-700 mb-1">内容</h5>
                <p className="text-xs text-paragraph">{plan.content}</p>
              </div>
            )}
          </div>
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => onEdit(plan)}
              className="text-xs text-button hover:text-button/80 transition-colors"
            >
              編集
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 月案/年間計画の編集モーダル ─────────────────
function PlanEditModal({
  plan,
  onSave,
  onClose,
}: {
  plan: CurriculumPlan;
  onSave: (plan: CurriculumPlan) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CurriculumPlan>({ ...plan });

  const updateList = (key: 'objectives' | 'childrenActivities' | 'teacherSupport' | 'environment', idx: number, val: string) => {
    setForm(prev => ({ ...prev, [key]: prev[key].map((v, i) => i === idx ? val : v) }));
  };
  const addItem = (key: 'objectives' | 'childrenActivities' | 'teacherSupport' | 'environment') => {
    setForm(prev => ({ ...prev, [key]: [...prev[key], ''] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-surface rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-surface border-b border-secondary/20 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-headline">{plan.title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary/20 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {(['objectives', 'childrenActivities', 'teacherSupport', 'environment'] as const).map(key => {
            const labels = { objectives: 'ねらい', childrenActivities: '子どもの活動', teacherSupport: '保育者の援助', environment: '環境構成' };
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-paragraph/80">{labels[key]}</label>
                  <button onClick={() => addItem(key)} className="text-xs text-button">+ 追加</button>
                </div>
                {form[key].map((item, i) => (
                  <input
                    key={i}
                    type="text"
                    value={item}
                    onChange={e => updateList(key, i, e.target.value)}
                    className="w-full px-3 py-1.5 border border-secondary/30 rounded-lg text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-button/40"
                  />
                ))}
              </div>
            );
          })}
          <div>
            <label className="text-sm font-medium text-paragraph/80 mb-1 block">内容</label>
            <textarea
              value={form.content}
              onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
              className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-button/40"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-paragraph/80 mb-1 block">評価・反省</label>
            <textarea
              value={form.evaluation}
              onChange={e => setForm(prev => ({ ...prev, evaluation: e.target.value }))}
              className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm min-h-[60px] resize-y focus:outline-none focus:ring-2 focus:ring-button/40"
            />
          </div>
        </div>
        <div className="sticky bottom-0 bg-surface border-t border-secondary/20 px-6 py-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-paragraph/60 hover:text-paragraph">キャンセル</button>
          <button
            onClick={() => { onSave({ ...form, updatedAt: new Date() }); onClose(); }}
            className="px-4 py-2 bg-button text-white text-sm rounded-lg hover:bg-button/90"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== メインページ ==========
export default function CurriculumPage() {
  const {
    staff, settings, children, currentStaffId,
    curriculumPlans, addCurriculumPlan, updateCurriculumPlan,
    dailyReflections, addDailyReflection, updateDailyReflection,
    childDailyReflections, addChildDailyReflection, updateChildDailyReflection,
  } = useApp();

  const classes = settings.classes ?? defaultClasses;
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<CurriculumPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // 担任クラスの自動判定
  const currentStaff = staff.find(s => s.id === currentStaffId);
  const isTeacher = currentStaff?.role === '担任' || currentStaff?.role === '副担任';
  const teacherClassId = currentStaff?.classAssignment;

  // 担任の場合は自動的に自分のクラスを選択
  const effectiveClassId = selectedClassId ?? (isTeacher && teacherClassId ? teacherClassId : classes[0]?.id ?? null);
  const currentClass = classes.find(c => c.id === effectiveClassId);

  // 日付の日案を取得
  const dailyPlan = useMemo(() =>
    curriculumPlans.find(p => p.level === 'daily' && p.classId === effectiveClassId && p.date === selectedDate) ?? null,
    [curriculumPlans, effectiveClassId, selectedDate]
  );

  // 週の開始日
  const weekStart = getMonday(selectedDate);

  // 週の日案を取得
  const weeklyDailyPlans = useMemo(() =>
    curriculumPlans.filter(p => p.level === 'daily' && p.classId === effectiveClassId && p.date && p.date >= weekStart && p.date < addDays(weekStart, 5)),
    [curriculumPlans, effectiveClassId, weekStart]
  );

  // 週案を取得
  const weeklyPlan = useMemo(() =>
    curriculumPlans.find(p => p.level === 'weekly' && p.classId === effectiveClassId && p.period === `${weekStart}週`) ?? null,
    [curriculumPlans, effectiveClassId, weekStart]
  );

  // 日案の振り返り
  const currentReflection = useMemo(() =>
    dailyReflections.find(r => r.classId === effectiveClassId && r.date === selectedDate) ?? null,
    [dailyReflections, effectiveClassId, selectedDate]
  );

  const currentChildReflections = useMemo(() =>
    childDailyReflections.filter(r => r.classId === effectiveClassId && r.date === selectedDate),
    [childDailyReflections, effectiveClassId, selectedDate]
  );

  const handleSavePlan = useCallback((plan: CurriculumPlan) => {
    const existing = curriculumPlans.find(p => p.id === plan.id);
    if (existing) {
      updateCurriculumPlan(plan);
    } else {
      addCurriculumPlan(plan);
    }
  }, [curriculumPlans, updateCurriculumPlan, addCurriculumPlan]);

  const handleSaveReflection = useCallback((r: DailyReflection) => {
    const existing = dailyReflections.find(x => x.id === r.id);
    if (existing) {
      updateDailyReflection(r);
    } else {
      addDailyReflection(r);
    }
  }, [dailyReflections, updateDailyReflection, addDailyReflection]);

  const handleSaveChildReflection = useCallback((r: ChildDailyReflection) => {
    const existing = childDailyReflections.find(x => x.id === r.id);
    if (existing) {
      updateChildDailyReflection(r);
    } else {
      addChildDailyReflection(r);
    }
  }, [childDailyReflections, updateChildDailyReflection, addChildDailyReflection]);

  const handleGenerateWeekly = useCallback(async (classId: string, ws: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;
    setIsGenerating(true);
    try {
      const dps = curriculumPlans.filter(p => p.level === 'daily' && p.classId === classId && p.date && p.date >= ws && p.date < addDays(ws, 5));
      const res = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'weekly',
          className: cls.name,
          grade: cls.grade,
          weekStart: ws,
          dailyPlans: dps.map(dp => ({
            date: dp.date,
            objectives: dp.objectives,
            content: dp.content,
            childrenActivities: dp.childrenActivities,
            teacherSupport: dp.teacherSupport,
            environment: dp.environment,
          })),
        }),
      });
      const data = await res.json();
      if (data.success && data.plan) {
        const now = new Date();
        const newPlan: CurriculumPlan = {
          id: `weekly-${classId}-${ws}`,
          level: 'weekly',
          classId,
          title: `${ws}週 ${cls.name} 週案`,
          period: `${ws}週`,
          objectives: data.plan.objectives ?? [''],
          content: data.plan.content ?? '',
          childrenActivities: data.plan.childrenActivities ?? [''],
          teacherSupport: data.plan.teacherSupport ?? [''],
          environment: data.plan.environment ?? [''],
          evaluation: data.plan.evaluation ?? '',
          status: 'draft',
          authorId: currentStaffId ?? '',
          createdAt: now,
          updatedAt: now,
        };
        addCurriculumPlan(newPlan);
      }
    } catch (err) {
      console.error('Weekly generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [curriculumPlans, classes, currentStaffId, addCurriculumPlan]);

  const handleStatusChange = useCallback((id: string, status: PlanStatus) => {
    const plan = curriculumPlans.find(p => p.id === id);
    if (plan) {
      updateCurriculumPlan({ ...plan, status, updatedAt: new Date() });
    }
  }, [curriculumPlans, updateCurriculumPlan]);

  const viewTabs: { key: ViewMode; label: string; icon: string }[] = [
    { key: 'daily', label: '日案', icon: '📝' },
    { key: 'weekly', label: '週案', icon: '📋' },
    { key: 'monthly', label: '月案', icon: '📅' },
    { key: 'annual', label: '年間計画', icon: '🗓️' },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-headline">保育計画</h1>
          </div>
          {/* サブナビ */}
          <div className="flex gap-1">
            {viewTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  viewMode === tab.key
                    ? 'bg-button text-white shadow-sm'
                    : 'text-paragraph/60 hover:text-paragraph hover:bg-secondary/10'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-6">
        {/* 日案/週案: 日付ナビ + クラス選択 */}
        {(viewMode === 'daily' || viewMode === 'weekly') && (
          <>
            {/* 日付ナビゲーション */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'weekly' ? -7 : -1))}
                className="p-2 hover:bg-secondary/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-paragraph" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="text-center">
                <h2 className="text-lg font-bold text-headline">
                  {viewMode === 'daily' ? formatDateJa(selectedDate) : `${formatDateJa(weekStart)} 〜 ${formatDateJa(addDays(weekStart, 4))}`}
                </h2>
                <button
                  onClick={() => setSelectedDate(toDateStr(new Date()))}
                  className="text-xs text-button hover:text-button/80 mt-1"
                >
                  今日に戻る
                </button>
              </div>
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'weekly' ? 7 : 1))}
                className="p-2 hover:bg-secondary/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-paragraph" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* クラス選択（非担任用） */}
            {!isTeacher && (
              <ClassSelector
                classes={classes}
                selectedClassId={effectiveClassId}
                onSelect={setSelectedClassId}
              />
            )}

            {/* 担任の場合はクラス名表示 */}
            {isTeacher && currentClass && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: currentClass.color }} />
                <span className="text-sm font-bold text-headline">{currentClass.name}</span>
                <span className="text-xs text-paragraph/50">({currentClass.grade})</span>
              </div>
            )}
          </>
        )}

        {/* 日案ビュー */}
        {viewMode === 'daily' && effectiveClassId && (
          <div className="bg-surface rounded-xl border border-secondary/20 p-4 sm:p-6">
            <DailyPlanView
              date={selectedDate}
              classId={effectiveClassId}
              classInfo={currentClass}
              plan={dailyPlan}
              reflection={currentReflection}
              childReflections={currentChildReflections}
              children={children}
              currentStaffId={currentStaffId ?? ''}
              onSavePlan={handleSavePlan}
              onSaveReflection={handleSaveReflection}
              onSaveChildReflection={handleSaveChildReflection}
            />
          </div>
        )}

        {/* 週案ビュー */}
        {viewMode === 'weekly' && effectiveClassId && (
          <div className="bg-surface rounded-xl border border-secondary/20 p-4 sm:p-6">
            <WeeklyPlanView
              weekStart={weekStart}
              classId={effectiveClassId}
              classInfo={currentClass}
              weeklyPlan={weeklyPlan}
              dailyPlans={weeklyDailyPlans}
              currentStaffId={currentStaffId ?? ''}
              onSavePlan={handleSavePlan}
              onGenerateWeekly={handleGenerateWeekly}
              isGenerating={isGenerating}
            />
          </div>
        )}

        {/* 月案ビュー */}
        {viewMode === 'monthly' && (
          <PlanListView
            plans={curriculumPlans}
            level="monthly"
            classes={classes}
            staff={staff}
            onEdit={setEditingPlan}
            onStatusChange={handleStatusChange}
          />
        )}

        {/* 年間計画ビュー */}
        {viewMode === 'annual' && (
          <PlanListView
            plans={curriculumPlans}
            level="annual"
            classes={classes}
            staff={staff}
            onEdit={setEditingPlan}
            onStatusChange={handleStatusChange}
          />
        )}
      </main>

      {/* 編集モーダル */}
      {editingPlan && (
        <PlanEditModal
          plan={editingPlan}
          onSave={handleSavePlan}
          onClose={() => setEditingPlan(null)}
        />
      )}
    </div>
  );
}
