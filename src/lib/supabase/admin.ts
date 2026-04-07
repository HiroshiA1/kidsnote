import { createClient } from '@supabase/supabase-js';

/**
 * Service Role Key を使った Supabase admin client。
 * RLS をバイパスするため、必ずサーバー側 (Route Handler / Server Action) のみで使用する。
 * クライアントコードから import してはいけない。
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY または NEXT_PUBLIC_SUPABASE_URL が未設定です');
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
