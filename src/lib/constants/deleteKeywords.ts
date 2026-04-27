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

/**
 * 予定削除の明示語。「中止」「取りやめ」「キャンセル」は予定の文脈で自然なため含める。
 * (delete_child では「キャンセル」を除外していたが、予定の場合「会議キャンセル」等が頻出する)
 */
export const DELETE_CALENDAR_EVENT_KEYWORDS = [
  '削除', '消して', '消す', '消去', '中止', '取りやめ', 'キャンセル', '取り消し',
] as const;

/**
 * 予定削除の文脈語(カレンダー/予定/行事 等が原文に必須)。
 * - rule_query や delete_rule の文脈語と被ると優先順位の問題が出るので、ここではカレンダー固有語のみ。
 * - ADD_CALENDAR_EVENT_KEYWORDS とほぼ同じだが、「入れて/追加して」は削除文脈にそぐわないので除く。
 */
export const CALENDAR_CONTEXT_WORDS = [
  '予定', '行事', 'イベント', '会議', '健診', '集会', '式', '打ち合わせ', 'ミーティング',
] as const;

export function hasDeleteCalendarEventSignal(text: string): boolean {
  const hasDel = DELETE_CALENDAR_EVENT_KEYWORDS.some(kw => text.includes(kw));
  const hasCtx = CALENDAR_CONTEXT_WORDS.some(kw => text.includes(kw));
  return hasDel && hasCtx;
}
