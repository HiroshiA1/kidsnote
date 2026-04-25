# CLI 引き継ぎ用ハンドオフ (2026-04-23)

## プロジェクト概要

- **プロジェクト名**: kidsnote（幼稚園向け保育支援 Next.js アプリ）
- **ディレクトリ**: `/Users/hiroshi_aichi/Documents/05開発/kidsnote`
- **技術スタック**: Next.js (App Router) + TypeScript + Supabase
- **開発サーバー**: `npm run dev` → http://localhost:3000

---

## 現在の完了状態

### ✅ 完了済みフェーズ

| フェーズ | 内容 |
|---|---|
| P0基盤整備 | Supabase統合・DBスキーマ・Repository層・認証・監査ログ・UX改善全6ステップ |
| UX Phase 1 (2026-04-21) | iPad向け: ConfirmDialog統一・タッチサイズ48px・緊急ヒヤリハット・エラーToast統一 |
| Phase 2a (2026-04-22) | AIチャット→アプリ内操作: `delete_child` + `add_rule` + Gemini prompt強化 |

---

## 🔴 次にやること（Phase 2b）

`tasks/todo.md` L116〜127 より:

### Phase 2b: 監査ログ拡張・責務分離

1. **audit/activity ログ拡張**: `delete_child` 操作に下記フィールドを追加
   - `ai_delete_child_confirmed` / `ai_delete_child_cancelled` / `ai_delete_child_blocked`
   - `sourceMessageId`, `matchedKeyword`, `candidateCount`, `role`

2. **FloatingPopup の責務分離**:
   - `delete_child` / `add_rule` の処理を FloatingPopup から専用 hook/コンポーネントへ切り出し

3. **add_rule キャンセル UX 改善**:
   - 「保留」「破棄」を明示
   - モーダルを閉じてもポップアップが再開するフローを改善

4. **`DELETE_CHILD_KEYWORDS` の「消す」近接判定改善**:
   - 現状：「園児/名簿/退園/除籍/さん等」文脈要求で代用
   - 改善：対象語との近接判定に変更

### Phase 2a 拡張候補（優先度：中）

- `delete_rule`, `update_rule`（ルール削除/編集）
- `add_calendar_event`, `delete_calendar_event`（予定CRUD）
- `update_child`（一般情報更新）
- 職員CRUD

---

## 主要ファイル一覧

| ファイル | 役割 |
|---|---|
| `src/components/AppLayout.tsx` | 全体レイアウト・openConfirm統合・SmartInput配線 |
| `src/components/Button.tsx` | destructive/commit/secondary の3variant |
| `src/components/ConfirmDialog.tsx` | typed confirm + 影響範囲表示 |
| `src/components/FloatingPopup.tsx` | AI判定ポップアップ（delete_child/add_rule描画）|
| `src/components/SmartInput.tsx` | 音声入力・緊急モード・onError |
| `src/app/rules/page.tsx` | ルール一覧・削除UI |
| `src/app/children/page.tsx` | 園児一覧・削除（typed confirm＋影響範囲） |
| `src/hooks/useMessageController.ts` | 緊急モード・autoSave・intentハンドラ |
| `src/types/intent.ts` | InputMessage型・isEmergency・aiMatchedChildIds |
| `src/lib/audit.ts` | audit_events INSERT |
| `src/lib/activityLog.ts` | ConfirmPayload (emergency?) |
| `tasks/todo.md` | タスク管理（本ファイルの詳細版） |
| `tasks/lessons.md` | AIへの学習ルール（必ずsession開始時に読む） |
| `CLAUDE.md` | Claude Codeへの作業ルール |

---

## 新しいCLIへの引き継ぎ手順

```bash
# 1. プロジェクトに移動
cd /Users/hiroshi_aichi/Documents/05開発/kidsnote

# 2. Claude Code 起動
claude

# 3. セッション開始時に必ず読む
# → tasks/lessons.md（過去の修正・学習ルール）
# → tasks/todo.md（現在のタスク状況）

# 4. 次のタスクを指示する例
# 「tasks/handoff.md のPhase 2b を実装してください。最初に tasks/lessons.md を読んでください。」
```

---

## 注意事項

- `CLAUDE.md` のルールに従い、**必ず plan mode で開始**すること
- 実装前に `tasks/lessons.md` を確認してから着手
- 完了したタスクは `tasks/todo.md` の `[ ]` を `[x]` に更新
- ビルド確認: `npx tsc --noEmit` → `npm run build` の順
- **Parishioner_Management_App** は別プロジェクト（claude login が別途起動中）、今回は関係なし
