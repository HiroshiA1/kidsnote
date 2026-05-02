import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  exchangeCodeForTokens,
  getCalendarRedirectUri,
  getGoogleUserInfo,
} from '@/lib/googleOAuth';

/**
 * GET /api/google/calendar/callback
 *
 * Google OAuth リダイレクト先。code を tokens に交換し、staff レコードに
 * google_email + google_refresh_token を保存して staff 詳細ページに戻す。
 *
 * 安全策:
 * - state cookie (httpOnly) と state パラメータの CSRF 値を厳密比較
 * - 認可ユーザー (現在の session) の membership.staff_id と state の staffId を厳密一致確認
 *   (= 他人の staff に他人が連携することを防ぐ)
 * - refresh_token が返らない (Google が再同意なしで返さない) ケースは error redirect
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  const errorRedirect = (msg: string, staffId?: string) => {
    const target = staffId ? `/staff/${staffId}` : '/staff';
    const dest = new URL(target, url.origin);
    dest.searchParams.set('google_error', msg);
    return NextResponse.redirect(dest);
  };

  if (oauthError) {
    return errorRedirect(`Google 認可がキャンセルされました (${oauthError})`);
  }
  if (!code || !stateParam) {
    return errorRedirect('OAuth レスポンスが不正です (code / state 欠落)');
  }

  // state を decode して CSRF 検証
  let parsedState: { staffId: string; orgId: string; csrf: string };
  try {
    parsedState = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf-8'));
  } catch {
    return errorRedirect('state の形式が不正です');
  }

  const csrfCookie = request.headers.get('cookie')?.match(/google_oauth_csrf=([^;]+)/)?.[1];
  if (!csrfCookie || csrfCookie !== parsedState.csrf) {
    return errorRedirect('CSRF 検証に失敗しました');
  }

  // 現在ログイン中ユーザーの membership を取得し、state.staffId と一致するか確認
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorRedirect('セッションが切れています。再ログインしてください。');

  const { data: myMembership } = await supabase
    .from('memberships')
    .select('organization_id, staff_id')
    .eq('user_id', user.id)
    .eq('organization_id', parsedState.orgId)
    .limit(1)
    .maybeSingle();

  if (!myMembership) {
    return errorRedirect('対象組織への所属が見つかりません');
  }
  if (myMembership.staff_id !== parsedState.staffId) {
    return errorRedirect('自分以外のスタッフに連携することはできません');
  }

  // code を tokens に交換
  const redirectUri = getCalendarRedirectUri(url.origin);
  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code, redirectUri);
  } catch (err) {
    return errorRedirect(err instanceof Error ? err.message : 'token exchange failed', parsedState.staffId);
  }

  // refresh_token は初回 + prompt=consent で返る。何らかの理由で返らない場合は連携失敗扱い
  if (!tokens.refresh_token) {
    return errorRedirect(
      'リフレッシュトークンが取得できませんでした。Google アカウントのアクセス権限を一度削除してから再試行してください。',
      parsedState.staffId,
    );
  }

  // userinfo でメールを取得 (UI 表示用)
  let googleEmail: string;
  try {
    const info = await getGoogleUserInfo(tokens.access_token);
    googleEmail = info.email;
  } catch (err) {
    return errorRedirect(
      `Google ユーザー情報の取得に失敗: ${err instanceof Error ? err.message : 'unknown'}`,
      parsedState.staffId,
    );
  }

  // staff に保存 (admin client = service_role で RLS バイパス)
  const admin = createAdminClient();
  const { error: updateErr } = await admin
    .from('staff')
    .update({
      google_email: googleEmail,
      google_refresh_token: tokens.refresh_token,
    })
    .eq('id', parsedState.staffId)
    .eq('organization_id', parsedState.orgId);

  if (updateErr) {
    return errorRedirect(`連携情報の保存に失敗しました: ${updateErr.message}`, parsedState.staffId);
  }

  // 成功: staff 詳細ページに戻し、CSRF cookie を削除
  const successRedirect = NextResponse.redirect(
    new URL(`/staff/${parsedState.staffId}?google_connected=1`, url.origin),
  );
  successRedirect.cookies.set('google_oauth_csrf', '', { maxAge: 0, path: '/' });
  return successRedirect;
}
