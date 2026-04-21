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

---

# UX Phase 1: iPad × 保育現場向け改善 (2026-04-21)

## 背景
幼稚園教諭がiPadで使う想定で俯瞰調査を実施。4改善範囲を先行実装:
1. `window.confirm/alert` 4箇所の統一感欠如
2. タッチターゲット44px未満
3. ヒヤリハット即時記録の導線が深い
4. エラーハンドリングが`console.error`止まり

## 最終合意 (Codex×CC discuss, 2026-04-21)

- **D1**: `useApp.openConfirm()` 統合
- **D2**: 園児削除=`openConfirm`+影響範囲表示+typed confirm(「削除」と入力)
- **D3**: ルール/予定削除=`openConfirm` シンプル確認
- **D4**: インラインバリデーション+送信disabled
- **D5**: 緊急モードはAI分類結果を保持、FloatingPopupでpre-select、確定時に intent=incident/severity=high 強制
- **D6**: Button variant `destructive`(48px)/`commit`(48px)/`secondary`(44px) で固定化

## タスク (実施順: 基盤→置換→緊急→タッチ→エラー→検証)

### Task 1: 基盤 [x]
- [x] `src/components/Button.tsx` 新規(3variant)
- [x] `src/components/ConfirmDialog.tsx` 新規(useConfirm + typed confirm + influenceScope)
- [x] `AppLayout.tsx` に `openConfirm` 統合

### Task 2: 削除UI置換 [x]
- [x] `children/page.tsx` 園児削除=影響範囲(成長記録/出欠)+typed confirm
- [x] `rules/page.tsx` ルール削除=openConfirm
- [x] `CalendarEventModal.tsx` 予定削除=openConfirm
- [x] `CalendarEventModal.tsx` タイトル必須=インラインvalidation + 送信disabled

### Task 3: タッチサイズ [x]
- [x] `children/page.tsx` 削除ボタン 24→48px (destructive)
- [x] `rules/page.tsx` 削除ボタン 20→48px
- [x] `Sidebar.tsx` 折りたたみトグル →44px (secondary)
- [x] `CalendarEventModal.tsx` ✕ボタン →44px (secondary)
- [x] `SmartInput.tsx` 添付×ボタン ホバー依存廃止+常時表示28px

### Task 4: 緊急ヒヤリハット [x]
- [x] `types/intent.ts` `InputMessage.isEmergency?: boolean`
- [x] `SmartInput.tsx` 🚨トグル+緊急モードインジケーター+送信後自動OFF
- [x] `useMessageController.ts` 緊急モード時 autoSaveスキップ、confirmMessage内でintent=incident/severity=high 強制
- [x] `FloatingPopup.tsx` 緊急バッジ+AI判定との食い違い警告+「🚨緊急登録する」ボタン

### Task 5: エラー統一 [x]
- [x] `SmartInput.tsx` `onError` コールバック追加→音声認識失敗をToast通知
- [x] `AppLayout.tsx` SmartInputに `onError={addToast error}` 配線
- [x] `activityLog.ts` ConfirmPayload に `emergency?: boolean` 追加

### Task 6: 検証 [x]
- [x] `npx tsc --noEmit` 通過
- [x] `npm run build` 成功
- [ ] dev server起動+iPadサイズ手動確認 (ユーザー側で実施)

## Phase 2 TODO (discuss合意 + Codexレビュー追記)

- 園児削除→退園/アーカイブへ再設計、物理削除は管理者限定
- 予定削除の影響範囲を実データ(参加者・通知・共有・繰り返し)で表示
- 全画面ボタンの3分類棚卸し + タッチサイズ全面適用 (Button.tsx への置換)
- ソフト削除(`deleted_at`カラム)+ 復元UI
- `InputMessage.originalResult` データモデル化(緊急モードで上書き後も元のAI分類を保持→監査・検証用途)
- ConfirmDialog の完全な focus trap、フォーカス復帰、ダイアログキュー化
- 🚨トグルを SVG アイコン化(絵文字はiPadのフォント差による視認差を回避)
- 長押し確定、ダークモード、xl/2xl レスポンシブ、Sidebar右配置、オフライン、パンくず
