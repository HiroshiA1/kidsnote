/**
 * Google OAuth 2.0 + Calendar API のサーバー側ラッパ。
 *
 * 既存の `lib/googleCalendar.ts` (クライアント側 GIS、短期 access_token のみ) とは別物。
 * こちらは長期 refresh_token を取得し、staff レコードに保存することで継続的な
 * Calendar 書き込みを可能にする。
 *
 * 環境変数:
 *   - GOOGLE_OAUTH_CLIENT_ID
 *   - GOOGLE_OAUTH_CLIENT_SECRET
 *
 * Authorized redirect URIs (Google Cloud Console):
 *   - https://<your-app>/api/google/calendar/callback
 *   - http://localhost:3000/api/google/calendar/callback (dev)
 */

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
];

export function getCalendarRedirectUri(origin: string): string {
  return `${origin}/api/google/calendar/callback`;
}

function requireOAuthEnv(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET が未設定です');
  }
  return { clientId, clientSecret };
}

export function buildAuthorizationUrl(params: {
  redirectUri: string;
  state: string;
  loginHint?: string;
}): string {
  const { clientId } = requireOAuthEnv();
  const url = new URL(AUTH_URL);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', CALENDAR_SCOPES.join(' '));
  // refresh_token を確実に取得するため access_type=offline + prompt=consent。
  // prompt=consent は、既に同意済みのユーザーでも refresh_token を再発行させるための明示要求。
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('state', params.state);
  if (params.loginHint) url.searchParams.set('login_hint', params.loginHint);
  return url.toString();
}

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: 'Bearer';
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = requireOAuthEnv();
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const { clientId, clientSecret } = requireOAuthEnv();
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function getGoogleUserInfo(accessToken: string): Promise<{ email: string; name?: string }> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`userinfo failed: ${res.status}`);
  return res.json();
}

/** Google 側で token を失効。disconnect 時に refresh_token を渡して呼ぶ。失敗してもアプリ側 DB を消すのを優先 */
export async function revokeGoogleToken(token: string): Promise<void> {
  await fetch(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, { method: 'POST' }).catch(() => {});
}

// ============================================================
// Calendar API (サーバー側、access_token を引数で受ける)
// ============================================================

export interface GoogleCalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  /** allDay 用 (YYYY-MM-DD) または timed 用 (ISO 8601) */
  start: { date?: string; dateTime?: string; timeZone?: string };
  end: { date?: string; dateTime?: string; timeZone?: string };
}

export interface GoogleCalendarEvent extends GoogleCalendarEventInput {
  id: string;
  htmlLink?: string;
}

export async function insertCalendarEvent(
  accessToken: string,
  event: GoogleCalendarEventInput,
  calendarId: string = 'primary',
): Promise<GoogleCalendarEvent> {
  const res = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error(`Calendar insert failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function patchCalendarEvent(
  accessToken: string,
  eventId: string,
  patch: Partial<GoogleCalendarEventInput>,
  calendarId: string = 'primary',
): Promise<GoogleCalendarEvent> {
  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    },
  );
  if (!res.ok) throw new Error(`Calendar patch failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function deleteCalendarEventById(
  accessToken: string,
  eventId: string,
  calendarId: string = 'primary',
): Promise<void> {
  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  // 404/410 (既に削除済) は許容
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`Calendar delete failed: ${res.status} ${await res.text()}`);
  }
}
