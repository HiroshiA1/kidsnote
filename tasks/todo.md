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

---

# AIチャットからアプリ内操作 Phase 2a (2026-04-22)

## 実装済み (A1最小)
- `delete_child` (園児削除): 三層ガード(Gemini prompt + 原文キーワード再検証 + UI再検証) + admin|manager 認可 + 候補選択UI + openConfirm(typed confirm + 影響範囲)
- `add_rule` (ルール追加): AI提案を RuleModal で編集可能、保存時に addRule + confirmMessage
- Gemini prompt 拡張、preClassify 厳格化(削除語+対象語 併存)、confidence cap、catch節フォールバック修正
- InputMessage に `aiMatchedChildIds` 追加(原文由来のみ、破壊的操作用)
- IntentContentRenderer に delete_child / add_rule 描画

## Phase 2b TODO (今回のCodex指摘反映)
- AI起動削除の audit/activity 拡張: `ai_delete_child_confirmed/cancelled/blocked`, `sourceMessageId`, `matchedKeyword`, `candidateCount`, `role` を残す
- FloatingPopup から delete_child / add_rule の処理を専用hook/コンポーネントへ切り出し(責務分離)
- add_rule キャンセル時の UX 明示化(「保留」「破棄」を明示、モーダル閉じても popup が再開するため)
- `DELETE_CHILD_KEYWORDS` の「消す」を対象語との近接判定に改善(現在は「園児/名簿/退園/除籍/さん等」文脈要求で代用)

## Phase 2a 拡張候補
- [x] `delete_rule`, `update_rule` (ルール削除/編集) — Phase 2c で完了
- [x] `add_calendar_event` — Phase 2c で完了
- [ ] `delete_calendar_event` (予定削除)
- [ ] `update_child` (一般情報の更新)
- 職員CRUD
  - [x] Supabase 一元化 (`useSupabaseStaff` + `staffMapper` + AppLayout 統合)
  - [x] `POST /api/staff` 新規作成 (auth user + staff + membership 一括 + 補償)
  - [x] `GET /api/staff` 一覧 + `has_account` + `myRole`
  - [x] `PATCH /api/staff/[id]` プロフィール更新
  - [x] `POST /api/staff/[id]/account` 既存スタッフへのアカウント後付け作成 (2026-04-26)
  - [ ] スタッフ削除/無効化 API (設計議論待ち: auth user 削除 / membership 解除のみ / 退職フラグ)
  - [ ] AI 経由 `add_staff` の再有効化 (現在は info toast で停止中案内)
