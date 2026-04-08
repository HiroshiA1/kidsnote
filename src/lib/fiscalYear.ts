/**
 * 年度管理ユーティリティ
 *
 * 日本の幼稚園年度（4/1〜翌年3/31）基準。
 * 園児の学年は「対象年度の4/1時点での満年齢」から動的に算出する。
 *  - 満3歳: 年少
 *  - 満4歳: 年中
 *  - 満5歳: 年長
 *  - 満6歳以上: 卒園
 *  - 満2歳以下: 未就園
 */

export type GradeStatus = '未就園' | '年少' | '年中' | '年長' | '卒園';

/** 今日時点の年度を返す（4月以降は今年、1〜3月は前年） */
export function getCurrentFiscalYear(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  return month >= 3 ? year : year - 1; // 4月(index=3)以降は今年度
}

/** 指定年度の4/1時点での満年齢 */
export function getAgeInFiscalYear(birthDate: Date, fiscalYear: number): number {
  const reference = new Date(fiscalYear, 3, 1); // 4月1日
  let age = reference.getFullYear() - birthDate.getFullYear();
  const m = reference.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && reference.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/** 指定年度での学年ステータス */
export function getGradeInFiscalYear(birthDate: Date, fiscalYear: number): GradeStatus {
  const age = getAgeInFiscalYear(birthDate, fiscalYear);
  if (age < 3) return '未就園';
  if (age === 3) return '年少';
  if (age === 4) return '年中';
  if (age === 5) return '年長';
  return '卒園';
}

/** 在園中か（年少〜年長） */
export function isEnrolledInFiscalYear(birthDate: Date, fiscalYear: number): boolean {
  const g = getGradeInFiscalYear(birthDate, fiscalYear);
  return g === '年少' || g === '年中' || g === '年長';
}

/** 表示用: "2025年度" */
export function formatFiscalYear(fiscalYear: number): string {
  return `${fiscalYear}年度`;
}

/** 選択肢用に年度リストを生成（現在年度の前後数年） */
export function getFiscalYearOptions(rangeBefore = 3, rangeAfter = 1): number[] {
  const current = getCurrentFiscalYear();
  const list: number[] = [];
  for (let y = current - rangeBefore; y <= current + rangeAfter; y++) {
    list.push(y);
  }
  return list;
}
