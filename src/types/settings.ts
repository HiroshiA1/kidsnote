// 学校基本調査ベースの園設定型定義

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
  grade: '年少' | '年中' | '年長';
  color: string;
}

export interface SchoolSettings {
  basicInfo: BasicInfo;
  teacherCounts: TeacherCount[];
  staffCounts: StaffCount[];
  leaveRecords: LeaveRecord[];
  classEnrollments: ClassEnrollment[];
  graduateCount: GraduateCount;
  classes: ClassInfo[];
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
};

// Staffのroleから教員職階へのマッピング
export const roleToPositionMap: Record<string, TeacherPosition> = {
  '園長': '園長',
  '主任': '主幹教諭',
  '担任': '教諭',
  '副担任': '教諭',
  'パート': '講師',
};
