# スマホ承認型 Tips AI 自動販売システム

Tips で販売する有料コンテンツを **Gemini API** で生成し、**GAS Web アプリ** からスマホで承認する半自動販売システムです。

- 実行基盤: Google Apps Script
- データ: Google Sheets（裏側 DB）、Google Docs（下書き）
- 開発: Cursor Cloud + GitHub + clasp
- 販売先: Tips（MCP 連携は段階導入）

## ドキュメント

- [仕様書一覧](./docs/README.md)
- [詳細仕様（ベース）](./docs/original_spec.md)
- [差分仕様（Gemini / MCP）](./docs/diff_spec_gemini_mcp.md)
- [初期評価](./docs/project_evaluation.md)

## リポジトリ構成

```text
docs/          仕様書・評価メモ
gas/           Apps Script（clasp で push）
  Html/        GAS Web アプリ UI
prompts/       Gemini 用プロンプトテンプレート
samples/       シート投入用サンプル CSV 等
tests/         Playwright 等のテスト
.cursor/rules/ Cursor 向けプロジェクトルール
```

## 現在のフェーズ

**フェーズ 0〜1: 準備・基盤** — 仕様取り込み、`setupProject()`、`GeminiClient` 実装済み。[セットアップ手順](./docs/setup.md) に従い clasp push 後に GAS で実行してください。

## セキュリティ

API キーや認証情報はリポジトリに含めません。GAS の Script Properties に設定してください。
