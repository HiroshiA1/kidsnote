-- ============================================================
-- memberships RLS の循環参照修正
-- 問題: memberships_manage ポリシーが memberships 自身を参照し無限再帰
-- 解決: SECURITY DEFINER 関数で RLS をバイパスしてロール判定
-- ============================================================

-- 既存ポリシーを削除
drop policy if exists "memberships_select_own" on public.memberships;
drop policy if exists "memberships_manage" on public.memberships;

-- RLS バイパス関数（SECURITY DEFINER = テーブルオーナー権限で実行）
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

-- 自分の membership は参照可能
create policy "memberships_select_own" on public.memberships
  for select using (auth.uid() = user_id);

-- admin/manager は同一組織の membership を管理可能（関数経由で循環回避）
create policy "memberships_manage" on public.memberships
  for all using (
    public.get_my_role(organization_id) in ('admin', 'manager')
  );

-- 他テーブルのポリシーも同様に修正（循環の可能性がある箇所）
-- children
drop policy if exists "children_org_access" on public.children;
create policy "children_org_access" on public.children
  for all using (
    public.get_my_role(organization_id) is not null
  );

-- staff
drop policy if exists "staff_org_access" on public.staff;
create policy "staff_org_access" on public.staff
  for all using (
    public.get_my_role(organization_id) is not null
  );

-- rules
drop policy if exists "rules_org_access" on public.rules;
create policy "rules_org_access" on public.rules
  for all using (
    public.get_my_role(organization_id) is not null
  );

-- messages
drop policy if exists "messages_org_access" on public.messages;
create policy "messages_org_access" on public.messages
  for all using (
    public.get_my_role(organization_id) is not null
  );

-- child_attendance
drop policy if exists "child_attendance_org_access" on public.child_attendance;
create policy "child_attendance_org_access" on public.child_attendance
  for all using (
    public.get_my_role(organization_id) is not null
  );

-- shift_patterns
drop policy if exists "shift_patterns_org_access" on public.shift_patterns;
create policy "shift_patterns_org_access" on public.shift_patterns
  for all using (
    public.get_my_role(organization_id) is not null
  );

-- shift_assignments
drop policy if exists "shift_assignments_org_access" on public.shift_assignments;
create policy "shift_assignments_org_access" on public.shift_assignments
  for all using (
    public.get_my_role(organization_id) is not null
  );

-- staff_attendance
drop policy if exists "staff_attendance_org_access" on public.staff_attendance;
create policy "staff_attendance_org_access" on public.staff_attendance
  for all using (
    public.get_my_role(organization_id) is not null
  );

-- audit_events (read)
drop policy if exists "audit_events_read" on public.audit_events;
create policy "audit_events_read" on public.audit_events
  for select using (
    public.get_my_role(organization_id) in ('admin', 'manager')
  );

-- audit_events (insert) は変更不要（auth.uid() のみ参照で循環なし）

-- organizations
drop policy if exists "organizations_member_access" on public.organizations;
create policy "organizations_member_access" on public.organizations
  for select using (
    public.get_my_role(id) is not null
  );
