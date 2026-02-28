import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * 認証ミドルウェア
 *
 * 1. Supabase Auth が有効 (NEXT_PUBLIC_SUPABASE_URL が実URL) → Supabase セッション検証
 * 2. Basic Auth が設定済み → Basic 認証
 * 3. どちらも未設定 → スルー（ローカル開発）
 */

const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER ?? '';
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD ?? '';
const BASIC_AUTH_ENABLED =
  BASIC_AUTH_USER.length > 0 && BASIC_AUTH_PASSWORD.length > 0;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SUPABASE_ENABLED =
  SUPABASE_URL.length > 0 &&
  !SUPABASE_URL.includes('your-project') &&
  SUPABASE_ANON_KEY.length > 0 &&
  !SUPABASE_ANON_KEY.includes('your-anon-key');

/** 認証不要のパス */
const PUBLIC_PATHS = ['/login', '/api/auth', '/privacy'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 公開パスはスルー
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Supabase Auth モード
  if (SUPABASE_ENABLED) {
    return handleSupabaseAuth(req);
  }

  // Basic Auth モード
  if (BASIC_AUTH_ENABLED) {
    return handleBasicAuth(req);
  }

  // 認証未設定（ローカル開発）
  return NextResponse.next();
}

async function handleSupabaseAuth(req: NextRequest) {
  let response = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          req.cookies.set(name, value);
          response = NextResponse.next({
            request: { headers: req.headers },
          });
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

function handleBasicAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';

  if (!authHeader.startsWith('Basic ')) {
    return unauthorizedResponse();
  }

  let decoded: string;
  try {
    decoded = Buffer.from(authHeader.slice('Basic '.length), 'base64').toString('utf-8');
  } catch {
    return unauthorizedResponse();
  }

  const [user, ...rest] = decoded.split(':');
  const password = rest.join(':');

  if (user !== BASIC_AUTH_USER || password !== BASIC_AUTH_PASSWORD) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

function unauthorizedResponse() {
  return new NextResponse('認証が必要です。', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="KidsNote", charset="UTF-8"',
    },
  });
}

/** ミドルウェア適用パス */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
