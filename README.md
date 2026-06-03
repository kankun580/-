# スマホ承認型 Tips AI 自動販売システム

Tips 向け有料コンテンツを **Gemini API** で生成し、**スマホの GAS Web アプリ** だけで承認する半自動販売システムです。

**ローカル PC は不要**です。開発は Cursor Cloud Agent、運用はスマホのみを想定しています。

## ドキュメント

- [スマホ完結の考え方](./docs/smartphone-only.md)
- [Cursor Secrets（初回登録）](./docs/cursor-secrets.md)
- [セットアップ](./docs/setup.md)
- [MCP 6点セット](./docs/mcp-weapons.md)

## クイックスタート（あなたがスマホでやること）

1. Cursor Secrets に `GEMINI_API_KEY` を登録
2. Cloud Agent に「bootstrap を実行」と依頼
3. 初回だけ Google 認証 URL をスマホで開き、`CLASP_OAUTH_CALLBACK_URL` を登録して再依頼
4. 以降は Agent / GitHub Actions が自動デプロイ

```bash
# Agent が実行するコマンド
npm run agent:bootstrap
```

## 構成

```text
Cursor Cloud Agent + MCP  →  git / clasp push
GAS + Gemini API          →  生成・Sheets/Docs
GAS Web アプリ            →  スマホで承認（日常）
Tips                      →  販売（公開は人間）
```

## フェーズ

**フェーズ 0〜1** — 基盤・bootstrap 自動化済み。次は `generateDrafts` とレビュー UI。
