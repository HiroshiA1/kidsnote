-- ============================================================
-- staff の退職(ソフト削除)対応
-- 設計:
--   - 物理削除はせず archived_at + archive_reason を持たせる
--   - 退職者の過去ログ・出席記録・コメントが孤児化しないように staff 行は残す
--   - ログイン不可化は memberships の削除で実施 (auth user は残置、再雇用時の再発行を妨げない)
--   - 園児側の archive 設計 (Phase 2b: children.archived_at) と思想を揃える
-- ============================================================

alter table public.staff
  add column if not exists archived_at    timestamptz,
  add column if not exists archive_reason text;

-- 退職者一覧クエリ高速化用 (archived_at is not null の絞り込みが頻出するため)
create index if not exists idx_staff_archived_at
  on public.staff(organization_id, archived_at);
