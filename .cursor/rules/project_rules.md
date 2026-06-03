# プロジェクトルール

## 必読

- `docs/original_spec.md`（ベース）
- `docs/diff_spec_gemini_mcp.md`（**優先**）

## 実装原則

- 現在フェーズに必要な実装のみ行う。完全自動公開は実装しない。
- AI 自動実行は **Gemini API**。API キーは Script Properties のみ。
- Google Sheets はユーザーが直接触らない設計。操作は GAS Web アプリ経由。
- 外部 API・GAS・clasp・Tips 連携は **Context7 または公式ドキュメント** を確認してから実装する。
- GAS は **clasp** でデプロイする。

## 禁止

- API キーのコード直書き・GitHub コミット
- Tips の自動公開・自動削除
- 高リスク商品の無承認公開
