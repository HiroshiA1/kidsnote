import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface CallerMembership {
  userId: string;
  email: string | null;
  organizationId: string;
  role: string;
  staffId: string | null;
}

/**
 * 認可: ログイン中ユーザーの membership を「現在選択中の組織」基準で解決する。
 *
 * - `x-organization-id` ヘッダがあれば、その組織の membership のみ採用 (無ければ 403)。
 * - ヘッダ無しなら memberships の 1 件目を採用 (単一組織所属ユーザー向けの後方互換)。
 *
 * 全 staff 系 API がこのヘルパーで認可を共通化している。直接 supabase クライアントで
 * memberships を引かないこと (組織選択ヘッダの考慮漏れを防ぐため)。
 *
 * 戻り値:
 * - 成功: `{ membership, supabase }`
 * - 失敗: `{ error: NextResponse }`
 */
export async function resolveCallerMembership(
  request: Request,
): Promise<
  | { membership: CallerMembership; supabase: SupabaseClient; error?: never }
  | { error: NextResponse; membership?: never; supabase?: never }
> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: '認証が必要です' }, { status: 401 }) };
  }

  const orgIdHeader = request.headers.get('x-organization-id');
  let query = supabase
    .from('memberships')
    .select('organization_id, role, staff_id')
    .eq('user_id', user.id);
  if (orgIdHeader) {
    query = query.eq('organization_id', orgIdHeader);
  }
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) {
    return {
      error: NextResponse.json({ error: `所属組織の確認に失敗しました: ${error.message}` }, { status: 500 }),
    };
  }
  if (!data) {
    // ヘッダで指定された組織に所属していない → 偽装防止のため 403
    const msg = orgIdHeader ? '指定された組織に所属していません' : '所属組織が見つかりません';
    return { error: NextResponse.json({ error: msg }, { status: 403 }) };
  }

  return {
    membership: {
      userId: user.id,
      email: user.email ?? null,
      organizationId: data.organization_id,
      role: data.role,
      staffId: data.staff_id ?? null,
    },
    supabase,
  };
}
