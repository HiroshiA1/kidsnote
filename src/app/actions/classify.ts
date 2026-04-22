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
  /**
   * 破壊的操作のガード判定に使う原文(前置コンテキストを含まない)。
   * text にコンテキスト前置がある場合、keyword判定は rawTextForGuard に対して行う。
   * 未指定なら text をそのまま使用(従来互換)。
   */
  rawTextForGuard?: string,
): Promise<ClassifyResult> {
  // ── レート制限 ────────────────────────────────────────
  const headersList = await headers();
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  checkRateLimit(`classify:${ip}`, 20, 60_000);

  // ── 入力バリデーション ────────────────────────────────
  const validated = validateChatMessage(text);
  const validatedGuard = rawTextForGuard ? validateChatMessage(rawTextForGuard) : undefined;

  // ── 処理（匿名化＋園児特定付き） ──────────────────────
  return classifyIntent(validated, children, extraNames, validatedGuard);
}
