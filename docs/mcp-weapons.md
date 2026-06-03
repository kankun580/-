# MCP 6点セット（Cursor の武器）

スマホ運用の本体は GAS Web アプリ。開発・デプロイ・検証は Cursor Cloud Agent が MCP で拡張します。

| MCP | 用途 | 導入 |
|---|---|---|
| **Tips MCP** | 下書き作成・販売状況（公開は手動） | Cursor MCP 設定に Tips を追加 |
| **GitHub MCP** | Issue / PR / コード管理 | 組み込み or PAT |
| **Context7 MCP** | GAS・Gemini・clasp の最新仕様確認 | `npx @upstash/context7-mcp` |
| **Google Drive MCP** | 専用フォルダ内の Docs 参照 | OAuth・フォルダ限定 |
| **Playwright MCP** | スマホ幅で Web アプリ UI テスト | `npx @playwright/mcp` |
| **GAS MCP / clasp** | push / run / deploy | `clasp` + `CLASPRC_JSON` または `clasp mcp` |

## 設定手順（PC不要・Cursor 上）

1. Cursor → Settings → MCP
2. `.cursor/mcp.json.example` をコピーして `.cursor/mcp.json` を作成（リポジトリに **コミットしない** 推奨）
3. 各サーバーの OAuth / PAT を完了
4. Agent に「Context7 で GAS HtmlService を確認して実装」と指示

## clasp MCP

```bash
npx clasp start-mcp-server
```

Cursor から GAS プロジェクトを操作する補助チャネル。背骨は引き続き **git + clasp push**（`agent:bootstrap`）。

## 優先順位（詳細は [mcp-rollout.md](./mcp-rollout.md)）

1. ~~`npm run agent:bootstrap`~~ 基盤完了
2. **今**: Context7 + GitHub（Phase MCP-A）
3. **レビュー UI と同時**: Playwright（Phase MCP-B）
4. **Tips 直前**: Tips MCP（Phase MCP-C）
5. **任意**: Drive MCP / GAS MCP（Phase MCP-D）
