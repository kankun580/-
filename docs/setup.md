# セットアップ（スマホ完結・PC不要）

**ローカル PC は使いません。** 詳細は [smartphone-only.md](./smartphone-only.md)。

## 自動セットアップ（推奨）

### 1. Cursor Secrets（スマホの Cursor アプリ）

[cursor-secrets.md](./cursor-secrets.md) のとおり `GEMINI_API_KEY` を登録。

### 2. Cloud Agent に依頼

「`npm run agent:bootstrap` を実行して」

初回のみ Google 認証 URL が表示されます → スマホで開き、リダイレクト URL を `CLASP_OAUTH_CALLBACK_URL` に登録 → 再実行。

### 3. 完了確認

- Gmail にセットアップ完了メール
- GAS Web アプリ URL（Agent / デプロイログに表示）をスマホで開く

## コマンド一覧

| コマンド | 内容 |
|---|---|
| `npm run agent:bootstrap` | 全自動（認証〜setupProject〜デプロイ） |
| `npm run auth:google` | Google 認証 URL 生成 or コールバック処理 |
| `npm run test:gemini` | Gemini 疎通のみ |
| `npm run setup:remote` | GAS 側セットアップのみ（認証済み前提） |

## GitHub Actions（任意）

リポジトリ Secrets に `GEMINI_API_KEY` / `CLASPRC_JSON` を登録後、`main` または `cursor/*` への push で `.github/workflows/bootstrap-gas.yml` が実行されます。

## clasp（参考・PC不要）

Cloud Agent 環境内で `npx clasp` が動きます。手元 PC に clasp を入れる必要はありません。

## 関連

- [sheet_schema.md](./sheet_schema.md)
- [mcp-weapons.md](./mcp-weapons.md)
