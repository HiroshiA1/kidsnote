export type GrowthCategoryId = 'ten_figures' | 'daily_life' | 'non_cognitive';

export interface GrowthItemScore {
  itemId: string;
  score: 1 | 2 | 3 | 4 | 5;
  episode?: string;
  updatedAt: Date;
}

export interface GrowthPeriod {
  year: number;
  semester: 1 | 2 | 3;
  label: string;
  isGraduation?: boolean;
}

export interface GrowthEvaluation {
  id: string;
  childId: string;
  period: GrowthPeriod;
  scores: GrowthItemScore[];
  createdAt: Date;
  updatedAt: Date;
}
