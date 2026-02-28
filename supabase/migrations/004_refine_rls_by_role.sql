-- ============================================================
-- RLS ポリシーのロール別細分化
-- 問題: 全ロールで全操作（CRUD）が可能
-- 解決: SELECT / INSERT+UPDATE / DELETE を操作別・ロール別に分割
-- ============================================================

-- ============================================================
-- children — 園児データ（個人情報）
-- SELECT: 全ロール / INSERT+UPDATE: teacher 以上 / DELETE: admin+manager
-- ============================================================
drop policy if exists "children_org_access" on public.children;

create policy "children_select" on public.children
  for select using (
    public.get_my_role(organization_id) is not null
  );

create policy "children_insert" on public.children
  for insert with check (
    public.get_my_role(organization_id) in ('admin', 'manager', 'teacher')
  );

create policy "children_update" on public.children
  for update using (
    public.get_my_role(organization_id) in ('admin', 'manager', 'teacher')
  );

create policy "children_delete" on public.children
  for delete using (
    public.get_my_role(organization_id) in ('admin', 'manager')
  );

-- ============================================================
-- staff — 職員データ（個人情報）
-- SELECT: 全ロール / INSERT+UPDATE: admin+manager / DELETE: admin
-- ============================================================
drop policy if exists "staff_org_access" on public.staff;

create policy "staff_select" on public.staff
  for select using (
    public.get_my_role(organization_id) is not null
  );

create policy "staff_insert" on public.staff
  for insert with check (
    public.get_my_role(organization_id) in ('admin', 'manager')
  );

create policy "staff_update" on public.staff
  for update using (
    public.get_my_role(organization_id) in ('admin', 'manager')
  );

create policy "staff_delete" on public.staff
  for delete using (
    public.get_my_role(organization_id) = 'admin'
  );

-- ============================================================
-- child_attendance — 園児出席
-- SELECT: 全ロール / INSERT+UPDATE: teacher 以上 / DELETE: admin+manager
-- ============================================================
drop policy if exists "child_attendance_org_access" on public.child_attendance;

create policy "child_attendance_select" on public.child_attendance
  for select using (
    public.get_my_role(organization_id) is not null
  );

create policy "child_attendance_insert" on public.child_attendance
  for insert with check (
    public.get_my_role(organization_id) in ('admin', 'manager', 'teacher')
  );

create policy "child_attendance_update" on public.child_attendance
  for update using (
    public.get_my_role(organization_id) in ('admin', 'manager', 'teacher')
  );

create policy "child_attendance_delete" on public.child_attendance
  for delete using (
    public.get_my_role(organization_id) in ('admin', 'manager')
  );

-- ============================================================
-- shift_assignments — シフト割当
-- SELECT: 全ロール / INSERT+UPDATE+DELETE: admin+manager
-- ============================================================
drop policy if exists "shift_assignments_org_access" on public.shift_assignments;

create policy "shift_assignments_select" on public.shift_assignments
  for select using (
    public.get_my_role(organization_id) is not null
  );

create policy "shift_assignments_insert" on public.shift_assignments
  for insert with check (
    public.get_my_role(organization_id) in ('admin', 'manager')
  );

create policy "shift_assignments_update" on public.shift_assignments
  for update using (
    public.get_my_role(organization_id) in ('admin', 'manager')
  );

create policy "shift_assignments_delete" on public.shift_assignments
  for delete using (
    public.get_my_role(organization_id) in ('admin', 'manager')
  );

-- ============================================================
-- messages — 入力メッセージ
-- SELECT: 全ロール / INSERT+UPDATE: 全ロール / DELETE: admin+manager
-- ============================================================
drop policy if exists "messages_org_access" on public.messages;

create policy "messages_select" on public.messages
  for select using (
    public.get_my_role(organization_id) is not null
  );

create policy "messages_insert" on public.messages
  for insert with check (
    public.get_my_role(organization_id) is not null
  );

create policy "messages_update" on public.messages
  for update using (
    public.get_my_role(organization_id) is not null
  );

create policy "messages_delete" on public.messages
  for delete using (
    public.get_my_role(organization_id) in ('admin', 'manager')
  );

-- ============================================================
-- staff_attendance — 職員出勤
-- SELECT: 全ロール / INSERT+UPDATE: teacher 以上 / DELETE: admin+manager
-- ============================================================
drop policy if exists "staff_attendance_org_access" on public.staff_attendance;

create policy "staff_attendance_select" on public.staff_attendance
  for select using (
    public.get_my_role(organization_id) is not null
  );

create policy "staff_attendance_insert" on public.staff_attendance
  for insert with check (
    public.get_my_role(organization_id) in ('admin', 'manager', 'teacher')
  );

create policy "staff_attendance_update" on public.staff_attendance
  for update using (
    public.get_my_role(organization_id) in ('admin', 'manager', 'teacher')
  );

create policy "staff_attendance_delete" on public.staff_attendance
  for delete using (
    public.get_my_role(organization_id) in ('admin', 'manager')
  );
