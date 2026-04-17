'use client';

import React, { useState } from 'react';
import { useApp } from '@/components/AppLayout';
import { defaultClasses } from '@/types/settings';

type PlanLevel = 'annual' | 'monthly' | 'weekly' | 'daily';
type PlanStatus = 'draft' | 'submitted' | 'approved' | 'revision';

interface CurriculumPlan {
  id: string;
  level: PlanLevel;
  classId: string;
  title: string;
  period: string;
  objectives: string[];
  content: string;
  childrenActivities: string[];
  teacherSupport: string[];
  environment: string[];
  evaluation: string;
  status: PlanStatus;
  deadline?: Date;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

type PrintType = 'daily-week' | 'daily-allclass' | 'weekly-month' | 'weekly-allclass' | 'monthly-allclass' | 'monthly-year';

interface PrintConfig {
  type: PrintType;
  classId?: string;
  date?: string;
  week?: string;
}

const PRINT_LABELS: Record<PrintType, string> = {
  'daily-week': '各クラスの1週間（日案）',
  'daily-allclass': '1日の各クラス全体（日案）',
  'weekly-month': '1クラスの1ヶ月分（週案）',
  'weekly-allclass': '各クラスの週案',
  'monthly-allclass': '当月の各クラス一覧（月案）',
  'monthly-year': '1クラスの1年間分（月案）',
};

const LEVEL_LABELS: Record<PlanLevel, string> = {
  annual: '年間計画',
  monthly: '月案',
  weekly: '週案',
  daily: '日案',
};

const STATUS_LABELS: Record<PlanStatus, string> = {
  draft: '下書き',
  submitted: '提出済',
  approved: '承認済',
  revision: '要修正',
};

const STATUS_COLORS: Record<PlanStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-600',
  approved: 'bg-green-100 text-green-600',
  revision: 'bg-orange-100 text-orange-600',
};

// レベル別のデザイン設定
const LEVEL_CONFIG: Record<PlanLevel, { icon: string; color: string; bgColor: string; lightBg: string; borderColor: string }> = {
  annual: { icon: '🗓️', color: 'text-purple-600', bgColor: 'bg-purple-100', lightBg: 'bg-purple-50', borderColor: 'border-purple-400' },
  monthly: { icon: '📅', color: 'text-blue-600', bgColor: 'bg-blue-100', lightBg: 'bg-blue-50', borderColor: 'border-blue-400' },
  weekly: { icon: '📋', color: 'text-emerald-600', bgColor: 'bg-emerald-100', lightBg: 'bg-emerald-50', borderColor: 'border-emerald-400' },
  daily: { icon: '📝', color: 'text-amber-600', bgColor: 'bg-amber-100', lightBg: 'bg-amber-50', borderColor: 'border-amber-400' },
};

const TEMPLATES: Record<PlanLevel, Partial<CurriculumPlan>> = {
  annual: {
    objectives: ['年間を通して基本的生活習慣を身につける', '友達との関わりを通じて社会性を育む', ''],
    content: '',
    childrenActivities: ['季節の行事への参加', '戸外遊び・散歩', '製作活動', ''],
    teacherSupport: ['一人ひとりの発達に合わせた声かけ', '安全な環境づくり', ''],
    environment: ['季節の飾り付け', '絵本コーナーの充実', ''],
  },
  monthly: {
    objectives: ['', ''],
    content: '',
    childrenActivities: ['', ''],
    teacherSupport: ['', ''],
    environment: [''],
  },
  weekly: {
    objectives: [''],
    content: '',
    childrenActivities: [''],
    teacherSupport: [''],
    environment: [''],
  },
  daily: {
    objectives: [''],
    content: '',
    childrenActivities: [''],
    teacherSupport: [''],
    environment: [''],
  },
};

function generateSamplePlans(classes: { id: string; name: string }[], staffIds: string[]): CurriculumPlan[] {
  const plans: CurriculumPlan[] = [];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  classes.slice(0, 4).forEach((cls, ci) => {
    plans.push({
      id: `annual-${cls.id}`,
      level: 'annual',
      classId: cls.id,
      title: `${year}年度 ${cls.name} 年間計画`,
      period: `${year}年度`,
      objectives: ['基本的生活習慣を身につけ、自分のことは自分でできるようにする', '友達との関わりを楽しみ、思いやりの気持ちを育む', '自然や季節の変化に興味を持ち、感性を豊かにする'],
      content: '年間を通して、子どもの発達段階に応じた保育を展開する。',
      childrenActivities: ['季節の行事への参加', '戸外遊び・散歩', '製作活動', '音楽リズム活動'],
      teacherSupport: ['一人ひとりの発達に合わせた声かけ', '安全な環境づくり', '保護者との連携'],
      environment: ['季節の飾り付け', '絵本コーナーの充実', '運動遊びスペースの確保'],
      evaluation: '',
      status: 'approved',
      authorId: staffIds[ci % staffIds.length],
      createdAt: new Date(year, 3, 1),
      updatedAt: new Date(year, 3, 15),
    });

    plans.push({
      id: `monthly-${cls.id}-${month + 1}`,
      level: 'monthly',
      classId: cls.id,
      title: `${month + 1}月 ${cls.name} 月案`,
      period: `${month + 1}月`,
      objectives: ['寒さに負けず戸外で元気に遊ぶ', '友達と協力して遊びを工夫する'],
      content: '冬の自然に親しみながら、友達との関わりを深める活動を展開する。',
      childrenActivities: ['雪遊び・氷遊び', '節分の製作', 'ドッジボール'],
      teacherSupport: ['衣服の調節を促す', '遊びのルールを一緒に考える'],
      environment: ['暖房の管理', '冬の絵本コーナー設置'],
      evaluation: '',
      status: ci < 2 ? 'approved' : 'submitted',
      deadline: new Date(year, month, 25),
      authorId: staffIds[ci % staffIds.length],
      createdAt: new Date(year, month, 1),
      updatedAt: new Date(year, month, 10),
    });

    if (ci < 2) {
      plans.push({
        id: `weekly-${cls.id}-w3`,
        level: 'weekly',
        classId: cls.id,
        title: `${month + 1}月第3週 ${cls.name} 週案`,
        period: `${month + 1}月第3週`,
        objectives: ['お正月遊びを通して伝統文化に親しむ'],
        content: 'お正月ならではの遊びを取り入れ、友達と一緒に楽しむ。',
        childrenActivities: ['かるた遊び', 'こま回し', '凧揚げ'],
        teacherSupport: ['遊び方を丁寧に伝える', '勝ち負けで気持ちが崩れた時のフォロー'],
        environment: ['お正月遊びコーナーの設置'],
        evaluation: '',
        status: 'draft',
        deadline: new Date(year, month, 17),
        authorId: staffIds[ci % staffIds.length],
        createdAt: new Date(year, month, 14),
        updatedAt: new Date(year, month, 14),
      });
    }
  });

  return plans;
}

// ── 統計サマリーカード ──────────────────────────
function SummaryCard({ level, plans, isActive, onClick }: {
  level: PlanLevel;
  plans: CurriculumPlan[];
  isActive: boolean;
  onClick: () => void;
}) {
  const config = LEVEL_CONFIG[level];
  const levelPlans = plans.filter(p => p.level === level);
  const approved = levelPlans.filter(p => p.status === 'approved').length;
  const total = levelPlans.length;

  return (
    <button
      onClick={onClick}
      className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left w-full
        ${isActive
          ? `${config.borderColor} ${config.lightBg} shadow-md scale-[1.02]`
          : 'border-secondary/20 bg-surface hover:border-secondary/40 hover:shadow-sm'
        }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center text-lg`}>
          {config.icon}
        </div>
        <div>
          <p className={`text-sm font-bold ${config.color}`}>{LEVEL_LABELS[level]}</p>
          <p className="text-2xl font-bold text-headline">{total}<span className="text-sm font-normal text-paragraph/50 ml-1">件</span></p>
        </div>
      </div>
      {total > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-paragraph/60 mb-1">
            <span>承認済</span>
            <span>{approved}/{total}</span>
          </div>
          <div className="w-full h-1.5 bg-secondary/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-400 rounded-full transition-all duration-500"
              style={{ width: `${total > 0 ? (approved / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}
    </button>
  );
}

// ── 進捗バー ───────────────────────────────────
function ProgressOverview({ plans }: { plans: CurriculumPlan[] }) {
  const total = plans.length;
  if (total === 0) return null;

  const counts: Record<PlanStatus, number> = {
    draft: plans.filter(p => p.status === 'draft').length,
    submitted: plans.filter(p => p.status === 'submitted').length,
    approved: plans.filter(p => p.status === 'approved').length,
    revision: plans.filter(p => p.status === 'revision').length,
  };

  const segments: { status: PlanStatus; color: string }[] = [
    { status: 'approved', color: 'bg-green-400' },
    { status: 'submitted', color: 'bg-blue-400' },
    { status: 'draft', color: 'bg-gray-300' },
    { status: 'revision', color: 'bg-orange-400' },
  ];

  return (
    <div className="bg-surface rounded-xl border border-secondary/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-headline">全体の進捗状況</h3>
        <span className="text-xs text-paragraph/50">全 {total} 件</span>
      </div>
      <div className="w-full h-3 bg-secondary/10 rounded-full overflow-hidden flex">
        {segments.map(({ status, color }) => {
          const pct = (counts[status] / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={status}
              className={`${color} h-full transition-all duration-500`}
              style={{ width: `${pct}%` }}
              title={`${STATUS_LABELS[status]}: ${counts[status]}件`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {segments.map(({ status, color }) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-paragraph/60">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span>{STATUS_LABELS[status]} {counts[status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── リスト編集コンポーネント ────────────────────
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

// ── セクション表示コンポーネント ────────────────
function DetailSection({ icon, title, color, children }: {
  icon: string;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border border-secondary/10 overflow-hidden`}>
      <div className={`px-3 py-1.5 ${color} flex items-center gap-1.5`}>
        <span className="text-sm">{icon}</span>
        <h4 className="text-xs font-bold text-headline/80">{title}</h4>
      </div>
      <div className="px-3 py-2">
        {children}
      </div>
    </div>
  );
}

// ── 印刷テーブル行のフィールド定義 ─────────────
const PRINT_ROW_FIELDS: { key: keyof CurriculumPlan; label: string }[] = [
  { key: 'objectives', label: 'ねらい' },
  { key: 'content', label: '内容' },
  { key: 'childrenActivities', label: '子どもの活動' },
  { key: 'teacherSupport', label: '保育者の援助' },
  { key: 'environment', label: '環境構成' },
  { key: 'evaluation', label: '評価' },
];

function renderPlanCell(plan: CurriculumPlan | undefined, field: keyof CurriculumPlan) {
  if (!plan) return <td className="text-gray-300 text-center">-</td>;
  const value = plan[field];
  if (Array.isArray(value)) {
    const items = value.filter(Boolean);
    return <td>{items.length > 0 ? items.map((v, i) => <div key={i}>{v}</div>) : '-'}</td>;
  }
  return <td>{(value as string) || '-'}</td>;
}

// ── 印刷形式選択モーダル ──────────────────────────
function PrintSetupModal({
  classes,
  onClose,
  onPreview
}: {
  classes: { id: string; name: string }[];
  onClose: () => void;
  onPreview: (config: PrintConfig) => void;
}) {
  const [step, setStep] = useState(1);
  const [level, setLevel] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [format, setFormat] = useState<PrintType | null>(null);
  const [classId, setClassId] = useState(classes[0]?.id ?? '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const levelOptions: { key: 'daily' | 'weekly' | 'monthly'; label: string; icon: string }[] = [
    { key: 'daily', label: '日案', icon: '📝' },
    { key: 'weekly', label: '週案', icon: '📋' },
    { key: 'monthly', label: '月案', icon: '📅' },
  ];

  const formatOptions: Record<'daily' | 'weekly' | 'monthly', { type: PrintType; label: string; desc: string }[]> = {
    daily: [
      { type: 'daily-week', label: '各クラスの1週間', desc: '1クラスの月〜日の日案をテーブル表示' },
      { type: 'daily-allclass', label: '1日の各クラス全体', desc: '特定日の全クラスの日案を一覧表示' },
    ],
    weekly: [
      { type: 'weekly-month', label: '1クラスの1ヶ月分', desc: '1クラスの4〜5週分の週案をテーブル表示' },
      { type: 'weekly-allclass', label: '各クラスの週案', desc: '特定週の全クラス週案を一覧表示' },
    ],
    monthly: [
      { type: 'monthly-allclass', label: '当月の各クラス一覧', desc: '今月の全クラス月案をグリッド表示' },
      { type: 'monthly-year', label: '1クラスの1年間分', desc: '1クラスの12ヶ月分の月案をテーブル表示' },
    ],
  };

  const needsClass = format === 'daily-week' || format === 'weekly-month' || format === 'monthly-year';
  const needsDate = format === 'daily-allclass' || format === 'weekly-allclass';

  const handlePreview = () => {
    if (!format) return;
    const config: PrintConfig = { type: format };
    if (needsClass) config.classId = classId;
    if (needsDate) config.date = date;
    onPreview(config);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-surface rounded-xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-headline">印刷形式の選択</h3>
            <button onClick={onClose} className="p-1.5 hover:bg-secondary/20 rounded-lg text-paragraph/60 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-5">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= s ? 'bg-button text-white' : 'bg-secondary/20 text-paragraph/40'
                }`}>{s}</div>
                {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-button' : 'bg-secondary/20'}`} />}
              </div>
            ))}
            <span className="text-xs text-paragraph/50 ml-2">
              {step === 1 ? 'レベル選択' : step === 2 ? '形式選択' : '対象選択'}
            </span>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {step === 1 && (
            <div className="grid grid-cols-3 gap-3">
              {levelOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => { setLevel(opt.key); setFormat(null); setStep(2); }}
                  className={`p-4 rounded-xl border-2 text-center transition-all hover:shadow-md ${
                    level === opt.key ? 'border-button bg-button/5' : 'border-secondary/20 hover:border-secondary/40'
                  }`}
                >
                  <div className="text-2xl mb-2">{opt.icon}</div>
                  <div className="text-sm font-bold text-headline">{opt.label}</div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <button onClick={() => setStep(1)} className="text-xs text-button hover:text-button/80 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                レベル選択に戻る
              </button>
              {formatOptions[level].map(opt => (
                <button
                  key={opt.type}
                  onClick={() => { setFormat(opt.type); setStep(3); }}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                    format === opt.type ? 'border-button bg-button/5' : 'border-secondary/20 hover:border-secondary/40'
                  }`}
                >
                  <div className="text-sm font-bold text-headline mb-1">{opt.label}</div>
                  <div className="text-xs text-paragraph/60">{opt.desc}</div>
                </button>
              ))}
            </div>
          )}

          {step === 3 && format && (
            <div className="space-y-4">
              <button onClick={() => setStep(2)} className="text-xs text-button hover:text-button/80 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                形式選択に戻る
              </button>

              <div className="p-3 bg-button/5 border border-button/20 rounded-lg">
                <p className="text-xs text-paragraph/60">選択された形式</p>
                <p className="text-sm font-bold text-headline">{PRINT_LABELS[format]}</p>
              </div>

              {needsClass && (
                <div>
                  <label className="block text-sm font-medium text-paragraph/80 mb-1">クラスを選択</label>
                  <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/40">
                    {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                  </select>
                </div>
              )}

              {needsDate && (
                <div>
                  <label className="block text-sm font-medium text-paragraph/80 mb-1">日付を選択</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/40" />
                </div>
              )}

              <button
                onClick={handlePreview}
                className="w-full px-4 py-2.5 bg-button text-white rounded-lg text-sm hover:bg-button/90 transition-all font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                プレビュー表示
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 印刷プレビュー ──────────────────────────────
function PrintPreview({
  config,
  plans,
  classes,
  onClose,
}: {
  config: PrintConfig;
  plans: CurriculumPlan[];
  classes: { id: string; name: string; color?: string }[];
  onClose: () => void;
}) {
  const getClassName = (classId: string) => classes.find(c => c.id === classId)?.name ?? classId;
  const now = new Date();
  const today = now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

  const handlePrint = () => window.print();

  // Helper: get date range for a week
  const getWeekDates = (baseDate: string) => {
    const d = new Date(baseDate);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });
  };

  // Helper: get weeks of a month
  const getMonthWeeks = () => {
    const weeks: string[] = [];
    for (let w = 1; w <= 5; w++) {
      weeks.push(`第${w}週`);
    }
    return weeks;
  };

  // Helper: get months of a year
  const getYearMonths = () => {
    const months: string[] = [];
    const fiscalStart = 4;
    for (let i = 0; i < 12; i++) {
      const m = ((fiscalStart - 1 + i) % 12) + 1;
      months.push(`${m}月`);
    }
    return months;
  };

  // Find plans for print type
  const findPlan = (level: PlanLevel, classId: string, period?: string) => {
    return plans.find(p => p.level === level && p.classId === classId && (!period || p.period === period));
  };

  const renderTable = () => {
    switch (config.type) {
      case 'daily-week': {
        const cls = config.classId!;
        const dates = config.date ? getWeekDates(config.date) : getWeekDates(now.toISOString().slice(0, 10));
        const dayLabels = ['月', '火', '水', '木', '金', '土', '日'];
        const dailyPlans = dates.map((_, i) => findPlan('daily', cls));
        return (
          <div>
            <h2 className="text-lg font-bold mb-1">{getClassName(cls)} - 日案（1週間）</h2>
            <p className="text-xs text-gray-500 mb-3">印刷日: {today}</p>
            <table className="print-table w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="w-24">項目</th>
                  {dayLabels.map((d, i) => (
                    <th key={i}>{d}<br/><span className="text-[10px] font-normal">{dates[i].getMonth()+1}/{dates[i].getDate()}</span></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PRINT_ROW_FIELDS.map(field => (
                  <tr key={field.key}>
                    <td className="font-medium bg-gray-50">{field.label}</td>
                    {dailyPlans.map((plan, i) => (
                      <React.Fragment key={i}>
                        {renderPlanCell(plan, field.key)}
                      </React.Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'daily-allclass': {
        const dateStr = config.date ?? now.toISOString().slice(0, 10);
        const d = new Date(dateStr);
        const label = d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
        return (
          <div>
            <h2 className="text-lg font-bold mb-1">{label} - 全クラス日案</h2>
            <p className="text-xs text-gray-500 mb-3">印刷日: {today}</p>
            <table className="print-table w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="w-24">項目</th>
                  {classes.map(cls => <th key={cls.id}>{cls.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {PRINT_ROW_FIELDS.map(field => (
                  <tr key={field.key}>
                    <td className="font-medium bg-gray-50">{field.label}</td>
                    {classes.map(cls => {
                      const plan = findPlan('daily', cls.id);
                      return <React.Fragment key={cls.id}>{renderPlanCell(plan, field.key)}</React.Fragment>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'weekly-month': {
        const cls = config.classId!;
        const weeks = getMonthWeeks();
        const currentMonth = `${now.getMonth() + 1}月`;
        return (
          <div>
            <h2 className="text-lg font-bold mb-1">{getClassName(cls)} - 週案（{currentMonth}）</h2>
            <p className="text-xs text-gray-500 mb-3">印刷日: {today}</p>
            <table className="print-table w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="w-24">項目</th>
                  {weeks.map(w => <th key={w}>{currentMonth}{w}</th>)}
                </tr>
              </thead>
              <tbody>
                {PRINT_ROW_FIELDS.map(field => (
                  <tr key={field.key}>
                    <td className="font-medium bg-gray-50">{field.label}</td>
                    {weeks.map(w => {
                      const plan = findPlan('weekly', cls, `${currentMonth}${w}`);
                      return <React.Fragment key={w}>{renderPlanCell(plan, field.key)}</React.Fragment>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'weekly-allclass': {
        const currentWeek = `${now.getMonth() + 1}月第3週`;
        return (
          <div>
            <h2 className="text-lg font-bold mb-1">{currentWeek} - 全クラス週案</h2>
            <p className="text-xs text-gray-500 mb-3">印刷日: {today}</p>
            <table className="print-table w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="w-24">項目</th>
                  {classes.map(cls => <th key={cls.id}>{cls.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {PRINT_ROW_FIELDS.map(field => (
                  <tr key={field.key}>
                    <td className="font-medium bg-gray-50">{field.label}</td>
                    {classes.map(cls => {
                      const plan = findPlan('weekly', cls.id);
                      return <React.Fragment key={cls.id}>{renderPlanCell(plan, field.key)}</React.Fragment>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'monthly-allclass': {
        const currentMonth = `${now.getMonth() + 1}月`;
        return (
          <div>
            <h2 className="text-lg font-bold mb-1">{currentMonth} - 全クラス月案一覧</h2>
            <p className="text-xs text-gray-500 mb-3">印刷日: {today}</p>
            <div className="grid grid-cols-2 gap-4">
              {classes.map(cls => {
                const plan = findPlan('monthly', cls.id);
                return (
                  <div key={cls.id} className="border border-gray-300 rounded p-3">
                    <h3 className="font-bold text-sm mb-2 pb-1 border-b border-gray-200">{cls.name}</h3>
                    {plan ? (
                      <div className="space-y-1.5 text-xs">
                        {PRINT_ROW_FIELDS.map(field => {
                          const value = plan[field.key];
                          const display = Array.isArray(value) ? value.filter(Boolean).join('、') : (value as string);
                          if (!display) return null;
                          return (
                            <div key={field.key}>
                              <span className="font-medium text-gray-600">{field.label}: </span>
                              <span>{display}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">データなし</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'monthly-year': {
        const cls = config.classId!;
        const months = getYearMonths();
        return (
          <div>
            <h2 className="text-lg font-bold mb-1">{getClassName(cls)} - 月案（年間）</h2>
            <p className="text-xs text-gray-500 mb-3">印刷日: {today}</p>
            <table className="print-table w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="w-20">項目</th>
                  {months.map(m => <th key={m}>{m}</th>)}
                </tr>
              </thead>
              <tbody>
                {PRINT_ROW_FIELDS.map(field => (
                  <tr key={field.key}>
                    <td className="font-medium bg-gray-50">{field.label}</td>
                    {months.map(m => {
                      const plan = findPlan('monthly', cls, m);
                      return <React.Fragment key={m}>{renderPlanCell(plan, field.key)}</React.Fragment>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Toolbar - hidden in print */}
      <div className="no-print sticky top-0 z-10 bg-surface border-b border-secondary/20 px-6 py-3 flex items-center justify-between">
        <button onClick={onClose} className="flex items-center gap-2 text-sm text-paragraph hover:text-headline transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          戻る
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-paragraph/50">{PRINT_LABELS[config.type]}</span>
          <button onClick={handlePrint} className="px-4 py-2 bg-button text-white rounded-lg text-sm hover:bg-button/90 transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
            </svg>
            印刷
          </button>
        </div>
      </div>

      {/* Print content */}
      <div className="print-content p-6 max-w-[1100px] mx-auto">
        {renderTable()}
      </div>
    </div>
  );
}

// ========== メインページ ==========
export default function CurriculumPage() {
  const { staff, settings } = useApp();
  const classes = settings.classes ?? defaultClasses;
  const staffIds = staff.map(s => s.id);

  const [plans, setPlans] = useState<CurriculumPlan[]>(() => generateSamplePlans(classes, staffIds));
  const [selectedLevel, setSelectedLevel] = useState<PlanLevel | 'all'>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<PlanStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState<{
    level: PlanLevel;
    classId: string;
    period: string;
    useTemplate: boolean;
  }>({
    level: 'monthly',
    classId: classes[0]?.id ?? '',
    period: '',
    useTemplate: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CurriculumPlan | null>(null);
  const [copyPreview, setCopyPreview] = useState<CurriculumPlan | null>(null);
  const [newModalTab, setNewModalTab] = useState<'template' | 'copy'>('template');
  const [copySourceId, setCopySourceId] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printMode, setPrintMode] = useState<PrintConfig | null>(null);

  const filteredPlans = plans.filter(p => {
    if (selectedLevel !== 'all' && p.level !== selectedLevel) return false;
    if (selectedClassId !== 'all' && p.classId !== selectedClassId) return false;
    if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
    return true;
  });

  const sortedPlans = [...filteredPlans].sort((a, b) => {
    if (a.deadline && !b.deadline) return -1;
    if (!a.deadline && b.deadline) return 1;
    if (a.deadline && b.deadline) return a.deadline.getTime() - b.deadline.getTime();
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  const getClassName = (classId: string) => classes.find(c => c.id === classId)?.name ?? classId;
  const getClassColor = (classId: string) => classes.find(c => c.id === classId)?.color ?? '#888';
  const getStaffName = (id: string) => {
    const s = staff.find(s => s.id === id);
    return s ? `${s.lastName} ${s.firstName}` : '';
  };

  const isDeadlineSoon = (deadline?: Date) => {
    if (!deadline) return false;
    const diff = deadline.getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  };

  const isOverdue = (deadline?: Date) => {
    if (!deadline) return false;
    return deadline.getTime() < Date.now();
  };

  const deadlineSoonCount = plans.filter(p => p.status === 'draft' && isDeadlineSoon(p.deadline)).length;
  const overdueCount = plans.filter(p => (p.status === 'draft' || p.status === 'revision') && isOverdue(p.deadline)).length;

  const createNewPlan = () => {
    const cls = classes.find(c => c.id === newForm.classId);
    const now = new Date();
    let base: Partial<CurriculumPlan> = {};

    if (newModalTab === 'copy' && copySourceId) {
      const source = plans.find(p => p.id === copySourceId);
      if (source) {
        base = {
          objectives: [...source.objectives],
          content: source.content,
          childrenActivities: [...source.childrenActivities],
          teacherSupport: [...source.teacherSupport],
          environment: [...source.environment],
        };
      }
    } else if (newForm.useTemplate) {
      base = TEMPLATES[newForm.level];
    }

    const plan: CurriculumPlan = {
      id: `plan-${Date.now()}`,
      level: newForm.level,
      classId: newForm.classId,
      title: `${newForm.period} ${cls?.name ?? ''} ${LEVEL_LABELS[newForm.level]}`,
      period: newForm.period,
      objectives: base.objectives ?? [''],
      content: base.content ?? '',
      childrenActivities: base.childrenActivities ?? [''],
      teacherSupport: base.teacherSupport ?? [''],
      environment: base.environment ?? [''],
      evaluation: '',
      status: 'draft',
      authorId: staff[0]?.id ?? '',
      createdAt: now,
      updatedAt: now,
    };

    setPlans(prev => [plan, ...prev]);
    setShowNewModal(false);
    setEditingId(plan.id);
    setEditForm(plan);
  };

  const duplicatePlan = (plan: CurriculumPlan) => {
    const now = new Date();
    const copy: CurriculumPlan = {
      ...plan,
      id: `plan-${Date.now()}`,
      title: `${plan.title}（コピー）`,
      status: 'draft',
      evaluation: '',
      createdAt: now,
      updatedAt: now,
      deadline: undefined,
    };
    setPlans(prev => [copy, ...prev]);
    setEditingId(copy.id);
    setEditForm(copy);
  };

  const openEdit = (plan: CurriculumPlan) => {
    setEditForm({ ...plan });
    setEditingId(plan.id);
  };

  const saveEdit = () => {
    if (!editForm || !editingId) return;
    setPlans(prev => prev.map(p => p.id === editingId ? { ...editForm, updatedAt: new Date() } : p));
    setEditingId(null);
    setEditForm(null);
  };

  const updateStatus = (id: string, status: PlanStatus) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, status, updatedAt: new Date() } : p));
  };

  const updateListField = (field: 'objectives' | 'childrenActivities' | 'teacherSupport' | 'environment', idx: number, value: string) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      [field]: editForm[field].map((v, i) => i === idx ? value : v),
    });
  };

  const addListItem = (field: 'objectives' | 'childrenActivities' | 'teacherSupport' | 'environment') => {
    if (!editForm) return;
    setEditForm({ ...editForm, [field]: [...editForm[field], ''] });
  };

  const removeListItem = (field: 'objectives' | 'childrenActivities' | 'teacherSupport' | 'environment', idx: number) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [field]: editForm[field].filter((_, i) => i !== idx) });
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });

  const handleLevelTabClick = (level: PlanLevel | 'all') => {
    setSelectedLevel(level);
  };

  const levelTabs: { key: PlanLevel | 'all'; label: string }[] = [
    { key: 'all', label: 'すべて' },
    { key: 'annual', label: '年間計画' },
    { key: 'monthly', label: '月案' },
    { key: 'weekly', label: '週案' },
    { key: 'daily', label: '日案' },
  ];

  if (printMode) {
    return (
      <PrintPreview
        config={printMode}
        plans={plans}
        classes={classes}
        onClose={() => setPrintMode(null)}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-headline">保育計画</h1>
            <div className="flex items-center gap-3">
              {overdueCount > 0 && (
                <span className="text-xs px-2 py-1 bg-alert/10 text-alert rounded-full font-medium animate-pulse">
                  期限超過 {overdueCount}件
                </span>
              )}
              {deadlineSoonCount > 0 && (
                <span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full font-medium">
                  締切間近 {deadlineSoonCount}件
                </span>
              )}
              <button
                onClick={() => setShowPrintModal(true)}
                className="px-4 py-2 border border-secondary/30 text-paragraph rounded-lg text-sm hover:bg-secondary/10 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                </svg>
                印刷
              </button>
              <button
                onClick={() => setShowNewModal(true)}
                className="px-4 py-2 bg-button text-white rounded-lg text-sm hover:bg-button/90 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                新規作成
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* ── 統計サマリーカード ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['annual', 'monthly', 'weekly', 'daily'] as PlanLevel[]).map(level => (
            <SummaryCard
              key={level}
              level={level}
              plans={plans}
              isActive={selectedLevel === level}
              onClick={() => handleLevelTabClick(selectedLevel === level ? 'all' : level)}
            />
          ))}
        </div>

        {/* ── 進捗バー ── */}
        <ProgressOverview plans={plans} />

        {/* ── レベル別タブ + フィルター ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex bg-secondary/20 rounded-xl p-1 gap-0.5">
            {levelTabs.map(tab => {
              const count = tab.key === 'all' ? plans.length : plans.filter(p => p.level === tab.key).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleLevelTabClick(tab.key)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    selectedLevel === tab.key
                      ? 'bg-surface text-headline shadow-sm'
                      : 'text-paragraph/60 hover:text-paragraph hover:bg-surface/50'
                  }`}
                >
                  {tab.key !== 'all' && <span>{LEVEL_CONFIG[tab.key as PlanLevel].icon}</span>}
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    selectedLevel === tab.key ? 'bg-button/10 text-button' : 'bg-secondary/30 text-paragraph/40'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm border border-secondary/30 bg-surface focus:outline-none focus:ring-2 focus:ring-button/40"
            >
              <option value="all">全クラス</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as PlanStatus | 'all')}
              className="px-3 py-1.5 rounded-lg text-sm border border-secondary/30 bg-surface focus:outline-none focus:ring-2 focus:ring-button/40"
            >
              <option value="all">全ステータス</option>
              {(Object.entries(STATUS_LABELS) as [PlanStatus, string][]).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── 計画カード一覧 ── */}
        <div className="space-y-3">
          {sortedPlans.map(plan => {
            const isExpanded = expandedId === plan.id;
            const deadlineSoon = isDeadlineSoon(plan.deadline);
            const overdue = isOverdue(plan.deadline) && (plan.status === 'draft' || plan.status === 'revision');
            const levelConf = LEVEL_CONFIG[plan.level];

            return (
              <div
                key={plan.id}
                className={`bg-surface rounded-xl shadow-sm border-l-4 overflow-hidden transition-all duration-200 hover:shadow-md ${
                  overdue ? 'border-alert' : deadlineSoon ? 'border-orange-400' : levelConf.borderColor
                }`}
              >
                <div
                  className="p-4 cursor-pointer hover:bg-secondary/5 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 ${levelConf.bgColor} ${levelConf.color}`}>
                          <span>{levelConf.icon}</span>
                          {LEVEL_LABELS[plan.level]}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                          style={{ backgroundColor: getClassColor(plan.classId) }}
                        >
                          {getClassName(plan.classId)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[plan.status]}`}>
                          {STATUS_LABELS[plan.status]}
                        </span>
                        {overdue && (
                          <span className="text-xs px-2 py-0.5 bg-alert/10 text-alert rounded-full font-medium animate-pulse">
                            期限超過
                          </span>
                        )}
                        {deadlineSoon && !overdue && (
                          <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full font-medium">
                            締切間近
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-headline">{plan.title}</h3>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-paragraph/60">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {getStaffName(plan.authorId)}
                        </span>
                        {plan.deadline && (
                          <span className={`flex items-center gap-1 ${overdue ? 'text-alert font-medium' : ''}`}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            締切: {formatDate(plan.deadline)}
                          </span>
                        )}
                        <span>更新: {formatDate(plan.updatedAt)}</span>
                      </div>
                    </div>
                    <svg className={`w-5 h-5 text-paragraph/40 transition-transform ml-3 mt-1 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-secondary/10 pt-4">
                    {/* 展開コンテンツ: 2カラムグリッド */}
                    <div className="grid md:grid-cols-2 gap-3 mb-4">
                      <DetailSection icon="🎯" title="ねらい" color="bg-purple-50">
                        <ul className="space-y-1">
                          {plan.objectives.filter(o => o).map((obj, i) => (
                            <li key={i} className="text-sm text-paragraph flex items-start gap-2">
                              <span className="text-purple-400 mt-0.5">•</span>{obj}
                            </li>
                          ))}
                        </ul>
                      </DetailSection>

                      <DetailSection icon="🧒" title="子どもの活動" color="bg-blue-50">
                        <ul className="space-y-1">
                          {plan.childrenActivities.filter(a => a).map((act, i) => (
                            <li key={i} className="text-sm text-paragraph flex items-start gap-2">
                              <span className="text-blue-400 mt-0.5">•</span>{act}
                            </li>
                          ))}
                        </ul>
                      </DetailSection>

                      <DetailSection icon="🤝" title="保育者の援助" color="bg-emerald-50">
                        <ul className="space-y-1">
                          {plan.teacherSupport.filter(s => s).map((sup, i) => (
                            <li key={i} className="text-sm text-paragraph flex items-start gap-2">
                              <span className="text-emerald-400 mt-0.5">•</span>{sup}
                            </li>
                          ))}
                        </ul>
                      </DetailSection>

                      <DetailSection icon="🌿" title="環境構成" color="bg-amber-50">
                        <ul className="space-y-1">
                          {plan.environment.filter(e => e).map((env, i) => (
                            <li key={i} className="text-sm text-paragraph flex items-start gap-2">
                              <span className="text-amber-400 mt-0.5">•</span>{env}
                            </li>
                          ))}
                        </ul>
                      </DetailSection>
                    </div>

                    {plan.content && (
                      <DetailSection icon="📄" title="内容" color="bg-gray-50">
                        <p className="text-sm text-paragraph">{plan.content}</p>
                      </DetailSection>
                    )}

                    {plan.evaluation && (
                      <div className="mt-3">
                        <DetailSection icon="📊" title="評価・反省" color="bg-rose-50">
                          <p className="text-sm text-paragraph">{plan.evaluation}</p>
                        </DetailSection>
                      </div>
                    )}

                    {/* アクションボタン */}
                    <div className="flex items-center gap-2 pt-4 flex-wrap">
                      <button onClick={() => openEdit(plan)} className="text-xs px-3 py-1.5 rounded-lg bg-button/10 text-button hover:bg-button/20 transition-colors font-medium">
                        ✏️ 編集
                      </button>
                      <button
                        onClick={() => duplicatePlan(plan)}
                        title="内容をコピーして新規下書きを作成"
                        className="text-xs px-3 py-1.5 rounded-lg bg-secondary/20 text-paragraph/70 hover:bg-secondary/30 transition-colors flex items-center gap-1"
                      >
                        📋 複製
                      </button>
                      {plan.status === 'draft' && (
                        <button onClick={() => updateStatus(plan.id, 'submitted')} className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium">
                          📤 提出する
                        </button>
                      )}
                      {plan.status === 'submitted' && (
                        <>
                          <button onClick={() => updateStatus(plan.id, 'approved')} className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors font-medium">
                            ✅ 承認
                          </button>
                          <button onClick={() => updateStatus(plan.id, 'revision')} className="text-xs px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors font-medium">
                            🔄 要修正
                          </button>
                        </>
                      )}
                      {plan.status === 'revision' && (
                        <button onClick={() => updateStatus(plan.id, 'submitted')} className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium">
                          📤 再提出
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {sortedPlans.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-4 bg-secondary/20 rounded-2xl flex items-center justify-center">
                <span className="text-4xl">📋</span>
              </div>
              <h2 className="text-lg font-bold text-headline mb-2">該当する計画がありません</h2>
              <p className="text-paragraph/60 mb-4">フィルター条件を変更するか、新規作成してください</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="px-4 py-2 bg-button text-white rounded-lg text-sm hover:bg-button/90 transition-colors"
              >
                新規作成
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 新規作成モーダル */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowNewModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-surface rounded-xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-headline">新規計画の作成</h3>
                <button onClick={() => setShowNewModal(false)} className="p-1.5 hover:bg-secondary/20 rounded-lg text-paragraph/60 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex border-b border-secondary/20 mb-4">
                <button onClick={() => setNewModalTab('template')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${newModalTab === 'template' ? 'border-button text-button' : 'border-transparent text-paragraph/60 hover:text-paragraph'}`}>
                  📋 テンプレートから作成
                </button>
                <button onClick={() => setNewModalTab('copy')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${newModalTab === 'copy' ? 'border-button text-button' : 'border-transparent text-paragraph/60 hover:text-paragraph'}`}>
                  📄 過去計画からコピー
                </button>
              </div>
            </div>

            <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-paragraph/80 mb-1">計画レベル</label>
                <div className="grid grid-cols-4 gap-1">
                  {(Object.entries(LEVEL_LABELS) as [PlanLevel, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setNewForm(f => ({ ...f, level: key as PlanLevel })); setCopySourceId(''); setCopyPreview(null); }}
                      className={`px-2 py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 ${newForm.level === key
                        ? 'bg-button text-white'
                        : 'bg-secondary/20 text-paragraph/60 hover:bg-secondary/30'
                      }`}
                    >
                      <span>{LEVEL_CONFIG[key as PlanLevel].icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-paragraph/80 mb-1">クラス</label>
                <select value={newForm.classId} onChange={e => setNewForm(f => ({ ...f, classId: e.target.value }))} className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/40">
                  {classes.map(cls => (<option key={cls.id} value={cls.id}>{cls.name}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-paragraph/80 mb-1">新しい対象期間 *</label>
                <input type="text" value={newForm.period} onChange={e => setNewForm(f => ({ ...f, period: e.target.value }))} placeholder={newForm.level === 'annual' ? '2026年度' : newForm.level === 'monthly' ? '4月' : newForm.level === 'weekly' ? '4月第1週' : '4月4日'} className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/40" autoFocus />
              </div>

              {newModalTab === 'template' && (
                <label className="flex items-center gap-2 cursor-pointer p-3 bg-secondary/10 rounded-lg">
                  <input type="checkbox" checked={newForm.useTemplate} onChange={e => setNewForm(f => ({ ...f, useTemplate: e.target.checked }))} className="rounded border-secondary/30" />
                  <div>
                    <span className="text-sm font-medium text-paragraph">デフォルトテンプレートを使用</span>
                    <p className="text-xs text-paragraph/60 mt-0.5">レベルに合わせた標準的なねらい・活動が入ります</p>
                  </div>
                </label>
              )}

              {newModalTab === 'copy' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-paragraph/80 mb-1">コピー元の計画を選択</label>
                    <select value={copySourceId} onChange={e => { setCopySourceId(e.target.value); setCopyPreview(plans.find(p => p.id === e.target.value) ?? null); }} className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/40">
                      <option value="">選択してください...</option>
                      {plans.filter(p => p.level === newForm.level).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).map(p => (
                        <option key={p.id} value={p.id}>{p.period} / {getClassName(p.classId)} / {STATUS_LABELS[p.status]}</option>
                      ))}
                    </select>
                    {plans.filter(p => p.level === newForm.level).length === 0 && (
                      <p className="text-xs text-paragraph/50 mt-1">同じレベルの計画がありません</p>
                    )}
                  </div>
                  {copyPreview && (
                    <div className="p-3 bg-button/5 border border-button/20 rounded-xl space-y-2">
                      <p className="text-xs font-medium text-button">コピー内容のプレビュー</p>
                      {copyPreview.objectives.filter(Boolean).length > 0 && (
                        <div>
                          <p className="text-xs text-paragraph/60 mb-1">ねらい</p>
                          <ul className="text-xs text-paragraph space-y-0.5">
                            {copyPreview.objectives.filter(Boolean).map((o, i) => (
                              <li key={i} className="flex gap-1"><span className="text-button">•</span>{o}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="text-xs text-paragraph/50 pt-1 border-t border-button/10">ℹ️ 評価・反省は引き継ぎません</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-secondary/20">
              <button onClick={() => { setShowNewModal(false); setCopyPreview(null); setCopySourceId(''); }} className="px-4 py-2 text-sm text-paragraph/70 hover:bg-secondary/20 rounded-lg transition-colors">
                キャンセル
              </button>
              <button onClick={createNewPlan} disabled={!newForm.period || (newModalTab === 'copy' && !copySourceId)} className="px-4 py-2 text-sm bg-button text-white rounded-lg hover:bg-button/90 transition-colors disabled:opacity-40">
                {newModalTab === 'copy' ? 'コピーして作成' : '作成して編集'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 印刷設定モーダル */}
      {showPrintModal && (
        <PrintSetupModal
          classes={classes}
          onClose={() => setShowPrintModal(false)}
          onPreview={(config) => {
            setShowPrintModal(false);
            setPrintMode(config);
          }}
        />
      )}

      {/* 編集モーダル */}
      {editingId && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setEditingId(null); setEditForm(null); }}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-surface rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 ${LEVEL_CONFIG[editForm.level].bgColor} ${LEVEL_CONFIG[editForm.level].color}`}>
                <span>{LEVEL_CONFIG[editForm.level].icon}</span>
                {LEVEL_LABELS[editForm.level]}
              </span>
              <h3 className="text-lg font-bold text-headline">{editForm.title}</h3>
            </div>

            <div className="space-y-5">
              <ListEditor label="ねらい" items={editForm.objectives} onUpdate={(idx, val) => updateListField('objectives', idx, val)} onAdd={() => addListItem('objectives')} onRemove={(idx) => removeListItem('objectives', idx)} placeholder="ねらいを記入..." />
              <div>
                <label className="block text-sm font-medium text-paragraph/80 mb-1">内容</label>
                <textarea value={editForm.content} onChange={e => setEditForm({ ...editForm, content: e.target.value })} rows={3} className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/40 resize-none" placeholder="保育の内容を記入..." />
              </div>
              <ListEditor label="子どもの活動" items={editForm.childrenActivities} onUpdate={(idx, val) => updateListField('childrenActivities', idx, val)} onAdd={() => addListItem('childrenActivities')} onRemove={(idx) => removeListItem('childrenActivities', idx)} placeholder="活動を記入..." />
              <ListEditor label="保育者の援助" items={editForm.teacherSupport} onUpdate={(idx, val) => updateListField('teacherSupport', idx, val)} onAdd={() => addListItem('teacherSupport')} onRemove={(idx) => removeListItem('teacherSupport', idx)} placeholder="援助内容を記入..." />
              <ListEditor label="環境構成" items={editForm.environment} onUpdate={(idx, val) => updateListField('environment', idx, val)} onAdd={() => addListItem('environment')} onRemove={(idx) => removeListItem('environment', idx)} placeholder="環境構成を記入..." />
              <div>
                <label className="block text-sm font-medium text-paragraph/80 mb-1">評価・反省</label>
                <textarea value={editForm.evaluation} onChange={e => setEditForm({ ...editForm, evaluation: e.target.value })} rows={3} className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/40 resize-none" placeholder="保育の振り返りを記入..." />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setEditingId(null); setEditForm(null); }} className="px-4 py-2 text-sm text-paragraph/70 hover:bg-secondary/20 rounded-lg transition-colors">
                キャンセル
              </button>
              <button onClick={saveEdit} className="px-4 py-2 text-sm bg-button text-white rounded-lg hover:bg-button/90 transition-colors">
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
