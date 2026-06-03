# 仕様書一覧

| ファイル | 内容 |
|---|---|
| [original_spec.md](./original_spec.md) | 詳細仕様書（ベース） |
| [diff_spec_gemini_mcp.md](./diff_spec_gemini_mcp.md) | 差分仕様（Gemini API・MCP 6点セット・clasp） |
| [project_evaluation.md](./project_evaluation.md) | 初期評価メモ（2026-06-04） |
| [sheet_schema.md](./sheet_schema.md) | 裏側DB正規スキーマ |
| [setup.md](./setup.md) | clasp / setupProject / Gemini 疎通 |
| [cursor-secrets.md](./cursor-secrets.md) | Cloud Agent 用シークレット登録 |

## 読み方

1. まず `original_spec.md` で全体像・フェーズ・運用方針を把握する。
2. 次に `diff_spec_gemini_mcp.md` で **上書き・追加** される方針を確認する。
3. 実装時は差分仕様を優先し、ベース仕様と矛盾する箇所は Issue または `project_evaluation.md` の「要整理」に記録する。

## 差分で優先される主な決定

- AI 自動生成: **Gemini API**（Google AI Pro は手動レビュー用）
- 開発司令塔: **Cursor Cloud**（Codex は使わない）
- GAS デプロイ: **clasp を背骨**、GAS MCP は補助
- MCP: Tips / GitHub / Context7 / Google Drive / Playwright / GAS（6点セット）
- 初期スコープ: 完全自動公開は行わず、下書き生成〜スマホ承認〜Tips 下書き作成まで
