import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/organizations — ログインユーザーの所属する全組織を返す。
 *
 * memberships → organizations join。複数組織所属に対応 (組織切替 UI で利用)。
 * RLS: memberships は本人のみ select 可、organizations は同組織のみ select 可
 * (memberships は user_id = auth.uid 行を引くので問題なし)。
 */
export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  // organizations の join。Supabase の関係名は memberships.organization_id の FK 経由。
  const { data, error } = await supabase
    .from('memberships')
    .select('role, organization_id, organizations(id, name)')
    .eq('user_id', user.id)
    .order('organization_id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // organizations は単一参照だが Supabase の型は配列で来うる(リレーション仕様)。
  // 安全側で配列/単一どちらでも拾えるよう正規化する。
  type Row = {
    role: string;
    organization_id: string;
    organizations: { id: string; name: string } | { id: string; name: string }[] | null;
  };
  const orgs = ((data ?? []) as Row[])
    .map(r => {
      const org = Array.isArray(r.organizations) ? r.organizations[0] : r.organizations;
      if (!org) return null;
      return { id: org.id, name: org.name, role: r.role };
    })
    .filter((o): o is { id: string; name: string; role: string } => !!o);

  return NextResponse.json({ organizations: orgs, email: user.email ?? null });
}
