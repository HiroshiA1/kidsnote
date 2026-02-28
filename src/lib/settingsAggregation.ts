import { Staff } from '@/components/AppLayout';
import { ChildWithGrowth } from '@/lib/childrenStore';
import { TeacherCount, ClassEnrollment, roleToPositionMap, TeacherPosition, defaultTeacherPositions } from '@/types/settings';

/**
 * 職員データから教員数を自動集計
 * Staff.role → TeacherPosition マッピング
 */
export function aggregateTeacherCounts(staff: Staff[]): TeacherCount[] {
  const counts = new Map<TeacherPosition, { fullTimeMale: number; fullTimeFemale: number; partTimeMale: number; partTimeFemale: number }>();

  // 初期化
  for (const pos of defaultTeacherPositions) {
    counts.set(pos, { fullTimeMale: 0, fullTimeFemale: 0, partTimeMale: 0, partTimeFemale: 0 });
  }

  for (const member of staff) {
    const position = roleToPositionMap[member.role];
    if (!position) continue;

    const entry = counts.get(position);
    if (!entry) continue;

    // パートは兼務扱い、それ以外は本務
    const isPartTime = member.role === 'パート';

    // 性別推定: 名前から（簡易的な判定、実際は性別フィールドが必要）
    // ここでは一律女性として集計（保育現場の実態に合わせたデフォルト）
    if (isPartTime) {
      entry.partTimeFemale += 1;
    } else {
      entry.fullTimeFemale += 1;
    }
  }

  return defaultTeacherPositions.map(position => ({
    position,
    ...counts.get(position)!,
    isAutoCalculated: true,
  }));
}

/**
 * 学齢を計算（4/2〜翌4/1基準）
 * 基準日: その年度の4月1日時点での満年齢
 */
export function calculateSchoolAge(birthDate: Date, fiscalYear: number): number {
  // 学齢の基準日は 4月1日
  const referenceDate = new Date(fiscalYear, 3, 1); // 4月1日
  let age = referenceDate.getFullYear() - birthDate.getFullYear();

  // 4月2日以降生まれの場合は1歳引く
  const birthMonth = birthDate.getMonth();
  const birthDay = birthDate.getDate();
  const refMonth = referenceDate.getMonth();
  const refDay = referenceDate.getDate();

  if (birthMonth > refMonth || (birthMonth === refMonth && birthDay > refDay)) {
    age -= 1;
  }

  return age;
}

/**
 * 園児データからクラス別×年齢別在園者数を自動集計
 */
export function aggregateEnrollment(children: ChildWithGrowth[], fiscalYear?: number): ClassEnrollment[] {
  const year = fiscalYear ?? new Date().getFullYear();

  // クラス名でグループ化
  const classMap = new Map<string, ClassEnrollment>();

  for (const child of children) {
    const cn = child.className;
    if (!classMap.has(cn)) {
      classMap.set(cn, {
        className: cn,
        age3Male: 0, age3Female: 0,
        age4Male: 0, age4Female: 0,
        age5Male: 0, age5Female: 0,
        isAutoCalculated: true,
      });
    }

    const entry = classMap.get(cn)!;
    const age = calculateSchoolAge(child.birthDate, year);
    const isMale = child.gender === 'male';

    if (age === 3) {
      if (isMale) entry.age3Male++; else entry.age3Female++;
    } else if (age === 4) {
      if (isMale) entry.age4Male++; else entry.age4Female++;
    } else if (age >= 5) {
      if (isMale) entry.age5Male++; else entry.age5Female++;
    }
    // 3歳未満は集計対象外（幼稚園の場合）
  }

  return Array.from(classMap.values());
}
