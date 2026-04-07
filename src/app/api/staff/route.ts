import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type AppRole = 'admin' | 'manager' | 'teacher' | 'part_time';

interface CreateStaffBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string; // 日本語ロール（園長/主任/担任/副担任/パート）
  classAssignment?: string;
  phone?: string;
  hireDate?: string; // ISO date
  qualifications?: string[];
}

// 日本語ロール → DB app_role マッピング
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

export async function POST(request: Request) {
  // ===== 1. 認可: ログイン中のユーザーが admin/manager か =====
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (membershipError || !membership) {
    return NextResponse.json({ error: '所属組織が見つかりません' }, { status: 403 });
  }

  if (membership.role !== 'admin' && membership.role !== 'manager') {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  // ===== 2. 入力バリデーション =====
  let body: CreateStaffBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'リクエストボディが不正です' }, { status: 400 });
  }

  const { email, password, firstName, lastName, role } = body;
  if (!email || !password || !firstName || !lastName || !role) {
    return NextResponse.json(
      { error: 'email, password, firstName, lastName, role は必須です' },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'パスワードは8文字以上必要です' }, { status: 400 });
  }

  // ===== 3. auth user 作成 → staff insert → membership insert =====
  const admin = createAdminClient();
  const orgId = membership.organization_id;
  const dbRole = mapRole(role);

  // 3-1. auth user
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

  // 3-2. staff insert
  const { data: staffRow, error: staffError } = await admin
    .from('staff')
    .insert({
      organization_id: orgId,
      first_name: firstName,
      last_name: lastName,
      role,
      class_assignment: body.classAssignment ?? null,
      email,
      phone: body.phone ?? null,
      hire_date: body.hireDate ?? null,
      qualifications: body.qualifications ?? [],
    })
    .select()
    .single();

  if (staffError || !staffRow) {
    // 補償: 作成したauth userを削除
    await admin.auth.admin.deleteUser(newUserId);
    return NextResponse.json(
      { error: `スタッフ登録に失敗しました: ${staffError?.message ?? '不明なエラー'}` },
      { status: 500 },
    );
  }

  // 3-3. membership insert
  const { error: memError } = await admin.from('memberships').insert({
    user_id: newUserId,
    organization_id: orgId,
    staff_id: staffRow.id,
    role: dbRole,
  });

  if (memError) {
    // 補償: staff削除 + auth user削除
    await admin.from('staff').delete().eq('id', staffRow.id);
    await admin.auth.admin.deleteUser(newUserId);
    return NextResponse.json(
      { error: `権限付与に失敗しました: ${memError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, staff: staffRow }, { status: 201 });
}

// ===== GET: 一覧取得（同一組織のスタッフ） =====
export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  // RLS により自組織のみ取得される
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ staff: data ?? [] });
}
