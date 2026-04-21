// 学校基本調査ベースの園設定型定義
import { CalendarCategoryConfig, DEFAULT_CALENDAR_CATEGORIES } from '@/types/calendar';
import { RuleCategoryConfig, DEFAULT_RULE_CATEGORIES } from '@/types/rule';

export interface BasicInfo {
  prefectureCode: string;
  schoolCode: string;
  establisherType: '国立' | '公立' | '私立';
  branchType: '本園' | '分園';
  authorizedCapacity: number;
  schoolName: string;
  postalCode: string;
  address: string;
  phone: string;
  fax: string;
  principalName: string;
  establishedDate: string;
}

export type TeacherPosition = '園長' | '副園長' | '教頭' | '主幹教諭' | '指導教諭' | '教諭' | '助教諭' | '講師' | '養護教諭' | '養護助教諭' | '栄養教諭';

export interface TeacherCount {
  position: TeacherPosition;
  fullTimeMale: number;
  fullTimeFemale: number;
  partTimeMale: number;
  partTimeFemale: number;
  isAutoCalculated: boolean;
}

export type StaffPosition = '事務職員' | '養護職員' | '用務員' | '調理員' | '学校医' | '学校歯科医' | '学校薬剤師';

export interface StaffCount {
  position: StaffPosition;
  male: number;
  female: number;
}

export interface LeaveRecord {
  type: '育児休業' | '産前産後休暇' | '病気休職' | 'その他';
  count: number;
}

export interface ClassEnrollment {
  className: string;
  age3Male: number;
  age3Female: number;
  age4Male: number;
  age4Female: number;
  age5Male: number;
  age5Female: number;
  isAutoCalculated: boolean;
}

export interface GraduateCount {
  male: number;
  female: number;
}

export interface ClassInfo {
  id: string;
  name: string;
  grade: '未就園児' | '満3歳児' | '年少' | '年中' | '年長';
  color: string;
}

export interface StaffRoleConfig {
  id: string;
  name: string;
  displayOrder: number;
}

export interface MenuVisibilityConfig {
  hiddenItems: string[];
}

export type LLMProvider = 'gemini' | 'openai' | 'claude';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
}

export const llmProviderOptions: Record<LLMProvider, { label: string; models: { id: string; label: string }[] }> = {
  gemini: {
    label: 'Google Gemini',
    models: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (Preview)' },
      { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (Preview)' },
      { id: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite (Preview)' },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    ],
  },
  openai: {
    label: 'OpenAI',
    models: [
      { id: 'gpt-5.4-mini', label: 'GPT-5.4 Mini' },
      { id: 'gpt-5.4-nano', label: 'GPT-5.4 Nano' },
      { id: 'gpt-5.4', label: 'GPT-5.4' },
      { id: 'gpt-4.1', label: 'GPT-4.1' },
      { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
      { id: 'o3-mini', label: 'o3-mini' },
      { id: 'o4-mini', label: 'o4-mini' },
      { id: 'o3', label: 'o3' },
    ],
  },
  claude: {
    label: 'Anthropic Claude',
    models: [
      { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
      { id: 'claude-opus-4-7', label: 'Claude Opus 4.7' },
      { id: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
      { id: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5' },
    ],
  },
};

export const defaultStaffRoleConfigs: StaffRoleConfig[] = [
  { id: 'encho', name: '園長', displayOrder: 0 },
  { id: 'shunin', name: '主任', displayOrder: 1 },
  { id: 'tannin', name: '担任', displayOrder: 2 },
  { id: 'fukutannin', name: '副担任', displayOrder: 3 },
  { id: 'part', name: 'パート', displayOrder: 4 },
];

export interface SchoolSettings {
  basicInfo: BasicInfo;
  teacherCounts: TeacherCount[];
  staffCounts: StaffCount[];
  leaveRecords: LeaveRecord[];
  classEnrollments: ClassEnrollment[];
  graduateCount: GraduateCount;
  classes: ClassInfo[];
  staffRoleConfigs?: StaffRoleConfig[];
  menuVisibility?: MenuVisibilityConfig;
  llmConfig?: LLMConfig;
  calendarCategories?: CalendarCategoryConfig[];
  ruleCategories?: RuleCategoryConfig[];
}

export const defaultBasicInfo: BasicInfo = {
  prefectureCode: '',
  schoolCode: '',
  establisherType: '私立',
  branchType: '本園',
  authorizedCapacity: 0,
  schoolName: '',
  postalCode: '',
  address: '',
  phone: '',
  fax: '',
  principalName: '',
  establishedDate: '',
};

export const defaultTeacherPositions: TeacherPosition[] = [
  '園長', '副園長', '教頭', '主幹教諭', '指導教諭', '教諭', '助教諭', '講師', '養護教諭', '養護助教諭', '栄養教諭',
];

export const defaultStaffPositions: StaffPosition[] = [
  '事務職員', '養護職員', '用務員', '調理員', '学校医', '学校歯科医', '学校薬剤師',
];

export const defaultClasses: ClassInfo[] = [
  { id: 'sakura', name: 'さくら組', grade: '年中', color: '#EC4899' },
  { id: 'himawari', name: 'ひまわり組', grade: '年中', color: '#F59E0B' },
  { id: 'tulip', name: 'チューリップ組', grade: '年長', color: '#EF4444' },
  { id: 'tanpopo', name: 'たんぽぽ組', grade: '年少', color: '#EAB308' },
  { id: 'hiyoko', name: 'ひよこ組', grade: '年少', color: '#FB923C' },
  { id: 'usagi', name: 'うさぎ組', grade: '年中', color: '#0EA5E9' },
  { id: 'yuri', name: 'ゆり組', grade: '年長', color: '#A78BFA' },
];

export const defaultSchoolSettings: SchoolSettings = {
  basicInfo: defaultBasicInfo,
  teacherCounts: defaultTeacherPositions.map(position => ({
    position,
    fullTimeMale: 0,
    fullTimeFemale: 0,
    partTimeMale: 0,
    partTimeFemale: 0,
    isAutoCalculated: false,
  })),
  staffCounts: defaultStaffPositions.map(position => ({
    position,
    male: 0,
    female: 0,
  })),
  leaveRecords: [
    { type: '育児休業', count: 0 },
    { type: '産前産後休暇', count: 0 },
    { type: '病気休職', count: 0 },
    { type: 'その他', count: 0 },
  ],
  classEnrollments: [],
  graduateCount: { male: 0, female: 0 },
  classes: defaultClasses,
  calendarCategories: DEFAULT_CALENDAR_CATEGORIES,
  ruleCategories: DEFAULT_RULE_CATEGORIES,
};

// Staffのroleから教員職階へのマッピング
export const roleToPositionMap: Record<string, TeacherPosition> = {
  '園長': '園長',
  '主任': '主幹教諭',
  '担任': '教諭',
  '副担任': '教諭',
  'パート': '講師',
};
