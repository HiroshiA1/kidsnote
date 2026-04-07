import { Child, GrowthLevel } from '@/types/child';
import { GrowthEvaluation, GrowthItemScore } from '@/types/growth';
import { growthCategories } from '@/lib/constants/growthCategories';

export type ChildWithGrowth = Child & { growthLevels: GrowthLevel[]; grade: string; growthEvaluations?: GrowthEvaluation[] };

// 初期サンプルデータ（5名）
const baseChildren: ChildWithGrowth[] = [
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
    interests: ['恐竜', 'サッカー', 'ブロック遊び'],
    relationships: [
      { id: 'r1-1', targetChildId: '3', type: 'close_friend', note: 'ブロック遊びでいつも一緒。互いに刺激し合っている。', updatedAt: new Date() },
      { id: 'r1-2', targetChildId: '2', type: 'play_partner', note: 'お絵描きの時間に隣同士で描くことが多い。', updatedAt: new Date() },
      { id: 'r1-3', targetChildId: '4', type: 'admires', note: '年上のゆいちゃんを見てお手伝いを真似するようになった。', updatedAt: new Date() },
    ],
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
    interests: ['お絵描き', '折り紙', 'ぬいぐるみ'],
    relationships: [
      { id: 'r2-1', targetChildId: '1', type: 'play_partner', note: 'お絵描きの時間によく一緒に遊ぶ。', updatedAt: new Date() },
      { id: 'r2-2', targetChildId: '5', type: 'caretaker', note: '年下のそうたくんの面倒をよく見ている。', updatedAt: new Date() },
    ],
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
    interests: ['虫取り', '実験', '図鑑'],
    relationships: [
      { id: 'r3-1', targetChildId: '1', type: 'close_friend', note: 'ブロック遊びの相棒。お互いに競い合う関係。', updatedAt: new Date() },
      { id: 'r3-2', targetChildId: '5', type: 'conflict', note: 'おもちゃの取り合いになることがある。見守りが必要。', updatedAt: new Date() },
    ],
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
    interests: ['ままごと', 'ダンス', '読み聞かせ'],
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
    interests: ['電車', '砂遊び'],
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

// ---- サンプル成長評価データの生成 ----
function generateSampleEvaluations(childId: string, seed: number): GrowthEvaluation[] {
  const rand = seededRandom(seed);
  const allItemIds = growthCategories.flatMap(c => c.items.map(i => i.id));
  const periods = [
    { year: 2024, semester: 1 as const, label: '2024年度 1学期' },
    { year: 2024, semester: 2 as const, label: '2024年度 2学期' },
    { year: 2024, semester: 3 as const, label: '2024年度 3学期' },
    { year: 2025, semester: 1 as const, label: '2025年度 1学期' },
  ];

  return periods.map((period, pi) => {
    const scores: GrowthItemScore[] = allItemIds.map(itemId => {
      const base = Math.floor(rand() * 3) + 1;
      const growth = Math.min(5, base + Math.floor(pi * rand() * 1.5));
      return {
        itemId,
        score: Math.max(1, Math.min(5, growth)) as 1 | 2 | 3 | 4 | 5,
        updatedAt: new Date(`${period.year}-${period.semester * 3 + 1}-15`),
      };
    });

    return {
      id: `eval-${childId}-${period.year}-${period.semester}`,
      childId,
      period,
      scores,
      createdAt: new Date(`${period.year}-${period.semester * 3 + 1}-15`),
      updatedAt: new Date(`${period.year}-${period.semester * 3 + 1}-15`),
    };
  });
}

// 最初の5名にサンプル評価データを追加
const childrenWithEvaluations = baseChildren.map((child, i) => ({
  ...child,
  growthEvaluations: generateSampleEvaluations(child.id, 100 + i * 37),
}));

// 既存5名（評価データ付き）+ 追加100名を結合
export const initialChildren: ChildWithGrowth[] = [...childrenWithEvaluations, ...generateExtraChildren()];
