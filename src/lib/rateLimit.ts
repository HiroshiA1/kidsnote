/**
 * サーバーサイド・インメモリ レート制限
 *
 * Next.js Server Actions から呼び出すことを想定。
 * 同一 IP から短時間に大量リクエストが来た場合にエラーをスローする。
 *
 * ※ 本番環境（複数インスタンス）では Redis 等の外部ストアへの移行を推奨。
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Map はモジュール単位でシングルトン（サーバー再起動でリセット）
const store = new Map<string, RateLimitEntry>();

/**
 * レート制限チェック
 * @param key       識別子（IP アドレス等）
 * @param limit     ウィンドウ内の最大リクエスト数
 * @param windowMs  ウィンドウ幅（ミリ秒）
 * @throws 制限超過時に Error をスロー
 */
export function checkRateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000,
): void {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // 新規 or ウィンドウ切れ → カウンターをリセット
    store.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  entry.count += 1;

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    throw new Error(
      `リクエストが多すぎます。${retryAfter} 秒後に再試行してください。`,
    );
  }
}

/** 古いエントリを定期的にクリア（メモリリーク防止） */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60_000); // 5 分ごと
