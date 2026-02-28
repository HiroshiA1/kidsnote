'use server';

import { headers } from 'next/headers';
import { askAboutRules, ConversationMessage } from '@/lib/gemini-rules';
import { Rule } from '@/types/rule';
import { validateRulesQuestion } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rateLimit';
import { ChildEntry } from '@/lib/anonymize';

interface RulesContext {
  id: string;
  title: string;
  content: string;
  category: string;
}

/** ルール質問アクション（入力バリデーション＋レート制限付き） */
export async function askRulesAction(
  question: string,
  rulesContext: RulesContext[],
  conversationHistory?: ConversationMessage[],
  children: ChildEntry[] = [],
  extraNames: string[] = [],
) {
  // ── レート制限 ────────────────────────────────────────
  const headersList = await headers();
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  // ルール質問は少し緩めに：1 分間に 30 回
  checkRateLimit(`rules-chat:${ip}`, 30, 60_000);

  // ── 入力バリデーション ────────────────────────────────
  const validatedQuestion = validateRulesQuestion(question);

  // ── 処理 ─────────────────────────────────────────────
  const rules: Rule[] = rulesContext.map((r) => ({
    ...r,
    category: r.category as Rule['category'],
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  return askAboutRules(validatedQuestion, rules, conversationHistory, children, extraNames);
}
