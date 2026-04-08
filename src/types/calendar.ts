export type CalendarCategory =
  | '行事'
  | '会議'
  | '健診'
  | '避難訓練'
  | '出張'
  | '研修'
  | '保護者面談'
  | '誕生会'
  | 'クラス活動'
  | 'その他';

export const CALENDAR_CATEGORIES: CalendarCategory[] = [
  '行事', '会議', '健診', '避難訓練', '出張', '研修', '保護者面談', '誕生会', 'クラス活動', 'その他',
];

/** カテゴリごとの色（Tailwind クラス） */
export const CATEGORY_COLORS: Record<CalendarCategory, { bg: string; text: string; dot: string }> = {
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
}
