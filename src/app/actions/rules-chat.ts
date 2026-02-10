'use server';

import { askAboutRules } from '@/lib/gemini-rules';
import { Rule } from '@/types/rule';

interface RulesContext {
  id: string;
  title: string;
  content: string;
  category: string;
}

export async function askRulesAction(question: string, rulesContext: RulesContext[]) {
  const rules: Rule[] = rulesContext.map(r => ({
    ...r,
    category: r.category as Rule['category'],
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  return askAboutRules(question, rules);
}
