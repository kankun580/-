# スマホ1台完結・ローカルPC不要

## 方針

| やること | どこで |
|---|---|
| 開発・デプロイ | **Cursor Cloud Agent**（本リポジトリ） |
| 初回 Google 認証 | **スマホブラウザ** → Cursor Secrets に1回保存 |
| Gemini API キー | **スマホ**で AI Studio 取得 → Cursor Secrets |
| 日常の承認・確認 | **GAS Web アプリ**（スマホ） |
| データ | Google Sheets（裏側・直接触らない） |

**ローカルPC・clasp login on PC・スプレッドシート手編集は不要**です。

## 自動化の3層

```text
[1] Cursor Secrets + npm run agent:bootstrap
      → clasp push / setupProject / Gemini 疎通 / Webアプリデプロイ

[2] GitHub Actions（push 時）
      → 同じ bootstrap（Secrets: GEMINI_API_KEY, CLASPRC_JSON）

[3] GAS 内トリガー ensureProjectSetup
      → 未セットアップ時に自動で setupProject（キー設定後）
```

## 初回だけ（スマホで）

### A. Gemini API キー

1. スマホで https://aistudio.google.com/apikey を開く
2. API キーを作成
3. Cursor アプリ → **Background Agent Secrets** → `GEMINI_API_KEY` に貼り付け

### B. Google（GAS）認証 — 2通り

**B-1 おすすめ（1回だけ URL をコピー）**

1. Agent に「bootstrap を実行」と依頼
2. チャットに表示される Google 認証 URL をスマホで開く
3. ログイン後、ブラウザのアドレスバーに `http://localhost:8888/?code=...` と表示（接続エラー画面でOK）
4. **アドレスバー全文**をコピー
5. Cursor Secrets → `CLASP_OAUTH_CALLBACK_URL` に貼り付け
6. 再度 Agent に bootstrap 依頼 → 以降は完全自動

**B-2 再ログイン不要にしたい場合**

- 2回目以降は Agent が生成した `CLASPRC_JSON` 相当を `CLASPRC_JSON` シークレットに保存（Agent が案内）

### C. GitHub Actions も使う場合（任意）

スマホの GitHub アプリ → リポジトリ → Settings → Secrets:

- `GEMINI_API_KEY`
- `CLASPRC_JSON`（bootstrap 成功後に Agent が出力する内容を保存）

以降 `git push` だけでデプロイ・セットアップが走ります。

## 日常運用（スマホのみ）

1. Gmail 通知 or ブックマークした **GAS Web アプリ URL** を開く
2. レビュー待ちを確認 → 承認 / 修正 / 保留 / 停止
3. スプレッドシートは開かない

## MCP（Cursor の武器）

差分仕様の MCP 6 点セットは `.cursor/mcp.json.example` を参照し、Cursor に接続すると Agent が Tips / Drive / GAS / Playwright 等を直接操作できます。未接続でも bootstrap までは npm スクリプトで完結します。

詳細: [mcp-weapons.md](./mcp-weapons.md)
