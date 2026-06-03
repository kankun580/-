# プロジェクトルール

## 運用前提

- **スマホ1台完結**。ローカル PC・手元での clasp・スプレッドシート直接編集は想定しない。
- セットアップは `npm run agent:bootstrap` または GitHub Actions で自動化する。
- ユーザー日常操作は **GAS Web アプリのみ**。

## 必読仕様

- `docs/original_spec.md`（ベース）
- `docs/diff_spec_gemini_mcp.md`（**優先**）
- `docs/smartphone-only.md`

## 実装原則

- フェーズに必要な実装のみ。完全自動公開は禁止。
- AI 自動実行は **Gemini API**。キーは Script Properties / Cursor Secrets。
- GAS デプロイは Cloud Agent 上の **clasp**（`CLASPRC_JSON` またはスマホ OAuth コールバック）。
- 外部 API は **Context7** または公式ドキュメント確認後に実装。

## 禁止

- API キーの GitHub コミット
- Tips 自動公開・削除
- 高リスク商品の無承認公開
- 「ローカル PC で clasp login」前提の手順を primary にしない
