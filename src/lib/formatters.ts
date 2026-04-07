/** 日付を短い形式でフォーマット (例: "3月11日 14:30") */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 日付をグループ表示用にフォーマット (例: "2026年3月11日(水)") */
export function formatDateGroup(date: Date): string {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

/** 生年月日から年齢を計算 */
export function calculateAge(birthDate: Date): number {
  return Math.floor(
    (new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
}

/** 勤続年数を計算 */
export function calculateYearsOfService(hireDate: Date): number {
  return Math.floor(
    (new Date().getTime() - hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
}

/** 重大度のラベル */
export const severityLabels: Record<string, string> = {
  low: '軽微',
  medium: '中程度',
  high: '重大',
};

/** 重大度の色 */
export const severityColors: Record<string, string> = {
  low: 'bg-tertiary',
  medium: 'bg-secondary',
  high: 'bg-alert',
};

/** 成長記録の発達領域 */
export const DEVELOPMENT_AREAS = [
  '健康', '人間関係', '環境', '言葉', '表現',
  '身体的発達', '社会性', '認知・知的発達', '情緒',
] as const;

/** 性別ラベル */
export const genderLabels: Record<string, string> = {
  male: '男の子',
  female: '女の子',
};

/** フィールドラベル */
export const fieldLabels: Record<string, string> = {
  allergy: 'アレルギー情報',
  characteristic: '特性',
};
