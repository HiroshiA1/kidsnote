import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

interface PatchStaffBody {
  firstName?: string;
  lastName?: string;
  role?: string;
  classAssignment?: string | null;
  email?: string | null;
  phone?: string | null;
  hireDate?: string | null;
  qualifications?: string[];
}

/**
 * PATCH /api/staff/[id] — staff プロフィールの更新 (最小スコープ)
 *
 * 対象は staff テーブルの列だけ。auth user / membership の更新は本エンドポイントの
 * 責務外 (別操作として扱う)。admin / manager のみ。
 *
 * RLS ポリシー `staff_update` が同組織のみ許可するため、権限ガードは RLS に任せつつ
 * アプリ層でも admin/manager チェックを行う (UI から即時エラーメッセージを返すため)。
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (membershipError || !membership) {
    return NextResponse.json({ error: '所属組織が見つかりません' }, { status: 403 });
  }
  if (membership.role !== 'admin' && membership.role !== 'manager') {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  let body: PatchStaffBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'リクエストボディが不正です' }, { status: 400 });
  }

  // UI の camelCase → DB の snake_case へ。undefined のキーは payload から落とす
  const patch: Record<string, unknown> = {};
  if (body.firstName !== undefined) patch.first_name = body.firstName;
  if (body.lastName !== undefined) patch.last_name = body.lastName;
  if (body.role !== undefined) patch.role = body.role;
  if (body.classAssignment !== undefined) patch.class_assignment = body.classAssignment ?? null;
  if (body.email !== undefined) patch.email = body.email ?? null;
  if (body.phone !== undefined) patch.phone = body.phone ?? null;
  if (body.hireDate !== undefined) patch.hire_date = body.hireDate ?? null;
  if (body.qualifications !== undefined) patch.qualifications = body.qualifications;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: '更新対象のフィールドがありません' }, { status: 400 });
  }

  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('staff')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: `更新に失敗しました: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ staff: data });
}
