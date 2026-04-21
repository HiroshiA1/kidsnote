/** カテゴリは動的に管理されるため string 型 */
export type CalendarCategory = string;

/** @deprecated 新コードでは settings.calendarCategories を使用 */
export const CALENDAR_CATEGORIES: string[] = [
  '行事', '会議', '健診', '避難訓練', '出張', '研修', '保護者面談', '誕生会', 'クラス活動', 'その他',
];

/** @deprecated 新コードでは getCategoryColor() を使用 */
export const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  '行事':       { bg: 'bg-rose-100',    text: 'text-rose-800',    dot: 'bg-rose-500' },
  '会議':       { bg: 'bg-blue-100',    text: 'text-blue-800',    dot: 'bg-blue-500' },
  '健診':       { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  '避難訓練':   { bg: 'bg-orange-100',  text: 'text-orange-800',  dot: 'bg-orange-500' },
  '出張':       { bg: 'bg-violet-100',  text: 'text-violet-800',  dot: 'bg-violet-500' },
  '研修':       { bg: 'bg-indigo-100',  text: 'text-indigo-800',  dot: 'bg-indigo-500' },
  '保護者面談': { bg: 'bg-pink-100',    text: 'text-pink-800',    dot: 'bg-pink-500' },
  '誕生会':     { bg: 'bg-yellow-100',  text: 'text-yellow-800',  dot: 'bg-yellow-500' },
  'クラス活動': { bg: 'bg-teal-100',    text: 'text-teal-800',    dot: 'bg-teal-500' },
  'その他':     { bg: 'bg-slate-100',   text: 'text-slate-800',   dot: 'bg-slate-500' },
};

/** 動的カテゴリ設定 */
export interface CalendarCategoryConfig {
  id: string;
  name: string;
  color: string; // hex
  displayOrder: number;
}

export const DEFAULT_CALENDAR_CATEGORIES: CalendarCategoryConfig[] = [
  { id: 'gyoji',        name: '行事',       color: '#F43F5E', displayOrder: 0 },
  { id: 'kaigi',        name: '会議',       color: '#3B82F6', displayOrder: 1 },
  { id: 'kenshin',      name: '健診',       color: '#10B981', displayOrder: 2 },
  { id: 'hinan',        name: '避難訓練',   color: '#F97316', displayOrder: 3 },
  { id: 'shucchou',     name: '出張',       color: '#8B5CF6', displayOrder: 4 },
  { id: 'kenshu',       name: '研修',       color: '#6366F1', displayOrder: 5 },
  { id: 'hogosha',      name: '保護者面談', color: '#EC4899', displayOrder: 6 },
  { id: 'tanjokai',     name: '誕生会',     color: '#EAB308', displayOrder: 7 },
  { id: 'class_katudo', name: 'クラス活動', color: '#14B8A6', displayOrder: 8 },
  { id: 'sonota',       name: 'その他',     color: '#64748B', displayOrder: 9 },
];

/** hex色からinline style用の色情報を生成 */
export function getCategoryColor(categoryName: string, categories: CalendarCategoryConfig[]): { bg: string; text: string; dot: string } {
  const cat = categories.find(c => c.name === categoryName);
  const hex = cat?.color ?? '#64748B';
  return {
    bg: hexToRgba(hex, 0.15),
    text: hex,
    dot: hex,
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export type EventStatus = 'scheduled' | 'cancelled' | 'done';

export type VisibilityScope = 'all_staff' | 'class' | 'staff' | 'children_related';

export interface CalendarEvent {
  id: string;
  title: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** HH:mm */
  startTime?: string;
  endTime?: string;
  allDay: boolean;
  category: CalendarCategory;
  status: EventStatus;
  description?: string;
  location?: string;
  visibilityScope: VisibilityScope;
  targetClassIds?: string[];
  targetStaffIds?: string[];
  targetChildIds?: string[];
  ownerStaffId?: string;
  /** 職員への申し送り */
  notesForStaff?: string;
  /** 事前準備メモ */
  preparationNotes?: string;
  /** 当日の引き継ぎメモ */
  handoverNotes?: string;
  /** 持ち物 */
  bringItems?: string;
  /** 連絡先 */
  contactPoints?: string;
  fiscalYear: number;
  createdAt: string;
  updatedAt: string;
  /** Google Calendar 連携でのイベント ID */
  googleEventId?: string;
}

export interface SupportAssignment {
  id: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  staffId: string;
  targetClassId: string;
  /** HH:mm */
  startTime: string;
  /** HH:mm */
  endTime: string;
  taskDescription: string;
  createdAt: string;
  updatedAt: string;
}
