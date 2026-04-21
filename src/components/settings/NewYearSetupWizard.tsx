'use client';

import { useState, useMemo } from 'react';
import { NewYearSetup, NewYearClassSetup, ChildClassAssignment, getNextGrade, GRADE_ORDER } from '@/types/newYearSetup';
import { CurriculumPlan } from '@/types/carePlan';
import { ClassInfo } from '@/types/settings';
import { ChildWithGrowth } from '@/lib/childrenStore';
import type { Staff } from '@/components/AppLayout';
import { SchoolSettings } from '@/types/settings';
import { Rule } from '@/types/rule';

const classColors = [
  '#EF4444', '#F87171', '#EC4899', '#F472B6', '#E11D48',
  '#F59E0B', '#FBBF24', '#EAB308', '#FB923C', '#F97316',
  '#10B981', '#34D399', '#22C55E', '#4ADE80', '#14B8A6',
  '#0EA5E9', '#38BDF8', '#3B82F6', '#60A5FA', '#06B6D4',
  '#8B5CF6', '#A78BFA', '#6366F1', '#818CF8', '#A855F7',
];

interface NewYearSetupWizardProps {
  currentClasses: ClassInfo[];
  children: ChildWithGrowth[];
  staff: Staff[];
  settings: SchoolSettings;
  rules: Rule[];
  fiscalYear: number;
  setup: NewYearSetup | null;
  onSave: (setup: NewYearSetup) => void;
  onAddPlan: (plan: CurriculumPlan) => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS = ['クラス設定', '担任配置', '園児配置', 'AI年間計画', '確認・確定'];

export function NewYearSetupWizard({
  currentClasses,
  children,
  staff,
  settings,
  rules,
  fiscalYear,
  setup,
  onSave,
  onAddPlan,
}: NewYearSetupWizardProps) {
  const targetYear = fiscalYear + 1;

  const [step, setStep] = useState<WizardStep>(1);
  const [newClasses, setNewClasses] = useState<NewYearClassSetup[]>(
    setup?.classes ?? currentClasses.map(c => ({
      classId: c.id,
      className: c.name,
      grade: c.grade,
      color: c.color,
    }))
  );

  const [childAssignments, setChildAssignments] = useState<ChildClassAssignment[]>(
    setup?.childAssignments ?? children.map(child => ({
      childId: child.id,
      fromClassId: child.classId,
      toClassId: child.classId,
      fromGrade: child.grade,
      toGrade: getNextGrade(child.grade),
    }))
  );

  const [annualPlanGenerated, setAnnualPlanGenerated] = useState(setup?.annualPlanGenerated ?? false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationLog, setGenerationLog] = useState<string[]>([]);

  // Step 1: クラス設定
  const addNewClass = () => {
    const id = `new-class-${Date.now()}`;
    setNewClasses(prev => [...prev, {
      classId: id,
      className: '',
      grade: '年少',
      color: classColors[prev.length % classColors.length],
    }]);
  };

  const removeNewClass = (idx: number) => {
    setNewClasses(prev => prev.filter((_, i) => i !== idx));
  };

  const updateNewClass = (idx: number, field: keyof NewYearClassSetup, value: string) => {
    setNewClasses(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  // Step 3: 自動進級
  const autoPromote = () => {
    setChildAssignments(children.map(child => {
      const nextGrade = getNextGrade(child.grade);
      // 同じ学年のクラスを探す
      const targetClass = newClasses.find(c => c.grade === nextGrade) ?? newClasses.find(c => c.classId === child.classId);
      return {
        childId: child.id,
        fromClassId: child.classId,
        toClassId: targetClass?.classId ?? child.classId,
        fromGrade: child.grade,
        toGrade: nextGrade,
      };
    }));
  };

  // Step 4: AI年間計画生成
  const generateAnnualPlans = async () => {
    setIsGenerating(true);
    setGenerationLog([]);

    // ルールから教育理念等を取得
    const philosophyRule = rules.find(r => r.category === 'education_philosophy');
    const policyRule = rules.find(r => r.category === 'education_policy');
    const goalsRule = rules.find(r => r.category === 'education_goals');

    for (const cls of newClasses) {
      setGenerationLog(prev => [...prev, `${cls.className}（${cls.grade}）の年間計画を生成中...`]);
      try {
        const classChildIds = childAssignments.filter(a => a.toClassId === cls.classId).map(a => a.childId);
        const classChildren = children.filter(c => classChildIds.includes(c.id));
        const childrenSummary = classChildren.length > 0
          ? `${classChildren.length}名の園児。特性: ${classChildren.flatMap(c => c.characteristics).filter(Boolean).slice(0, 5).join('、')}`
          : '';

        const res = await fetch('/api/plans/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'annual',
            className: cls.className,
            grade: cls.grade,
            fiscalYear: targetYear,
            educationPhilosophy: philosophyRule?.content,
            educationPolicy: policyRule?.content,
            educationGoals: goalsRule?.content,
            childrenSummary,
          }),
        });
        const data = await res.json();
        if (data.success && data.plan) {
          const now = new Date();
          const plan: CurriculumPlan = {
            id: `annual-${cls.classId}-${targetYear}`,
            level: 'annual',
            classId: cls.classId,
            title: `${targetYear}年度 ${cls.className} 年間計画`,
            period: `${targetYear}年度`,
            objectives: data.plan.objectives ?? [''],
            content: data.plan.content ?? '',
            childrenActivities: data.plan.childrenActivities ?? [''],
            teacherSupport: data.plan.teacherSupport ?? [''],
            environment: data.plan.environment ?? [''],
            evaluation: '',
            status: 'draft',
            authorId: staff[0]?.id ?? '',
            createdAt: now,
            updatedAt: now,
          };
          onAddPlan(plan);
          setGenerationLog(prev => [...prev, `  -> ${cls.className} 完了`]);
        } else {
          setGenerationLog(prev => [...prev, `  -> ${cls.className} エラー: ${data.error ?? '不明'}`]);
        }
      } catch (err) {
        setGenerationLog(prev => [...prev, `  -> ${cls.className} 生成失敗`]);
      }
    }

    setAnnualPlanGenerated(true);
    setIsGenerating(false);
    setGenerationLog(prev => [...prev, '全クラスの生成が完了しました']);
  };

  // Step 5: 確定
  const handleConfirm = () => {
    const now = new Date();
    const s: NewYearSetup = {
      id: setup?.id ?? `nys-${targetYear}`,
      targetFiscalYear: targetYear,
      classes: newClasses,
      childAssignments,
      annualPlanGenerated,
      status: 'confirmed',
      createdAt: setup?.createdAt ?? now,
      updatedAt: now,
    };
    onSave(s);
  };

  // ステップ保存
  const saveProgress = () => {
    const now = new Date();
    const s: NewYearSetup = {
      id: setup?.id ?? `nys-${targetYear}`,
      targetFiscalYear: targetYear,
      classes: newClasses,
      childAssignments,
      annualPlanGenerated,
      status: 'in_progress',
      createdAt: setup?.createdAt ?? now,
      updatedAt: now,
    };
    onSave(s);
  };

  const teachers = staff.filter(s => ['担任', '副担任', '主任'].includes(s.role));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-headline">{targetYear}年度 新年度設定</h2>
        <button
          onClick={saveProgress}
          className="px-3 py-1.5 text-xs text-button border border-button/30 rounded-lg hover:bg-button/5"
        >
          途中保存
        </button>
      </div>

      {/* ステップインジケーター */}
      <div className="flex items-center gap-1">
        {STEP_LABELS.map((label, i) => {
          const s = (i + 1) as WizardStep;
          return (
            <div key={s} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => setStep(s)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all w-full ${
                  step === s
                    ? 'bg-button text-white'
                    : step > s
                    ? 'bg-green-100 text-green-700'
                    : 'bg-secondary/10 text-paragraph/50'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                  {step > s ? '✓' : s}
                </span>
                <span className="hidden sm:inline truncate">{label}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Step 1: クラス設定 */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-paragraph/60">現年度のクラスをベースに、新年度のクラスを設定します。</p>
          <div className="space-y-3">
            {newClasses.map((cls, i) => (
              <div key={cls.classId} className="flex items-center gap-3 bg-surface rounded-lg border border-secondary/20 p-3">
                <div className="w-8 h-8 rounded-full shrink-0" style={{ backgroundColor: cls.color }} />
                <input
                  type="text"
                  value={cls.className}
                  onChange={e => updateNewClass(i, 'className', e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/40"
                  placeholder="クラス名"
                />
                <select
                  value={cls.grade}
                  onChange={e => updateNewClass(i, 'grade', e.target.value)}
                  className="px-2 py-1.5 border border-secondary/30 rounded-lg text-sm"
                >
                  {GRADE_ORDER.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <button onClick={() => removeNewClass(i)} className="text-paragraph/40 hover:text-alert">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button onClick={addNewClass} className="text-sm text-button hover:text-button/80">
            + クラスを追加
          </button>
        </div>
      )}

      {/* Step 2: 担任配置 */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-paragraph/60">各クラスに担任・副担任を割り当てます。</p>
          <div className="space-y-3">
            {newClasses.map((cls, i) => (
              <div key={cls.classId} className="bg-surface rounded-lg border border-secondary/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cls.color }} />
                  <span className="text-sm font-bold text-headline">{cls.className}</span>
                  <span className="text-xs text-paragraph/50">({cls.grade})</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-paragraph/60 mb-1 block">担任</label>
                    <select
                      value={cls.assignedTeacherId ?? ''}
                      onChange={e => updateNewClass(i, 'assignedTeacherId', e.target.value)}
                      className="w-full px-2 py-1.5 border border-secondary/30 rounded-lg text-sm"
                    >
                      <option value="">未定</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.lastName} {t.firstName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-paragraph/60 mb-1 block">副担任</label>
                    <select
                      value={cls.assignedSubTeacherId ?? ''}
                      onChange={e => updateNewClass(i, 'assignedSubTeacherId', e.target.value)}
                      className="w-full px-2 py-1.5 border border-secondary/30 rounded-lg text-sm"
                    >
                      <option value="">未定</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.lastName} {t.firstName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: 園児配置 */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-paragraph/60">園児の進級先クラスを設定します。</p>
            <button
              onClick={autoPromote}
              className="px-3 py-1.5 bg-button text-white text-xs rounded-lg hover:bg-button/90"
            >
              自動進級
            </button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {children.map(child => {
              const assignment = childAssignments.find(a => a.childId === child.id);
              const fromClass = currentClasses.find(c => c.id === child.classId);
              return (
                <div key={child.id} className="flex items-center gap-3 bg-surface rounded-lg border border-secondary/15 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-headline">
                      {child.lastNameKanji || child.lastName} {child.firstNameKanji || child.firstName}
                    </span>
                    <span className="text-xs text-paragraph/50 ml-2">{fromClass?.name} ({child.grade})</span>
                  </div>
                  <svg className="w-4 h-4 text-paragraph/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <select
                    value={assignment?.toClassId ?? ''}
                    onChange={e => {
                      const toClass = newClasses.find(c => c.classId === e.target.value);
                      setChildAssignments(prev => prev.map(a =>
                        a.childId === child.id
                          ? { ...a, toClassId: e.target.value, toGrade: toClass?.grade ?? a.toGrade }
                          : a
                      ));
                    }}
                    className="px-2 py-1 border border-secondary/30 rounded text-sm w-36"
                  >
                    {newClasses.map(c => (
                      <option key={c.classId} value={c.classId}>{c.className} ({c.grade})</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: AI年間計画生成 */}
      {step === 4 && (
        <div className="space-y-4">
          <p className="text-sm text-paragraph/60">
            園児の成長記録と教育理念・方針・目標をもとに、各クラスの年間計画をAIで生成します。
          </p>
          {!annualPlanGenerated && !isGenerating && (
            <button
              onClick={generateAnnualPlans}
              className="px-6 py-3 bg-button text-white rounded-xl font-medium hover:bg-button/90 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              全クラスの年間計画を生成
            </button>
          )}
          {isGenerating && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 border-2 border-button border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-headline">生成中...</span>
              </div>
              <div className="space-y-1">
                {generationLog.map((log, i) => (
                  <p key={i} className="text-xs text-paragraph/70">{log}</p>
                ))}
              </div>
            </div>
          )}
          {annualPlanGenerated && !isGenerating && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-200/50">
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-lg">&#10003;</span>
                <span className="text-sm font-medium text-green-700">年間計画の生成が完了しました</span>
              </div>
              <p className="text-xs text-paragraph/60 mt-1">
                保育計画ページの「年間計画」タブで確認・編集できます。
              </p>
              {generationLog.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {generationLog.map((log, i) => (
                    <p key={i} className="text-xs text-paragraph/50">{log}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 5: 確認・確定 */}
      {step === 5 && (
        <div className="space-y-4">
          <p className="text-sm text-paragraph/60">設定内容を確認して確定してください。</p>

          <div className="bg-surface rounded-xl border border-secondary/20 p-4 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-paragraph/60 mb-2">クラス構成</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {newClasses.map(cls => {
                  const teacher = staff.find(s => s.id === cls.assignedTeacherId);
                  const subTeacher = staff.find(s => s.id === cls.assignedSubTeacherId);
                  const assignedCount = childAssignments.filter(a => a.toClassId === cls.classId).length;
                  return (
                    <div key={cls.classId} className="rounded-lg border border-secondary/15 p-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cls.color }} />
                        <span className="text-sm font-bold text-headline">{cls.className}</span>
                      </div>
                      <p className="text-xs text-paragraph/50">{cls.grade} / {assignedCount}名</p>
                      {teacher && <p className="text-xs text-paragraph/60">担任: {teacher.lastName} {teacher.firstName}</p>}
                      {subTeacher && <p className="text-xs text-paragraph/60">副担任: {subTeacher.lastName} {subTeacher.firstName}</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-paragraph/60 mb-1">AI年間計画</h4>
              <p className="text-sm text-headline">
                {annualPlanGenerated ? '生成済み' : '未生成'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={saveProgress}
              className="px-4 py-2 text-sm text-paragraph/60 hover:text-paragraph"
            >
              途中保存
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2.5 bg-button text-white font-medium rounded-lg hover:bg-button/90 transition-colors"
            >
              確定する
            </button>
          </div>
        </div>
      )}

      {/* ナビゲーション */}
      {step < 5 && (
        <div className="flex justify-between pt-4 border-t border-secondary/20">
          <button
            onClick={() => setStep((step - 1) as WizardStep)}
            disabled={step === 1}
            className="px-4 py-2 text-sm text-paragraph/60 hover:text-paragraph disabled:opacity-30"
          >
            戻る
          </button>
          <button
            onClick={() => setStep((step + 1) as WizardStep)}
            className="px-4 py-2 bg-button text-white text-sm rounded-lg hover:bg-button/90"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
}
