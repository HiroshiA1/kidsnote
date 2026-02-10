export type RuleCategory = 'safety' | 'health' | 'parents' | 'daily_life' | 'allergy' | 'emergency' | 'other';

export interface Rule {
  id: string;
  title: string;
  content: string;
  category: RuleCategory;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  referencedRuleIds?: string[];
}

export const ruleCategoryConfig: Record<RuleCategory, { label: string; icon: string }> = {
  safety: { label: '安全管理', icon: '🛡️' },
  health: { label: '健康・衛生', icon: '🏥' },
  parents: { label: '保護者対応', icon: '👨‍👩‍👧' },
  daily_life: { label: '日常生活', icon: '🏠' },
  allergy: { label: 'アレルギー対応', icon: '⚠️' },
  emergency: { label: '緊急時対応', icon: '🚨' },
  other: { label: 'その他', icon: '📋' },
};
