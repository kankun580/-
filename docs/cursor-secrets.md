# Cursor Cloud Agent 用シークレット

Cloud Agent から `npm run setup:remote` を完走させるには、Cursor の **Background Agent Secrets** に以下を登録してください。

| シークレット名 | 必須 | 内容 |
|---|---|---|
| `GEMINI_API_KEY` | はい | [Google AI Studio](https://aistudio.google.com/apikey) の API キー |
| `CLASPRC_JSON` | はい | ローカルで `clasp login` 後の `~/.clasprc.json` を**丸ごと**貼り付け |
| `CLASP_SCRIPT_ID` | いいえ | 既存 GAS プロジェクト ID（省略時は Agent が `clasp create`） |

## CLASPRC_JSON の取得手順（ローカル PC）

```bash
npm install -g @google/clasp
clasp login
cat ~/.clasprc.json   # この内容を CLASPRC_JSON に登録
```

## 登録後

Cloud Agent に「setup:remote を実行して」と依頼するか、リポジトリで:

```bash
npm run setup:remote
```

## セキュリティ

- `CLASPRC_JSON` は Google アカウントへのアクセス権を含みます。リポジトリにコミットしないでください。
- `GEMINI_API_KEY` も同様に Secrets のみで管理してください。
