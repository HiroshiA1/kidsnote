'use client';

/**
 * 認証 + 組織選択ヘッダ付きの fetch wrapper。
 *
 * 全 API 呼び出しはこの apiFetch を経由させ、現在選択中の組織を透過的に伝える。
 * AppLayout の useEffect で setApiOrgContext(currentOrganizationId) を呼ぶことで
 * 切替が反映される (module レベルの可変参照に保持しているのは、各コンポーネントが
 * 個別に Header を組み立てる責務を持たなくて済むようにするため)。
 */
let currentOrgId: string | null = null;

/** 切替時に呼ぶ。null を渡すとヘッダを付けない (= サーバ側は memberships 1 件目を採用 = 後方互換) */
export function setApiOrgContext(orgId: string | null): void {
  currentOrgId = orgId;
}

/** デバッグ/テスト用 */
export function getApiOrgContext(): string | null {
  return currentOrgId;
}

export async function apiFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (currentOrgId && !headers.has('x-organization-id')) {
    headers.set('x-organization-id', currentOrgId);
  }
  return fetch(input, { ...init, headers });
}
