/**
 * 園児削除の明示語。AI分類の二重ガードで使用する。
 * - Gemini 分類結果が delete_child でも、原文にこれらの語が含まれない場合は growth へフォールバック
 * - FloatingPopup の確定時にも再検証する(Defense in depth)
 *
 * 「取り消し」「キャンセル」はメッセージ取り消し・予定取り消し等と混ざるので含めない。
 */
export const DELETE_CHILD_KEYWORDS = ['削除', '消して', '消す', '消去', '退園', '除籍'] as const;

export function hasDeleteChildKeyword(text: string): boolean {
  return DELETE_CHILD_KEYWORDS.some(kw => text.includes(kw));
}

/** ルール削除の明示語(廃止/撤廃を含む) */
export const DELETE_RULE_KEYWORDS = ['削除', '消して', '消す', '消去', '廃止', '撤廃'] as const;
/** ルール削除の文脈語(「ルール/規則」いずれか必須) */
export const RULE_CONTEXT_WORDS = ['ルール', '規則', '決まり'] as const;

export function hasDeleteRuleSignal(text: string): boolean {
  const hasDel = DELETE_RULE_KEYWORDS.some(kw => text.includes(kw));
  const hasCtx = RULE_CONTEXT_WORDS.some(kw => text.includes(kw));
  return hasDel && hasCtx;
}
