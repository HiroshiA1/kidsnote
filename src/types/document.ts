export type AttendanceStatus = '○' | '×' | '△' | '▽' | '-';

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  '○': '出席',
  '×': '欠席',
  '△': '遅刻',
  '▽': '早退',
  '-': '休園日',
};

export interface AttendanceRecord {
  childId: string;
  year: number;
  month: number;
  day: number;
  status: AttendanceStatus;
}
