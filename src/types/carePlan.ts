export type PlanLevel = 'annual' | 'monthly' | 'weekly' | 'daily';
export type PlanStatus = 'draft' | 'submitted' | 'approved' | 'revision';

export interface CurriculumPlan {
  id: string;
  level: PlanLevel;
  classId: string;
  title: string;
  period: string;
  date?: string; // YYYY-MM-DD (日案用)
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

export interface DailyReflection {
  id: string;
  planId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  overallReflection: string;
  nextDayNotes: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChildDailyReflection {
  id: string;
  planId: string;
  childId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  note: string;
  growthDomains?: string[];
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PrintType = 'daily-week' | 'daily-allclass' | 'weekly-month' | 'weekly-allclass' | 'monthly-allclass' | 'monthly-year';

export interface PrintConfig {
  type: PrintType;
  classId?: string;
  date?: string;
  week?: string;
}

export const LEVEL_LABELS: Record<PlanLevel, string> = {
  annual: '年間計画',
  monthly: '月案',
  weekly: '週案',
  daily: '日案',
};

export const STATUS_LABELS: Record<PlanStatus, string> = {
  draft: '下書き',
  submitted: '提出済',
  approved: '承認済',
  revision: '要修正',
};

export const STATUS_COLORS: Record<PlanStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-600',
  approved: 'bg-green-100 text-green-600',
  revision: 'bg-orange-100 text-orange-600',
};

export const LEVEL_CONFIG: Record<PlanLevel, { icon: string; color: string; bgColor: string; lightBg: string; borderColor: string }> = {
  annual: { icon: '🗓️', color: 'text-purple-600', bgColor: 'bg-purple-100', lightBg: 'bg-purple-50', borderColor: 'border-purple-400' },
  monthly: { icon: '📅', color: 'text-blue-600', bgColor: 'bg-blue-100', lightBg: 'bg-blue-50', borderColor: 'border-blue-400' },
  weekly: { icon: '📋', color: 'text-emerald-600', bgColor: 'bg-emerald-100', lightBg: 'bg-emerald-50', borderColor: 'border-emerald-400' },
  daily: { icon: '📝', color: 'text-amber-600', bgColor: 'bg-amber-100', lightBg: 'bg-amber-50', borderColor: 'border-amber-400' },
};

export const PRINT_LABELS: Record<PrintType, string> = {
  'daily-week': '各クラスの1週間（日案）',
  'daily-allclass': '1日の各クラス全体（日案）',
  'weekly-month': '1クラスの1ヶ月分（週案）',
  'weekly-allclass': '各クラスの週案',
  'monthly-allclass': '当月の各クラス一覧（月案）',
  'monthly-year': '1クラスの1年間分（月案）',
};
