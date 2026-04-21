'use client';

import { useState } from 'react';
import { CurriculumPlan, DailyReflection, ChildDailyReflection, STATUS_LABELS, STATUS_COLORS } from '@/types/carePlan';
import { ChildWithGrowth } from '@/lib/childrenStore';
import { ClassInfo } from '@/types/settings';
import { DailyReflectionSection } from './DailyReflectionSection';

function ListEditor({ label, items, onUpdate, onAdd, onRemove, placeholder }: {
  label: string;
  items: string[];
  onUpdate: (idx: number, val: string) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  placeholder: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-paragraph/80">{label}</label>
        <button onClick={onAdd} className="text-xs text-button hover:text-button/80 transition-colors">+ 追加</button>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={e => onUpdate(i, e.target.value)}
              className="flex-1 px-3 py-1.5 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/40"
              placeholder={placeholder}
            />
            {items.length > 1 && (
              <button onClick={() => onRemove(i)} className="text-paragraph/40 hover:text-alert transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface DailyPlanViewProps {
  date: string; // YYYY-MM-DD
  classId: string;
  classInfo: ClassInfo | undefined;
  plan: CurriculumPlan | null;
  reflection: DailyReflection | null;
  childReflections: ChildDailyReflection[];
  children: ChildWithGrowth[];
  currentStaffId: string;
  onSavePlan: (plan: CurriculumPlan) => void;
  onSaveReflection: (r: DailyReflection) => void;
  onSaveChildReflection: (r: ChildDailyReflection) => void;
}

export function DailyPlanView({
  date,
  classId,
  classInfo,
  plan,
  reflection,
  childReflections,
  children,
  currentStaffId,
  onSavePlan,
  onSaveReflection,
  onSaveChildReflection,
}: DailyPlanViewProps) {
  const [editMode, setEditMode] = useState(!plan);
  const [activeTab, setActiveTab] = useState<'plan' | 'reflection'>('plan');

  const defaultPlan: CurriculumPlan = {
    id: `daily-${classId}-${date}`,
    level: 'daily',
    classId,
    title: `${date} ${classInfo?.name ?? ''} 日案`,
    period: date,
    date,
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
  };

  const [formData, setFormData] = useState<CurriculumPlan>(plan ?? defaultPlan);

  const updateField = <K extends keyof CurriculumPlan>(key: K, value: CurriculumPlan[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateListItem = (key: 'objectives' | 'childrenActivities' | 'teacherSupport' | 'environment', idx: number, val: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].map((item, i) => i === idx ? val : item),
    }));
  };

  const addListItem = (key: 'objectives' | 'childrenActivities' | 'teacherSupport' | 'environment') => {
    setFormData(prev => ({ ...prev, [key]: [...prev[key], ''] }));
  };

  const removeListItem = (key: 'objectives' | 'childrenActivities' | 'teacherSupport' | 'environment', idx: number) => {
    setFormData(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) }));
  };

  const handleSave = () => {
    onSavePlan({ ...formData, updatedAt: new Date() });
    setEditMode(false);
  };

  const tabs = [
    { id: 'plan' as const, label: '日案内容' },
    { id: 'reflection' as const, label: '振り返り' },
  ];

  const planId = plan?.id ?? formData.id;

  return (
    <div className="space-y-4">
      {/* タブ */}
      <div className="flex gap-1 border-b border-secondary/20">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-paragraph/50 hover:text-paragraph'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'plan' && (
        <div className="space-y-4">
          {/* ヘッダー */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {plan && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[plan.status]}`}>
                  {STATUS_LABELS[plan.status]}
                </span>
              )}
              {!plan && (
                <span className="text-xs text-paragraph/50">新規作成</span>
              )}
            </div>
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <button
                    onClick={() => { setFormData(plan ?? defaultPlan); setEditMode(false); }}
                    className="px-3 py-1.5 text-xs text-paragraph/60 hover:text-paragraph transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-1.5 bg-button text-white text-xs font-medium rounded-lg hover:bg-button/90 transition-colors"
                  >
                    保存
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-3 py-1.5 text-xs text-button hover:text-button/80 transition-colors"
                >
                  編集
                </button>
              )}
            </div>
          </div>

          {editMode ? (
            <div className="space-y-4">
              <ListEditor
                label="ねらい"
                items={formData.objectives}
                onUpdate={(i, v) => updateListItem('objectives', i, v)}
                onAdd={() => addListItem('objectives')}
                onRemove={(i) => removeListItem('objectives', i)}
                placeholder="ねらいを入力"
              />
              <div>
                <label className="text-sm font-medium text-paragraph/80 mb-1 block">内容</label>
                <textarea
                  value={formData.content}
                  onChange={e => updateField('content', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/40 min-h-[60px] resize-y"
                  placeholder="保育の内容"
                />
              </div>
              <ListEditor
                label="子どもの活動"
                items={formData.childrenActivities}
                onUpdate={(i, v) => updateListItem('childrenActivities', i, v)}
                onAdd={() => addListItem('childrenActivities')}
                onRemove={(i) => removeListItem('childrenActivities', i)}
                placeholder="活動を入力"
              />
              <ListEditor
                label="保育者の援助"
                items={formData.teacherSupport}
                onUpdate={(i, v) => updateListItem('teacherSupport', i, v)}
                onAdd={() => addListItem('teacherSupport')}
                onRemove={(i) => removeListItem('teacherSupport', i)}
                placeholder="援助内容を入力"
              />
              <ListEditor
                label="環境構成"
                items={formData.environment}
                onUpdate={(i, v) => updateListItem('environment', i, v)}
                onAdd={() => addListItem('environment')}
                onRemove={(i) => removeListItem('environment', i)}
                placeholder="環境構成を入力"
              />
            </div>
          ) : plan ? (
            <div className="space-y-4">
              <DetailSection icon="🎯" title="ねらい" color="bg-amber-50">
                <ul className="space-y-1">
                  {plan.objectives.filter(Boolean).map((obj, i) => (
                    <li key={i} className="text-sm text-paragraph flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">&#8226;</span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </DetailSection>
              {plan.content && (
                <DetailSection icon="📄" title="内容" color="bg-blue-50">
                  <p className="text-sm text-paragraph">{plan.content}</p>
                </DetailSection>
              )}
              <DetailSection icon="👧" title="子どもの活動" color="bg-green-50">
                <ul className="space-y-1">
                  {plan.childrenActivities.filter(Boolean).map((act, i) => (
                    <li key={i} className="text-sm text-paragraph flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">&#8226;</span>
                      {act}
                    </li>
                  ))}
                </ul>
              </DetailSection>
              <DetailSection icon="🤝" title="保育者の援助" color="bg-purple-50">
                <ul className="space-y-1">
                  {plan.teacherSupport.filter(Boolean).map((sup, i) => (
                    <li key={i} className="text-sm text-paragraph flex items-start gap-2">
                      <span className="text-purple-400 mt-0.5">&#8226;</span>
                      {sup}
                    </li>
                  ))}
                </ul>
              </DetailSection>
              <DetailSection icon="🌿" title="環境構成" color="bg-emerald-50">
                <ul className="space-y-1">
                  {plan.environment.filter(Boolean).map((env, i) => (
                    <li key={i} className="text-sm text-paragraph flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">&#8226;</span>
                      {env}
                    </li>
                  ))}
                </ul>
              </DetailSection>
            </div>
          ) : (
            <div className="text-center py-8 text-paragraph/40">
              <p className="text-lg mb-2">まだ日案が作成されていません</p>
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-button text-white text-sm rounded-lg hover:bg-button/90 transition-colors"
              >
                日案を作成
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reflection' && (
        <DailyReflectionSection
          classId={classId}
          date={date}
          planId={planId}
          authorId={currentStaffId}
          children={children}
          reflection={reflection}
          childReflections={childReflections}
          onSaveReflection={onSaveReflection}
          onSaveChildReflection={onSaveChildReflection}
        />
      )}
    </div>
  );
}

function DetailSection({ icon, title, color, children }: {
  icon: string;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-secondary/10 overflow-hidden">
      <div className={`px-3 py-1.5 ${color} flex items-center gap-1.5`}>
        <span className="text-sm">{icon}</span>
        <h4 className="text-xs font-bold text-headline/80">{title}</h4>
      </div>
      <div className="px-3 py-2">{children}</div>
    </div>
  );
}
