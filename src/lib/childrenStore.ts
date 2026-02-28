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

// ---- 追加園児100名の生成 ----
const extraLastNames: [string, string][] = [
  ['わたなべ','渡辺'],['たかはし','高橋'],['こばやし','小林'],['よしだ','吉田'],['やまぐち','山口'],
  ['まつもと','松本'],['いのうえ','井上'],['きむら','木村'],['はやし','林'],['しみず','清水'],
  ['やまざき','山崎'],['もり','森'],['いけだ','池田'],['はしもと','橋本'],['あべ','阿部'],
  ['おがわ','小川'],['むらかみ','村上'],['いしかわ','石川'],['まえだ','前田'],['おおた','太田'],
  ['ふじた','藤田'],['おかだ','岡田'],['ごとう','後藤'],['はせがわ','長谷川'],['おかもと','岡本'],
  ['ながた','永田'],['みやざき','宮崎'],['あおき','青木'],['ふくだ','福田'],['みうら','三浦'],
  ['にしむら','西村'],['ふじい','藤井'],['かなざわ','金沢'],['おおにし','大西'],['さかもと','坂本'],
  ['なかがわ','中川'],['えんどう','遠藤'],['あらい','新井'],['すぎやま','杉山'],['うえだ','上田'],
  ['さくらい','桜井'],['ちば','千葉'],['くぼた','窪田'],['ほんだ','本田'],['すずき','鈴木'],
  ['のむら','野村'],['たけうち','竹内'],['かわむら','川村'],['うちだ','内田'],['ひらの','平野'],
];
const extraBoyNames: [string, string][] = [
  ['はると','陽翔'],['ゆうと','悠斗'],['そうた','蒼太'],['りく','陸'],['みなと','湊'],
  ['れん','蓮'],['あおい','葵'],['ひなた','陽太'],['いつき','樹'],['かいと','海斗'],
  ['ゆうま','悠真'],['こうき','光希'],['しょうま','翔真'],['たくみ','匠'],['だいき','大輝'],
  ['あさひ','朝陽'],['しゅん','駿'],['りょうた','涼太'],['えいた','瑛太'],['こうせい','晃成'],
  ['ゆうき','勇輝'],['そら','空'],['ともき','智樹'],['けいすけ','圭介'],['しんのすけ','慎之介'],
];
const extraGirlNames: [string, string][] = [
  ['ひまり','陽葵'],['めい','芽依'],['りん','凛'],['さくら','咲良'],['あかり','朱莉'],
  ['ゆな','結菜'],['みお','澪'],['ことは','琴葉'],['はな','花'],['つむぎ','紬'],
  ['えま','恵茉'],['ほのか','帆乃花'],['みさき','美咲'],['ここな','心菜'],['りこ','莉子'],
  ['あおい','葵'],['かのん','花音'],['しおり','栞'],['ゆずき','柚月'],['いろは','彩葉'],
  ['すみれ','菫'],['あいり','愛莉'],['まなか','愛花'],['ひより','日和'],['ちはる','千春'],
];

const classAssignments: { classId: string; className: string; grade: string }[] = [
  { classId: 'sakura', className: 'さくら組', grade: '年中' },
  { classId: 'himawari', className: 'ひまわり組', grade: '年中' },
  { classId: 'tulip', className: 'チューリップ組', grade: '年長' },
  { classId: 'tanpopo', className: 'たんぽぽ組', grade: '年少' },
  { classId: 'hiyoko', className: 'ひよこ組', grade: '年少' },
  { classId: 'usagi', className: 'うさぎ組', grade: '年中' },
  { classId: 'yuri', className: 'ゆり組', grade: '年長' },
];

const allergyOptions = ['卵','乳製品','小麦','ナッツ','えび','かに','そば','大豆'];
const characteristicOptions = [
  '活発','おとなしい','好奇心旺盛','甘えん坊','友達思い','リーダーシップがある',
  '慎重派','元気いっぱい','絵が得意','歌が好き','虫が好き','本が好き',
  '外遊び好き','集中力がある','マイペース','人懐っこい','恥ずかしがり屋','お手伝い好き',
];
const guardianRelationships = ['母','父','祖母','祖父'];

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

function generateExtraChildren(): ChildWithGrowth[] {
  const rand = seededRandom(42);
  const children: ChildWithGrowth[] = [];
  for (let i = 0; i < 100; i++) {
    const id = String(6 + i);
    const isFemale = i % 2 === 1;
    const lastNamePair = extraLastNames[i % extraLastNames.length];
    const firstNames = isFemale ? extraGirlNames : extraBoyNames;
    const firstNamePair = firstNames[Math.floor(i / 2) % firstNames.length];
    const cls = classAssignments[i % classAssignments.length];

    // 生年月日: 学年に合わせる
    const baseYear = cls.grade === '年長' ? 2019 : cls.grade === '年中' ? 2020 : 2021;
    const month = (Math.floor(rand() * 12)) + 1;
    const day = (Math.floor(rand() * 28)) + 1;

    const numAllergies = rand() < 0.7 ? 0 : rand() < 0.5 ? 1 : 2;
    const allergies: string[] = [];
    for (let a = 0; a < numAllergies; a++) {
      const allergy = allergyOptions[Math.floor(rand() * allergyOptions.length)];
      if (!allergies.includes(allergy)) allergies.push(allergy);
    }

    const numChars = 1 + Math.floor(rand() * 2);
    const chars: string[] = [];
    for (let c = 0; c < numChars; c++) {
      const ch = characteristicOptions[Math.floor(rand() * characteristicOptions.length)];
      if (!chars.includes(ch)) chars.push(ch);
    }

    const growthLevel = (): 1 | 2 | 3 | 4 => (Math.floor(rand() * 4) + 1) as 1 | 2 | 3 | 4;
    const rel = guardianRelationships[Math.floor(rand() * guardianRelationships.length)];

    children.push({
      id,
      firstName: firstNamePair[0],
      lastName: lastNamePair[0],
      firstNameKanji: firstNamePair[1],
      lastNameKanji: lastNamePair[1],
      birthDate: new Date(`${baseYear}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`),
      classId: cls.classId,
      className: cls.className,
      grade: cls.grade,
      gender: isFemale ? 'female' : 'male',
      allergies,
      characteristics: chars,
      emergencyContact: {
        name: `${lastNamePair[1]}${isFemale ? '太郎' : '花子'}`,
        phone: `090-${String(1000 + i).slice(-4)}-${String(5000 + i).slice(-4)}`,
        relationship: rel,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      growthLevels: [
        { domain: 'health', level: growthLevel(), lastUpdated: new Date(), linkedEpisodeIds: [] },
        { domain: 'relationships', level: growthLevel(), lastUpdated: new Date(), linkedEpisodeIds: [] },
        { domain: 'environment', level: growthLevel(), lastUpdated: new Date(), linkedEpisodeIds: [] },
        { domain: 'language', level: growthLevel(), lastUpdated: new Date(), linkedEpisodeIds: [] },
        { domain: 'expression', level: growthLevel(), lastUpdated: new Date(), linkedEpisodeIds: [] },
      ],
    });
  }
  return children;
}

// 既存5名 + 追加100名を結合
initialChildren.push(...generateExtraChildren());

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

/**
 * 園児名（文字列）から園児IDを解決する。
 * AIが返す名前（部分一致・敬称付き）にも対応。
 * 複数名前の場合はそれぞれ解決し、一致した園児IDを返す。
 */
export function resolveChildIds(names: string[], children: ChildWithGrowth[]): string[] {
  const ids: string[] = [];
  for (const rawName of names) {
    // 敬称除去
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

/**
 * 園児IDから表示名を取得
 */
export function getChildDisplayName(childId: string, children: ChildWithGrowth[]): string {
  const child = children.find(c => c.id === childId);
  if (!child) return '不明';
  return `${child.lastNameKanji || child.lastName} ${child.firstNameKanji || child.firstName}`.trim();
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
