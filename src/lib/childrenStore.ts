import { Child, GrowthLevel } from '@/types/child';

export type ChildWithGrowth = Child & { growthLevels: GrowthLevel[]; grade: string };

// 初期サンプルデータ
export const initialChildren: ChildWithGrowth[] = [
  {
    id: '1',
    firstName: 'たろう',
    lastName: 'やまだ',
    firstNameKanji: '太郎',
    lastNameKanji: '山田',
    birthDate: new Date('2020-04-15'),
    classId: 'sakura',
    className: 'さくら組',
    grade: '年中',
    gender: 'male',
    allergies: ['卵'],
    characteristics: ['活発', '友達思い'],
    emergencyContact: {
      name: '山田花子',
      phone: '090-1234-5678',
      relationship: '母',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    growthLevels: [
      { domain: 'health', level: 3, lastUpdated: new Date(), linkedEpisodeIds: ['1'] },
      { domain: 'relationships', level: 2, lastUpdated: new Date(), linkedEpisodeIds: [] },
      { domain: 'environment', level: 2, lastUpdated: new Date(), linkedEpisodeIds: [] },
      { domain: 'language', level: 3, lastUpdated: new Date(), linkedEpisodeIds: [] },
      { domain: 'expression', level: 2, lastUpdated: new Date(), linkedEpisodeIds: [] },
    ],
  },
  {
    id: '2',
    firstName: 'はなこ',
    lastName: 'すずき',
    firstNameKanji: '花子',
    lastNameKanji: '鈴木',
    birthDate: new Date('2020-07-22'),
    classId: 'sakura',
    className: 'さくら組',
    grade: '年中',
    gender: 'female',
    allergies: [],
    characteristics: ['絵が得意', 'おとなしい'],
    emergencyContact: {
      name: '鈴木一郎',
      phone: '090-9876-5432',
      relationship: '父',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    growthLevels: [
      { domain: 'health', level: 2, lastUpdated: new Date(), linkedEpisodeIds: [] },
      { domain: 'relationships', level: 2, lastUpdated: new Date(), linkedEpisodeIds: [] },
      { domain: 'environment', level: 3, lastUpdated: new Date(), linkedEpisodeIds: [] },
      { domain: 'language', level: 2, lastUpdated: new Date(), linkedEpisodeIds: [] },
      { domain: 'expression', level: 4, lastUpdated: new Date(), linkedEpisodeIds: ['2'] },
    ],
  },
  {
    id: '3',
    firstName: 'けんた',
    lastName: 'たなか',
    firstNameKanji: '健太',
    lastNameKanji: '田中',
    birthDate: new Date('2020-02-10'),
    classId: 'himawari',
    className: 'ひまわり組',
    grade: '年中',
    gender: 'male',
    allergies: ['乳製品', 'ナッツ'],
    characteristics: ['好奇心旺盛'],
    emergencyContact: {
      name: '田中美咲',
      phone: '090-1111-2222',
      relationship: '母',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    growthLevels: [
      { domain: 'health', level: 2, lastUpdated: new Date(), linkedEpisodeIds: [] },
      { domain: 'relationships', level: 3, lastUpdated: new Date(), linkedEpisodeIds: [] },
      { domain: 'environment', level: 4, lastUpdated: new Date(), linkedEpisodeIds: [] },
      { domain: 'language', level: 2, lastUpdated: new Date(), linkedEpisodeIds: [] },
      { domain: 'expression', level: 2, lastUpdated: new Date(), linkedEpisodeIds: [] },
    ],
  },
  {
    id: '4',
    firstName: 'ゆい',
    lastName: 'さとう',
    firstNameKanji: '結衣',
    lastNameKanji: '佐藤',
    birthDate: new Date('2019-08-03'),
    classId: 'tulip',
    className: 'チューリップ組',
    grade: '年長',
    gender: 'female',
    allergies: [],
    characteristics: ['リーダーシップがある'],
    emergencyContact: {
      name: '佐藤真由美',
      phone: '090-3333-4444',
      relationship: '母',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    growthLevels: [
      { domain: 'health', level: 4, lastUpdated: new Date(), linkedEpisodeIds: [] },
      { domain: 'relationships', level: 4, lastUpdated: new Date(), linkedEpisodeIds: [] },
      { domain: 'environment', level: 3, lastUpdated: new Date(), linkedEpisodeIds: [] },
      { domain: 'language', level: 4, lastUpdated: new Date(), linkedEpisodeIds: [] },
      { domain: 'expression', level: 3, lastUpdated: new Date(), linkedEpisodeIds: [] },
    ],
  },
  {
    id: '5',
    firstName: 'そうた',
    lastName: 'いとう',
    firstNameKanji: '颯太',
    lastNameKanji: '伊藤',
    birthDate: new Date('2021-11-20'),
    classId: 'tanpopo',
    className: 'たんぽぽ組',
    grade: '年少',
    gender: 'male',
    allergies: ['小麦'],
    characteristics: ['元気いっぱい', '甘えん坊'],
    emergencyContact: {
      name: '伊藤健一',
      phone: '090-5555-6666',
      relationship: '父',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    growthLevels: [
      { domain: 'health', level: 2, lastUpdated: new Date(), linkedEpisodeIds: [] },
      { domain: 'relationships', level: 1, lastUpdated: new Date(), linkedEpisodeIds: [] },
      { domain: 'environment', level: 2, lastUpdated: new Date(), linkedEpisodeIds: [] },
      { domain: 'language', level: 2, lastUpdated: new Date(), linkedEpisodeIds: [] },
      { domain: 'expression', level: 2, lastUpdated: new Date(), linkedEpisodeIds: [] },
    ],
  },
];

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
      lastName: '', // ひらがな不明
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

  // 単一名の場合（姓名の区別なし）
  return {
    lastName: fullName,
    firstName: '',
    lastNameKanji: fullName,
    firstNameKanji: '',
  };
}

// 生年から生年月日を作成
export function createBirthDate(birthInfo?: string): Date {
  if (!birthInfo) {
    // デフォルト：4歳程度
    const year = new Date().getFullYear() - 4;
    return new Date(`${year}-04-01`);
  }

  // "2020年"形式
  const yearMatch = birthInfo.match(/(\d{4})年/);
  if (yearMatch) {
    return new Date(`${yearMatch[1]}-04-01`);
  }

  // "2020/4/15"や"2020-04-15"形式
  const dateMatch = birthInfo.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (dateMatch) {
    return new Date(`${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`);
  }

  return new Date();
}
