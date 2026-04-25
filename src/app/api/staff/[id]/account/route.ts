import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type AppRole = 'admin' | 'manager' | 'teacher' | 'part_time';

interface CreateAccountBody {
  email: string;
  password: string;
}

// 日本語ロール → DB app_role のマッピング (POST /api/staff と同じルール)
function mapRole(jpRole: string): AppRole {
  switch (jpRole) {
    case '園長':
      return 'admin';
    case '主任':
      return 'manager';
    case '担任':
    case '副担任':
      return 'teacher';
    case 'パート':
      return 'part_time';
    default:
      return 'teacher';
  }
}

/**
 * POST /api/staff/[id]/account — 既存 staff に auth user + membership を後付けで作成する。
 *
 * 通常の新規スタッフ追加 (POST /api/staff) は staff/auth/membership を一括作成するが、
 * 既に staff 行のみが存在し、後からログイン可能化したいケース (旧データ移行・スタッフ
 * 増員時の段階的アカウント発行) を埋めるためのエンドポイント。
 *
 * 設計:
 * - 認可: 呼び出しユーザーが admin / manager。
 * - 衝突防止: 対象 staff に紐づく membership が既にあれば 409 (上書き作成しない)。
 * - 組織越境防止: 対象 staff の organization_id が呼び出しユーザーの membership と一致するか確認。
 * - 補償: auth user 作成後の membership insert が失敗したら auth user を削除して原状回復。
 * - staff.email は触らない (PATCH /api/staff/[id] の責務)。ここは「ログイン手段の付与」のみ。
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: staffId } = await params;

  // ===== 1. 認可 =====
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { data: callerMembership, error: callerMemError } = await supabase
    .from('memberships')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (callerMemError || !callerMembership) {
    return NextResponse.json({ error: '所属組織が見つかりません' }, { status: 403 });
  }
  if (callerMembership.role !== 'admin' && callerMembership.role !== 'manager') {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  // ===== 2. 入力バリデーション =====
  let body: CreateAccountBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'リクエストボディが不正です' }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: 'email と password は必須です' }, { status: 400 });
  }
  if (!email.includes('@')) {
    return NextResponse.json({ error: 'メールアドレスの形式が正しくありません' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'パスワードは8文字以上必要です' }, { status: 400 });
  }

  const admin = createAdminClient();

  // ===== 3. 対象 staff の存在 + 同組織チェック =====
  const { data: staffRow, error: staffErr } = await admin
    .from('staff')
    .select('id, organization_id, role')
    .eq('id', staffId)
    .single();

  if (staffErr || !staffRow) {
    return NextResponse.json({ error: '対象スタッフが見つかりません' }, { status: 404 });
  }
  if (staffRow.organization_id !== callerMembership.organization_id) {
    // 別組織に向けて作成しようとしている。404 と等価扱い (情報露出を抑える)。
    return NextResponse.json({ error: '対象スタッフが見つかりません' }, { status: 404 });
  }

  // ===== 4. 既存 membership がないことを確認 (重複作成禁止) =====
  const { data: existingMem, error: existingMemErr } = await admin
    .from('memberships')
    .select('id')
    .eq('staff_id', staffId)
    .limit(1)
    .maybeSingle();

  if (existingMemErr) {
    return NextResponse.json(
      { error: `既存アカウントの確認に失敗しました: ${existingMemErr.message}` },
      { status: 500 },
    );
  }
  if (existingMem) {
    return NextResponse.json(
      { error: 'このスタッフには既にアカウントが存在します' },
      { status: 409 },
    );
  }

  // ===== 5. auth user 作成 → membership 作成 (失敗時は補償) =====
  const dbRole = mapRole(staffRow.role);

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: `ユーザー作成に失敗しました: ${authError?.message ?? '不明なエラー'}` },
      { status: 500 },
    );
  }

  const newUserId = authData.user.id;

  const { error: memError } = await admin.from('memberships').insert({
    user_id: newUserId,
    organization_id: staffRow.organization_id,
    staff_id: staffId,
    role: dbRole,
  });

  if (memError) {
    await admin.auth.admin.deleteUser(newUserId);
    return NextResponse.json(
      { error: `権限付与に失敗しました: ${memError.message}` },
      { status: 500 },
    );
  }

  // staff.email を空のままにしないため、未設定なら同期しておく (UI で「ログインメール」として表示するため)。
  // 既に staff.email が入っている場合は上書きしない (PATCH 側の意図を尊重)。
  await admin
    .from('staff')
    .update({ email })
    .eq('id', staffId)
    .is('email', null);

  return NextResponse.json({ success: true }, { status: 201 });
}
