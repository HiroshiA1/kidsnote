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
