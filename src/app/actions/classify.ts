'use server';

import { classifyIntent } from '@/lib/gemini';
import { IntentResult } from '@/types/intent';

export async function classifyInputAction(text: string): Promise<IntentResult> {
  if (!text.trim()) {
    throw new Error('Input text is required');
  }

  return classifyIntent(text);
}
