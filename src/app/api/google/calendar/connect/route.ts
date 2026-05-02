import { NextResponse } from 'next/server';
import { resolveCallerMembership } from '@/lib/api/membership';
import { buildAuthorizationUrl, getCalendarRedirectUri } from '@/lib/googleOAuth';
import crypto from 'crypto';

/**
 * POST /api/google/calendar/connect
 *
 * 認可ユーザーの「自分自身の Google アカウント」を Calendar 連携用に OAuth 開始するための
 * 認可 URL を返す。クライアントは返された URL に画面遷移すれば Google の同意画面が開く。
 *
 * セキュリティ:
 * - state に { staffId, orgId, csrf } を base64url で詰め、CSRF トークンは httpOnly cookie に保存
 * - callback 側で cookie の csrf と state の csrf を比較する
 * - membership.staffId が無いユーザーは連携不可 (自己プロフィール未作成)
 */
export async function POST(request: Request) {
  const r = await resolveCallerMembership(request);
  if (r.error) return r.error;
  const { membership } = r;

  if (!membership.staffId) {
    return NextResponse.json(
      { error: '自分の職員プロフィールが未作成のため Google 連携できません。先にプロフィールを作成してください。' },
      { status: 400 },
    );
  }

  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'GOOGLE_OAUTH_CLIENT_ID/SECRET が未設定です (環境変数を確認)' },
      { status: 500 },
    );
  }

  const origin = new URL(request.url).origin;
  const redirectUri = getCalendarRedirectUri(origin);

  const csrf = crypto.randomBytes(24).toString('hex');
  const state = Buffer.from(
    JSON.stringify({
      staffId: membership.staffId,
      orgId: membership.organizationId,
      csrf,
    }),
  ).toString('base64url');

  const url = buildAuthorizationUrl({
    redirectUri,
    state,
    loginHint: membership.email ?? undefined,
  });

  const response = NextResponse.json({ url });
  response.cookies.set('google_oauth_csrf', csrf, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 分
    path: '/',
  });
  return response;
}
