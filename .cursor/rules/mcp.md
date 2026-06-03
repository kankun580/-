# MCP 利用ルール

## 段階導入

`docs/mcp-rollout.md` の Phase MCP-A → B → C の順に従う。  
6つ一括セットアップは不要。

## 実装時

- GAS / Gemini / clasp / Tips 連携を書く前に **Context7** で公式仕様を確認する。
- 推測で API 名・メソッド名を書かない。

## Tips MCP

- 下書き作成・編集・販売状況取得のみ。
- **公開・削除は Agent が実行しない。**

## Playwright

- 本番 Tips への操作テストは禁止。
- GAS Web アプリ（管理画面）のスマホ UI のみ。

## 秘密情報

- MCP 設定に API キーを直書きしない。Cursor Secrets / 環境変数を使う。
- `.cursor/mcp.json` をコミットしない。
