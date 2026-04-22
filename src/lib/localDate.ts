/**
 * ローカル日付ヘルパー。
 * `toISOString()` は UTC に変換するため、JST 00:00-08:59 に「前日」になる問題がある。
 * AI プロンプトの「現在日付」や CalendarEvent の fallback 日付のような
 * 人間向けの日付表現は、JST で固定した YYYY-MM-DD を使う。
 */

/** Asia/Tokyo での YYYY-MM-DD を返す */
export function getJstDateString(date: Date = new Date()): string {
  // en-CA ロケールは ISO 風の YYYY-MM-DD を返す
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(date);
}

/** Asia/Tokyo での曜日短縮(日/月/火/水/木/金/土) */
export function getJstWeekdayJa(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', weekday: 'short' }).format(date);
}
