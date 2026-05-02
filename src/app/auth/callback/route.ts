import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Supabase Auth の OAuth コールバック (PKCE flow)。
 *
 * Google ログイン後、Supabase がここにユーザーをリダイレクトしてくる。
 * `code` を `exchangeCodeForSession` で session に交換し、cookie をセットしてからアプリへ戻す。
 *
 * 本ルートは Supabase Auth 標準の OAuth (=ログイン用) のみを受ける。
 * Google Calendar 連携用の独立 OAuth は `/api/google/calendar/callback` で別ハンドラ。
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
