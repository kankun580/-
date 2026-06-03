# セットアップ手順

## 前提

- Google アカウント
- [Node.js](https://nodejs.org/)（clasp 用）
- [Gemini API キー](https://aistudio.google.com/apikey)

## 自動セットアップ（Cloud Agent / CI 向け）

Cursor Secrets に `GEMINI_API_KEY` と `CLASPRC_JSON` を登録したうえで:

```bash
npm install
npm run setup:remote
```

詳細は [cursor-secrets.md](./cursor-secrets.md) を参照。

---

## 1. clasp のインストールとログイン

```bash
npm install -g @google/clasp
clasp login
```

## 2. GAS プロジェクトの作成と接続

### 新規作成する場合

```bash
cd /path/to/repo
clasp create --type standalone --title "Tips AI Auto Sales" --rootDir gas
```

生成された `.clasp.json` の `scriptId` を控えます。

### 既存プロジェクトに接続する場合

```bash
cp .clasp.json.example .clasp.json
# scriptId を編集
clasp clone --rootDir gas
```

## 3. コードの push

```bash
clasp push
```

## 4. Script Properties の設定

GAS エディタ → **プロジェクトの設定** → **スクリプト プロパティ**:

| キー | 値 |
|---|---|
| `GEMINI_API_KEY` | Gemini API キー |
| `GEMINI_MODEL_DEFAULT` | （任意）例: `gemini-2.0-flash` |
| `GEMINI_MODEL_REVIEW` | （任意）レビュー用モデル |

またはターミナル:

```bash
clasp open
```

## 5. setupProject() の実行

GAS エディタで `setupProject` を選択 → **実行**。

初回実行で以下が作成されます。

- Drive: `Tips_AI_Auto_Sales_System/` 配下のサブフォルダ
- 管理用スプレッドシート（全シート・ヘッダー・初期 config）
- サンプル商品1件（products）
- 完了通知メール（実行ユーザーの Gmail）

**注意:** 2回目以降は既存を再利用します。再作成は `setupProject({ force: true })`（既存データに注意）。

## 6. Gemini 疎通テスト

1. `GEMINI_API_KEY` を設定
2. `setupProject()` 完了後
3. `testGeminiConnection` を実行

成功時: ログに `Gemini API 疎通成功`、`api_usage_log` に1行追加。

## 7. config の追記設定

管理スプレッドシートの `config` シート（または GAS から `setConfigValue`）:

| key | 例 |
|---|---|
| `REVIEW_EMAIL` | 通知先メール |

## 8. Web アプリ（フェーズ2以降）

```bash
clasp deploy
```

アクセス: 自分のみ（`appsscript.json` の `webapp` 設定参照）。

## トラブルシュート

| 症状 | 対処 |
|---|---|
| `GEMINI_API_KEY が未設定` | Script Properties を確認 |
| `管理用スプレッドシートが未作成` | `setupProject()` を先に実行 |
| Gemini 404 / model not found | `GEMINI_MODEL_DEFAULT` を `gemini-2.0-flash` 等に変更 |
| clasp push 失敗 | `.clasp.json` の `rootDir` が `gas` か確認 |

## 関連ドキュメント

- [sheet_schema.md](./sheet_schema.md)
- [diff_spec_gemini_mcp.md](./diff_spec_gemini_mcp.md)
