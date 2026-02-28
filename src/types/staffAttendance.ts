// シフトパターン（設定で作成・管理）
export interface ShiftPattern {
  id: string;
  name: string;         // "早番", "遅番" etc.
  color: string;        // "#4CAF50"
  startTime: string;    // "07:00"
  endTime: string;      // "16:00"
  breakMinutes: number; // 休憩時間（分）
}

// 月間シフト割当
export interface ShiftAssignment {
  staffId: string;
  year: number;
  month: number;
  day: number;
  patternId: string;    // ShiftPattern.id
}

// 出勤簿ステータス
export type StaffAttendanceStatus = '出勤' | '遅刻' | '早退' | '欠勤' | '有給' | '特休' | '公休';

export const staffAttendanceStatusLabels: Record<StaffAttendanceStatus, string> = {
  '出勤': '出勤',
  '遅刻': '遅刻',
  '早退': '早退',
  '欠勤': '欠勤',
  '有給': '有給休暇',
  '特休': '特別休暇',
  '公休': '公休',
};

export const staffAttendanceStatusColors: Record<StaffAttendanceStatus, string> = {
  '出勤': 'bg-green-100 text-green-800',
  '遅刻': 'bg-yellow-100 text-yellow-800',
  '早退': 'bg-orange-100 text-orange-800',
  '欠勤': 'bg-red-100 text-red-800',
  '有給': 'bg-blue-100 text-blue-800',
  '特休': 'bg-purple-100 text-purple-800',
  '公休': 'bg-gray-100 text-gray-600',
};

export const allStaffAttendanceStatuses: StaffAttendanceStatus[] = [
  '出勤', '遅刻', '早退', '欠勤', '有給', '特休', '公休',
];

// 出勤簿レコード
export interface StaffAttendanceRecord {
  staffId: string;
  year: number;
  month: number;
  day: number;
  status: StaffAttendanceStatus;
  checkInTime: string;       // "09:00"
  checkOutTime: string;      // "18:00"
  overtimeMinutes?: number;
  note?: string;
  confirmedByAdmin?: boolean;
}

// ヘルパー: パターンから出勤レコードの初期値を作成
export function createAttendanceFromShift(
  staffId: string,
  year: number,
  month: number,
  day: number,
  pattern: ShiftPattern | undefined,
): StaffAttendanceRecord {
  if (pattern && pattern.name !== '公休') {
    return {
      staffId,
      year,
      month,
      day,
      status: '出勤',
      checkInTime: pattern.startTime,
      checkOutTime: pattern.endTime,
    };
  }
  return {
    staffId,
    year,
    month,
    day,
    status: '公休',
    checkInTime: '',
    checkOutTime: '',
  };
}

// ヘルパー: 月の日数
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// ヘルパー: 曜日名
const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
export function getDayName(year: number, month: number, day: number): string {
  return dayNames[new Date(year, month - 1, day).getDay()];
}

// ヘルパー: 週末判定
export function isWeekend(year: number, month: number, day: number): boolean {
  const dow = new Date(year, month - 1, day).getDay();
  return dow === 0 || dow === 6;
}
