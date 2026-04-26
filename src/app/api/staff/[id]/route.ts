import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

interface ArchiveStaffBody {
  reason?: string;
}

/**
 * DELETE /api/staff/[id] — スタッフの退職処理 (ソフト削除)。
 *
 * 設計:
 * - 物理削除はせず staff.archived_at + archive_reason をセット。過去の出席記録・コメント等を保持。
 * - membership は削除してログイン不可化。auth user は残す (再雇用時に再発行可能)。
 * - 認可: admin のみ (migration 004 の staff_delete に揃える、manager は不可)。
 * - 自分自身を退職にしない (誤操作防止)。
 * - 既に archived の対象には 409 を返して冪等性を破らない (二重実行で archive_reason が上書きされない)。
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: staffId } = await params;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { data: callerMembership, error: callerMemError } = await supabase
    .from('memberships')
    .select('organization_id, role, staff_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (callerMemError || !callerMembership) {
    return NextResponse.json({ error: '所属組織が見つかりません' }, { status: 403 });
  }
  if (callerMembership.role !== 'admin') {
    return NextResponse.json({ error: '退職処理は管理者のみ実行できます' }, { status: 403 });
  }
  if (callerMembership.staff_id === staffId) {
    return NextResponse.json({ error: '自分自身を退職処理することはできません' }, { status: 400 });
  }

  let body: ArchiveStaffBody = {};
  try {
    body = (await request.json()) as ArchiveStaffBody;
  } catch {
    // body 省略時は理由なしとみなす
  }

  const admin = createAdminClient();

  // 対象 staff の存在 + 同組織 + 未 archive を確認
  const { data: target, error: targetErr } = await admin
    .from('staff')
    .select('id, organization_id, archived_at')
    .eq('id', staffId)
    .single();

  if (targetErr || !target) {
    return NextResponse.json({ error: '対象スタッフが見つかりません' }, { status: 404 });
  }
  if (target.organization_id !== callerMembership.organization_id) {
    return NextResponse.json({ error: '対象スタッフが見つかりません' }, { status: 404 });
  }
  if (target.archived_at) {
    return NextResponse.json({ error: 'このスタッフは既に退職処理済みです' }, { status: 409 });
  }

  // membership 削除 (ログイン不可化) → staff archive
  // membership が無い (= まだアカウント未作成) staff の退職処理も許可するため、削除失敗は許容しない
  // が「対象が見つからない」(no-op) は成功扱いにする
  const { error: memDelErr } = await admin
    .from('memberships')
    .delete()
    .eq('staff_id', staffId);

  if (memDelErr) {
    return NextResponse.json(
      { error: `アカウント無効化に失敗しました: ${memDelErr.message}` },
      { status: 500 },
    );
  }

  const reason = body.reason?.trim();
  const { error: archiveErr } = await admin
    .from('staff')
    .update({
      archived_at: new Date().toISOString(),
      archive_reason: reason && reason.length > 0 ? reason : null,
    })
    .eq('id', staffId);

  if (archiveErr) {
    // membership は既に消した。auth user は残置でログイン不可状態なので部分成功で返す。
    // 復旧は管理者がアカウント再作成 API で対処可能。
    return NextResponse.json(
      { error: `退職処理に失敗しました: ${archiveErr.message} (アカウントは無効化済み)` },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
