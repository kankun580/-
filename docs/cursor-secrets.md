# Cursor Secrets（スマホで登録・PC不要）

Cursor アプリ（スマホ / タブレット）→ **Background Agent Secrets** に登録します。

## 必須

| 名前 | 内容 |
|---|---|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) で発行 |

## Google 認証（どちらか）

| 名前 | いつ使う |
|---|---|
| `CLASP_OAUTH_CALLBACK_URL` | **初回**。スマホブラウザで Google ログイン後、アドレスバーの `http://localhost:8888/?code=...` **全文** |
| `CLASPRC_JSON` | **2回目以降**。初回 bootstrap 成功後に Agent が案内する認証 JSON の全文 |

ローカル PC での `clasp login` は**不要**です。

## 任意

| 名前 | 内容 |
|---|---|
| `CLASP_SCRIPT_ID` | 既存 GAS プロジェクト ID |
| `CLASP_REDIRECT_PORT` | OAuth ポート（既定 `8888`） |

## 登録後のコマンド（Agent が実行）

```bash
npm run agent:bootstrap
```

内容: Google 認証 → Gemini 疎通 → `setupProject` → トリガー登録 → Web アプリデプロイ

## GitHub Actions 用（任意）

スマホ GitHub アプリ → リポジトリ Secrets に同じ `GEMINI_API_KEY` / `CLASPRC_JSON` を登録すると、`git push` で自動 bootstrap します。
