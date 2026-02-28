'use server';

import { headers } from 'next/headers';
import { classifyIntent, ClassifyResult } from '@/lib/gemini';
import { validateChatMessage } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rateLimit';
import { ChildEntry } from '@/lib/anonymize';

/** AI 分類アクション（入力バリデーション＋レート制限＋匿名化＋園児紐付け） */
export async function classifyInputAction(
  text: string,
  children: ChildEntry[] = [],
  extraNames: string[] = [],
): Promise<ClassifyResult> {
  // ── レート制限 ────────────────────────────────────────
  const headersList = await headers();
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  checkRateLimit(`classify:${ip}`, 20, 60_000);

  // ── 入力バリデーション ────────────────────────────────
  const validated = validateChatMessage(text);

  // ── 処理（匿名化＋園児特定付き） ──────────────────────
  return classifyIntent(validated, children, extraNames);
}
