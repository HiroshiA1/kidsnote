// Re-export type and data from dedicated module
export { type ChildWithGrowth, initialChildren } from '@/lib/data/initialChildren';

import type { ChildWithGrowth } from '@/lib/data/initialChildren';

// クラス名から学年を推測
export function inferGradeFromClass(className: string): string {
  const classGradeMap: Record<string, string> = {
    'たんぽぽ組': '年少',
    'ひよこ組': '年少',
    'さくら組': '年中',
    'ひまわり組': '年中',
    'うさぎ組': '年中',
    'チューリップ組': '年長',
    'ゆり組': '年長',
  };
  return classGradeMap[className] || '年中';
}

// 名前を姓と名に分割
export function splitName(fullName: string | undefined): { lastName: string; firstName: string; lastNameKanji?: string; firstNameKanji?: string } {
  if (!fullName) {
    return { lastName: '不明', firstName: '', lastNameKanji: '不明', firstNameKanji: '' };
  }

  // 漢字名の場合
  const kanjiMatch = fullName.match(/^([一-龯]+)\s*([一-龯]+)$/);
  if (kanjiMatch) {
    return {
      lastName: '',
      firstName: '',
      lastNameKanji: kanjiMatch[1],
      firstNameKanji: kanjiMatch[2],
    };
  }

  // スペースで区切られている場合
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return {
      lastName: parts[0],
      firstName: parts.slice(1).join(''),
      lastNameKanji: parts[0],
      firstNameKanji: parts.slice(1).join(''),
    };
  }

  // 単一名の場合
  return {
    lastName: fullName,
    firstName: '',
    lastNameKanji: fullName,
    firstNameKanji: '',
  };
}

/**
 * 園児名（文字列）から園児IDを解決する。
 * AIが返す名前（部分一致・敬称付き）にも対応。
 */
export function resolveChildIds(names: string[], children: ChildWithGrowth[]): string[] {
  const ids: string[] = [];
  for (const rawName of names) {
    const name = rawName.replace(/(くん|ちゃん|さん|君)$/, '').trim();
    if (!name) continue;

    const match = children.find(c => {
      const targets = [
        c.firstName, c.lastName,
        c.firstNameKanji, c.lastNameKanji,
        `${c.lastName}${c.firstName}`,
        `${c.lastNameKanji ?? ''}${c.firstNameKanji ?? ''}`,
        `${c.lastName} ${c.firstName}`,
        `${c.lastNameKanji ?? ''} ${c.firstNameKanji ?? ''}`,
      ].filter(Boolean) as string[];
      return targets.some(t => t.includes(name) || name.includes(t));
    });

    if (match && !ids.includes(match.id)) {
      ids.push(match.id);
    }
  }
  return ids;
}

/** 園児IDから表示名を取得 */
export function getChildDisplayName(childId: string, children: ChildWithGrowth[]): string {
  const child = children.find(c => c.id === childId);
  if (!child) return '不明';
  return `${child.lastNameKanji || child.lastName} ${child.firstNameKanji || child.firstName}`.trim();
}

// 生年から生年月日を作成
export function createBirthDate(birthInfo?: string): Date {
  if (!birthInfo) {
    const year = new Date().getFullYear() - 4;
    return new Date(`${year}-04-01`);
  }

  const yearMatch = birthInfo.match(/(\d{4})年/);
  if (yearMatch) {
    return new Date(`${yearMatch[1]}-04-01`);
  }

  const dateMatch = birthInfo.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (dateMatch) {
    return new Date(`${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`);
  }

  return new Date();
}
