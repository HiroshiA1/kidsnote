# P0基盤整備 + UX改善

## Step 1: Supabase初期設定
- [x] `@supabase/supabase-js` / `@supabase/ssr` インストール
- [x] `src/lib/supabase/client.ts` ブラウザクライアント
- [x] `src/lib/supabase/server.ts` サーバークライアント
- [x] `.env.local` にSupabase接続情報追加
- [x] `next.config.ts` CSPにSupabaseドメイン追加

## Step 2: DBスキーマ
- [x] `supabase/migrations/001_initial_schema.sql` 全テーブル+RLS

## Step 3: Repository層
- [x] `src/lib/repository/types.ts` interface定義
- [x] `src/lib/repository/local.ts` localStorage実装
- [x] `src/lib/repository/supabase.ts` Supabase実装
- [x] `src/lib/repository/index.ts` feature flag切替+dual-write

## Step 4: 認証
- [x] `src/lib/supabase/auth.ts` 認証ヘルパー
- [x] `src/app/login/page.tsx` ログインページ
- [x] `src/middleware.ts` Supabase Auth統合
- [x] AppLayout: currentUserRole追加、ロール推定

## Step 5: 監査ログ
- [x] `src/lib/audit.ts` audit_events INSERT関数
- [x] AppLayout CRUD操作に監査ログ追加

## Step 6: UX改善
- [x] 6a: Sidebar未実装ページに「準備中」バッジ、ロール別フィルタ
- [x] 6b: Toast通知コンポーネント、confidence活用（自動保存+取消）
- [x] 6c: 安全キーワード辞書拡充（30語以上）、安全警告UI
- [x] 6d: ウェルカムモーダル、日次ヒヤリハット確認UI

## 検証
- [x] ビルド成功確認
