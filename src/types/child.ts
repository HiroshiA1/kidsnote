export interface Guardian {
  name: string;
  phone: string;
  relationship: string;
  email?: string;
}

/** 園児同士の関係性タイプ */
export type PeerRelationType =
  | 'close_friend'    // 仲良し
  | 'play_partner'    // よく一緒に遊ぶ
  | 'uncomfortable'   // 苦手
  | 'conflict'        // トラブルになりやすい
  | 'admires'         // 憧れ
  | 'caretaker'       // 面倒を見ている
  | 'other';          // その他

export const peerRelationLabels: Record<PeerRelationType, string> = {
  close_friend: '仲良し',
  play_partner: 'よく一緒に遊ぶ',
  uncomfortable: '苦手',
  conflict: 'トラブルになりやすい',
  admires: '憧れ',
  caretaker: '面倒を見ている',
  other: 'その他',
};

export const peerRelationColors: Record<PeerRelationType, { bg: string; text: string; border: string }> = {
  close_friend:  { bg: 'bg-pink-50',    text: 'text-pink-600',    border: 'border-pink-200' },
  play_partner:  { bg: 'bg-sky-50',     text: 'text-sky-600',     border: 'border-sky-200' },
  uncomfortable: { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200' },
  conflict:      { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200' },
  admires:       { bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-200' },
  caretaker:     { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  other:         { bg: 'bg-gray-50',    text: 'text-gray-600',    border: 'border-gray-200' },
};

export const peerRelationIcons: Record<PeerRelationType, string> = {
  close_friend: '\u2764\uFE0F',
  play_partner: '\u{1F91D}',
  uncomfortable: '\u{1F615}',
  conflict: '\u26A1',
  admires: '\u2B50',
  caretaker: '\u{1F31F}',
  other: '\u{1F4AC}',
};

/** 園児間の関係性 */
export interface ChildRelationship {
  id: string;
  targetChildId: string;
  type: PeerRelationType;
  note?: string;
  updatedAt: Date;
}

export interface Child {
  id: string;
  firstName: string;          // 名（ひらがな）
  lastName: string;           // 姓（ひらがな）
  firstNameKanji?: string;    // 名（漢字）
  lastNameKanji?: string;     // 姓（漢字）
  birthDate: Date;
  classId: string;
  className: string;
  gender: 'male' | 'female' | 'other';
  allergies: string[];
  characteristics: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  interests?: string[];
  relationships?: ChildRelationship[];
  guardians?: Guardian[];
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GrowthLevel {
  domain: GrowthDomain;
  level: 1 | 2 | 3 | 4;
  lastUpdated: Date;
  linkedEpisodeIds: string[];
}

export type GrowthDomain =
  | 'health'           // 健康
  | 'relationships'    // 人間関係
  | 'environment'      // 環境
  | 'language'         // 言葉
  | 'expression';      // 表現

export const growthDomainLabels: Record<GrowthDomain, string> = {
  health: '健康',
  relationships: '人間関係',
  environment: '環境',
  language: '言葉',
  expression: '表現',
};

export const growthLevelLabels: Record<1 | 2 | 3 | 4, string> = {
  1: '芽生え',
  2: '伸長',
  3: '充実',
  4: '発展',
};
