-- ============================================================
-- staff に Google Calendar 連携用フィールドを追加
-- 設計:
--   - google_email: 連携した Google アカウントのメール (UI 表示用、連携状態の判定にも使用)
--   - google_refresh_token: 長期有効。アクセストークン再発行に必須。Service Role でのみ読み書き
--   - 暗号化はせず plain text。RLS で staff_select は同組織全員が読めるが、
--     SELECT カラムを制限する RLS は本ファイルでは触らない (アプリ層で API 経由で公開する列を選別)
--   - 各スタッフが自分の primary カレンダーに予定を push する設計のため、
--     calendar_id は固定で 'primary' を使う想定 (将来必要なら staff.google_calendar_id を追加)
-- ============================================================

alter table public.staff
  add column if not exists google_email          text,
  add column if not exists google_refresh_token  text;

-- 連携済み staff の検索高速化 (refresh_token 非 null のみ対象)
create index if not exists idx_staff_google_connected
  on public.staff(organization_id)
  where google_refresh_token is not null;
