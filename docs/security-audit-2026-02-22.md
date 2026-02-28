# セキュリティ監査結果

**実施日**: 2026-02-22  
**実施方法**: Codexとの協力による監査  
**対応日**: 2026-02-22

---

## 即座に対応すべき項目 (Codex判定)

| # | 問題 | 重要度 | 対応方針 | ステータス |
|---|------|--------|----------|-----------|
| 1 | Gemini APIキー (`.env.local` に実キー) | **CRITICAL** | 即ローテーション。`.gitignore` 除外済みだが漏洩扱いで処理 | ⚠️ **手動対応が必要** → [Google AI Studio](https://aistudio.google.com/app/apikey) でキーを無効化し再発行する |
| 2 | 認証・認可なし | **CRITICAL** | 外部公開前に最低限 Basic認証 / IP制限 | ✅ 対応済み (`src/middleware.ts` 追加。`.env.local` の `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD` を設定すると有効化) |
| 6 | `localStorage` にPII（園児名・生年月日・アレルギー・緊急連絡先） | **CRITICAL寄り** | 実データ運用ならサーバ側暗号化保存が必須 | 📋 保留（現状ローカル開発＋ダミーデータ限定。実運用前にサーバ側保存へ移行要） |
| 3 | 入力バリデーションなし | **HIGH** | 入力長制限を先行導入 | ✅ 対応済み (`src/lib/validation.ts` 追加。全 Server Actions に適用済み) |
| 5 | レート制限なし | **HIGH** | Server Actions への連打対策 | ✅ 対応済み (`src/lib/rateLimit.ts` 追加。`classify` / `rules-chat` Action に適用済み) |
| 4 | `next@16.0.8` に脆弱性16件 | **HIGH** | → 16.1.6 へアップグレード推奨 | ✅ 対応済み (`next@16.1.6` にアップグレード完了) |

---

## 中程度の問題

| # | 問題 | 備考 | ステータス |
|---|------|------|-----------|
| 7 | ファイルアップロード検証なし | 現状サーバアップロード処理が不在のため攻撃面は限定的 | 📋 保留（アップロード機能追加時に対応）|
| 8 | セキュリティヘッダー未設定 | CSP、X-Frame-Options 等 | ✅ 対応済み (`next.config.ts` に CSP / X-Frame-Options / Referrer-Policy 等を追加) |
| 9 | `console.log` による情報出力 | 重大な機微情報漏洩の根拠は現状弱い | 📋 保留（実運用前に `NODE_ENV=production` での出力確認を推奨）|
| 10 | AIモデルが preview 版 | フォールバック・タイムアウトなし | 📋 保留（GA版リリース後に `gemini-3-flash` へ移行推奨）|

---

## Codexからの重要な指摘

- **開発段階の判断が鍵**: ローカルデモ＋ダミーデータ限定なら認証は後回し可。共有環境／実データ／外部公開なら今すぐ必須
- **優先順序**: キー無効化 → アクセス遮断 → 依存関係更新 → 入力バリデーション
- **コンプライアンス**: 日本の個人情報保護法を主軸に整理し、EU居住者データがある場合のみ GDPR 追加
- **#7 ファイルアップロード**と**#9 `console.log`** は監査報告より実リスクは低い（Codex修正）

---

## 対応済み作業ログ（2026-02-22）

### ✅ Next.js アップグレード
```bash
npm install next@16.1.6 eslint-config-next@16.1.6 --save-exact
```

### ✅ 入力バリデーション
- `src/lib/validation.ts` — `validateText()` / `validateChatMessage()` / `validateRulesQuestion()` を追加
- `src/app/actions/classify.ts` — バリデーション適用
- `src/app/actions/rules-chat.ts` — バリデーション適用

### ✅ レート制限
- `src/lib/rateLimit.ts` — インメモリ方式のレート制限ユーティリティを追加
  - `/classify` アクション: 1分間に20回まで
  - `/rules-chat` アクション: 1分間に30回まで
- ※ 本番マルチインスタンス環境では Redis 等への移行を推奨

### ✅ セキュリティヘッダー
`next.config.ts` に以下を追加:
- `X-Frame-Options: SAMEORIGIN`（クリックジャッキング防止）
- `X-Content-Type-Options: nosniff`（MIME スニッフィング防止）
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`
- `Permissions-Policy`（カメラ・マイク等を無効化）
- `Content-Security-Policy`（外部接続は Gemini API / Google Fonts のみ許可）

### ✅ Basic 認証ミドルウェア
- `src/middleware.ts` — Next.js ミドルウェアで Basic 認証を実装
- `.env.local` の `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD` を設定すると有効化
- 未設定時は通過（ローカル開発の既存フローを維持）

---

## ⚠️ 残タスク（手動対応が必要なもの）

1. ~~**Gemini API キーのローテーション（最優先）**~~ → ✅ **2026-02-22 対応済み**
   - 旧キー `AIzaSyCHRz5B...` を無効化済み
   - `.env.local` を新しいキーに更新済み

2. **外部公開前に Basic 認証を有効化**
   - `.env.local` の以下のコメントを外して設定：
   ```env
   BASIC_AUTH_USER=admin
   BASIC_AUTH_PASSWORD=強固なパスワード
   ```
