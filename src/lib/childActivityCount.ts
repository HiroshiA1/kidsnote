import { InputMessage } from '@/types/intent';
import { AttendanceRecord } from '@/types/document';
import { ChildWithGrowth } from '@/lib/childrenStore';

/**
 * 園児に紐づく関連データ件数の計算を統一する。
 * 退園確認・完全削除確認・アーカイブ一覧など複数画面で同じ定義を使うため共有する。
 */

export interface ChildActivityCount {
  /** 成長記録件数。linkedChildIds + 名前フォールバック + growthEvaluations を合算 */
  growthCount: number;
  /** 出欠記録の日数 */
  attendanceCount: number;
}

export function countChildActivity(
  child: ChildWithGrowth,
  messages: InputMessage[],
  attendance: AttendanceRecord[],
): ChildActivityCount {
  const nameVariants = [
    child.firstName, child.lastName,
    child.firstNameKanji, child.lastNameKanji,
    `${child.lastName}${child.firstName}`.trim(),
    `${child.lastNameKanji ?? ''}${child.firstNameKanji ?? ''}`.trim(),
  ].filter((n): n is string => !!n && n.length >= 2);

  const growthByLinked = messages.filter(
    m => m.status === 'saved' && m.result?.intent === 'growth' && m.linkedChildIds?.includes(child.id),
  ).length;
  const growthByNameOnly = messages.filter(
    m =>
      m.status === 'saved' &&
      m.result?.intent === 'growth' &&
      !m.linkedChildIds?.includes(child.id) &&
      nameVariants.some(n => m.content.includes(n)),
  ).length;
  const growthCount = growthByLinked + growthByNameOnly + (child.growthEvaluations?.length ?? 0);
  const attendanceCount = attendance.filter(a => a.childId === child.id).length;

  return { growthCount, attendanceCount };
}
