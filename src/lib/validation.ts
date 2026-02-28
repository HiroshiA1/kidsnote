/**
 * サーバーサイド入力バリデーション
 *
 * Server Actions / API Routes から呼び出し、
 * ユーザー入力を受け付ける前に検証する。
 */

/** バリデーションエラー */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** 文字列の基本バリデーション */
export function validateText(
  value: unknown,
  fieldName: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    patternMessage?: string;
  } = {},
): string {
  const {
    required = true,
    minLength = 1,
    maxLength = 2000,
    pattern,
    patternMessage,
  } = options;

  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} は文字列である必要があります。`);
  }

  const trimmed = value.trim();

  if (required && trimmed.length === 0) {
    throw new ValidationError(`${fieldName} は必須です。`);
  }

  if (trimmed.length > 0 && trimmed.length < minLength) {
    throw new ValidationError(
      `${fieldName} は ${minLength} 文字以上で入力してください。`,
    );
  }

  if (trimmed.length > maxLength) {
    throw new ValidationError(
      `${fieldName} は ${maxLength} 文字以内で入力してください。`,
    );
  }

  if (pattern && !pattern.test(trimmed)) {
    throw new ValidationError(
      patternMessage ?? `${fieldName} の形式が正しくありません。`,
    );
  }

  return trimmed;
}

/** Gemini へ渡すメッセージ専用バリデーション */
export function validateChatMessage(text: unknown): string {
  return validateText(text, '入力テキスト', {
    required: true,
    minLength: 1,
    maxLength: 1000, // AI 入力は 1000 字以内
  });
}

/** ルール質問専用バリデーション */
export function validateRulesQuestion(question: unknown): string {
  return validateText(question, '質問', {
    required: true,
    minLength: 2,
    maxLength: 500,
  });
}
