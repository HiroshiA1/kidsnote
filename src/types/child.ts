export interface Guardian {
  name: string;
  phone: string;
  relationship: string;
  email?: string;
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
