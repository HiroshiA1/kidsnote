export type RuleCategory = string;

/**
 * RuleModal / FloatingPopup / rules/page で共通に扱う基本カテゴリ配列。
 * AI提案のカテゴリ正規化・selectbox 選択肢・フィルタ選択肢で使用し、
 * 値が分散して不整合になることを防ぐ。
 */
export const BASIC_RULE_CATEGORIES: RuleCategory[] = [
  'safety', 'health', 'parents', 'daily_life', 'allergy', 'emergency', 'other',
];

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

export interface RuleCategoryConfig {
  id: string;
  name: string;
  icon: string;
  displayOrder: number;
  isBuiltIn: boolean;
}

export const DEFAULT_RULE_CATEGORIES: RuleCategoryConfig[] = [
  { id: 'safety',               name: '安全管理',       icon: '🛡️', displayOrder: 0, isBuiltIn: true },
  { id: 'health',               name: '健康・衛生',     icon: '🏥', displayOrder: 1, isBuiltIn: true },
  { id: 'parents',              name: '保護者対応',     icon: '👨‍👩‍👧', displayOrder: 2, isBuiltIn: true },
  { id: 'daily_life',           name: '日常生活',       icon: '🏠', displayOrder: 3, isBuiltIn: true },
  { id: 'allergy',              name: 'アレルギー対応', icon: '⚠️', displayOrder: 4, isBuiltIn: true },
  { id: 'emergency',            name: '緊急時対応',     icon: '🚨', displayOrder: 5, isBuiltIn: true },
  { id: 'education_philosophy', name: '教育理念',       icon: '💡', displayOrder: 6, isBuiltIn: true },
  { id: 'education_policy',     name: '教育方針',       icon: '🧭', displayOrder: 7, isBuiltIn: true },
  { id: 'education_goals',      name: '教育目標',       icon: '🎯', displayOrder: 8, isBuiltIn: true },
  { id: 'other',                name: 'その他',         icon: '📋', displayOrder: 9, isBuiltIn: true },
];

export function getRuleCategoryConfig(
  categoryId: string,
  categories: RuleCategoryConfig[]
): { name: string; icon: string } {
  const cat = categories.find(c => c.id === categoryId);
  return cat ? { name: cat.name, icon: cat.icon } : { name: categoryId, icon: '📋' };
}

/** @deprecated Use settings.ruleCategories + getRuleCategoryConfig() instead */
export const ruleCategoryConfig: Record<string, { label: string; icon: string }> = {
  safety: { label: '安全管理', icon: '🛡️' },
  health: { label: '健康・衛生', icon: '🏥' },
  parents: { label: '保護者対応', icon: '👨‍👩‍👧' },
  daily_life: { label: '日常生活', icon: '🏠' },
  allergy: { label: 'アレルギー対応', icon: '⚠️' },
  emergency: { label: '緊急時対応', icon: '🚨' },
  education_philosophy: { label: '教育理念', icon: '💡' },
  education_policy: { label: '教育方針', icon: '🧭' },
  education_goals: { label: '教育目標', icon: '🎯' },
  other: { label: 'その他', icon: '📋' },
};
