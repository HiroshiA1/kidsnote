-- ============================================================
-- KidsNote 初期スキーマ
-- 全テーブルに organization_id, RLS 有効
-- get_my_role() 関数で RLS 循環参照を回避
-- ============================================================

-- UUID 生成用
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. organizations — 園マスタ
-- ============================================================
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  settings    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.organizations enable row level security;

-- ============================================================
-- 2. memberships — ユーザー ↔ 園 ↔ ロール紐付け
-- ============================================================
create type public.app_role as enum ('admin', 'manager', 'teacher', 'part_time');

create table public.memberships (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  staff_id        uuid,  -- staff テーブルとの紐付け（後述）
  role            public.app_role not null default 'teacher',
  created_at      timestamptz not null default now(),
  unique (user_id, organization_id)
);

alter table public.memberships enable row level security;

-- RLS バイパス関数（SECURITY DEFINER でポリシー循環を回避）
create or replace function public.get_my_role(org_id uuid)
returns public.app_role
language sql
security definer
stable
as $$
  select role from public.memberships
  where user_id = auth.uid() and organization_id = org_id
  limit 1;
$$;

-- ユーザーは自分の membership のみ参照可能
create policy "memberships_select_own" on public.memberships
  for select using (auth.uid() = user_id);

-- admin/manager は同一組織の membership を管理可能（関数経由で循環回避）
create policy "memberships_manage" on public.memberships
  for all using (
    public.get_my_role(organization_id) in ('admin', 'manager')
  );

-- ============================================================
-- 3. children — 園児
-- ============================================================
create table public.children (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  first_name       text not null,
  last_name        text not null,
  first_name_kanji text,
  last_name_kanji  text,
  birth_date       date,
  class_id         text,
  class_name       text,
  grade            text,
  gender           text check (gender in ('male', 'female', 'other')),
  allergies        jsonb not null default '[]',
  characteristics  jsonb not null default '[]',
  growth_levels    jsonb not null default '[]',
  emergency_contact jsonb not null default '{}',
  guardians        jsonb not null default '[]',
  photo_url        text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.children enable row level security;

create policy "children_org_access" on public.children
  for all using (public.get_my_role(organization_id) is not null);

-- ============================================================
-- 4. staff — 職員
-- ============================================================
create table public.staff (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  first_name       text not null,
  last_name        text not null,
  role             text not null,
  class_assignment text,
  email            text,
  phone            text,
  hire_date        date,
  qualifications   jsonb not null default '[]',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.staff enable row level security;

create policy "staff_org_access" on public.staff
  for all using (public.get_my_role(organization_id) is not null);

-- memberships.staff_id FK（staff テーブル作成後に追加）
alter table public.memberships
  add constraint memberships_staff_fk
  foreign key (staff_id) references public.staff(id) on delete set null;

-- ============================================================
-- 5. rules — 園ルール
-- ============================================================
create table public.rules (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  title            text not null,
  content          text not null,
  category         text not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.rules enable row level security;

create policy "rules_org_access" on public.rules
  for all using (public.get_my_role(organization_id) is not null);

-- ============================================================
-- 6. messages — 入力メッセージ
-- ============================================================
create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  content          text not null,
  result           jsonb,
  status           text not null default 'pending' check (status in ('pending', 'processing', 'confirmed', 'saved')),
  intent           text,
  visibility       text default 'staff_only' check (visibility in ('staff_only', 'guardians_allowed')),
  is_marked_for_record boolean not null default false,
  linked_child_ids jsonb not null default '[]',
  rule_answer      jsonb,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "messages_org_access" on public.messages
  for all using (public.get_my_role(organization_id) is not null);

-- ============================================================
-- 7. child_attendance — 園児出席
-- ============================================================
create table public.child_attendance (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  child_id         uuid not null references public.children(id) on delete cascade,
  date             date not null,
  status           text not null check (status in ('present', 'absent', 'late', 'early_leave', 'absent_notified')),
  note             text,
  created_at       timestamptz not null default now(),
  unique (organization_id, child_id, date)
);

alter table public.child_attendance enable row level security;

create policy "child_attendance_org_access" on public.child_attendance
  for all using (public.get_my_role(organization_id) is not null);

-- ============================================================
-- 8. shift_patterns — シフトパターン
-- ============================================================
create table public.shift_patterns (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null,
  color            text,
  start_time       time,
  end_time         time,
  created_at       timestamptz not null default now()
);

alter table public.shift_patterns enable row level security;

create policy "shift_patterns_org_access" on public.shift_patterns
  for all using (public.get_my_role(organization_id) is not null);

-- ============================================================
-- 9. shift_assignments — シフト割当
-- ============================================================
create table public.shift_assignments (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  staff_id         uuid not null references public.staff(id) on delete cascade,
  date             date not null,
  pattern_id       uuid references public.shift_patterns(id) on delete set null,
  created_at       timestamptz not null default now(),
  unique (organization_id, staff_id, date)
);

alter table public.shift_assignments enable row level security;

create policy "shift_assignments_org_access" on public.shift_assignments
  for all using (public.get_my_role(organization_id) is not null);

-- ============================================================
-- 10. staff_attendance — 職員出勤
-- ============================================================
create table public.staff_attendance (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  staff_id         uuid not null references public.staff(id) on delete cascade,
  date             date not null,
  status           text not null check (status in ('present', 'absent', 'late', 'half_day', 'paid_leave')),
  clock_in         timestamptz,
  clock_out        timestamptz,
  note             text,
  created_at       timestamptz not null default now(),
  unique (organization_id, staff_id, date)
);

alter table public.staff_attendance enable row level security;

create policy "staff_attendance_org_access" on public.staff_attendance
  for all using (public.get_my_role(organization_id) is not null);

-- ============================================================
-- 11. audit_events — 監査ログ (INSERT ONLY)
-- ============================================================
create table public.audit_events (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  actor_user_id    uuid references auth.users(id),
  event_type       text not null,
  target_type      text not null,
  target_id        text,
  payload          jsonb not null default '{}',
  created_at       timestamptz not null default now()
);

alter table public.audit_events enable row level security;

-- admin/manager のみ監査ログを閲覧可能
create policy "audit_events_read" on public.audit_events
  for select using (
    public.get_my_role(organization_id) in ('admin', 'manager')
  );

-- 全認証ユーザーが INSERT 可能（自分の操作を記録）
create policy "audit_events_insert" on public.audit_events
  for insert with check (
    auth.uid() is not null
    and actor_user_id = auth.uid()
  );

-- DELETE / UPDATE は一切不可（ポリシーなし = 拒否）

-- ============================================================
-- 組織ポリシー: 自分が所属する組織のみ参照可能
-- ============================================================
create policy "organizations_member_access" on public.organizations
  for select using (
    public.get_my_role(id) is not null
  );

-- ============================================================
-- インデックス
-- ============================================================
create index idx_memberships_user on public.memberships(user_id);
create index idx_memberships_org on public.memberships(organization_id);
create index idx_children_org on public.children(organization_id);
create index idx_staff_org on public.staff(organization_id);
create index idx_rules_org on public.rules(organization_id);
create index idx_messages_org on public.messages(organization_id);
create index idx_messages_status on public.messages(status);
create index idx_child_attendance_org_date on public.child_attendance(organization_id, date);
create index idx_shift_assignments_org_date on public.shift_assignments(organization_id, date);
create index idx_staff_attendance_org_date on public.staff_attendance(organization_id, date);
create index idx_audit_events_org on public.audit_events(organization_id);
create index idx_audit_events_created on public.audit_events(created_at);

-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_organizations_updated before update on public.organizations
  for each row execute function public.update_updated_at();
create trigger trg_children_updated before update on public.children
  for each row execute function public.update_updated_at();
create trigger trg_staff_updated before update on public.staff
  for each row execute function public.update_updated_at();
create trigger trg_rules_updated before update on public.rules
  for each row execute function public.update_updated_at();
create trigger trg_messages_updated before update on public.messages
  for each row execute function public.update_updated_at();
