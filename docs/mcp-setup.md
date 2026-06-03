# MCP セットアップ手順（スマホ / Cursor のみ）

## どこで設定するか（重要）

| 画面 | MCP があるか |
|---|---|
| **cursor.com → Settings**（Privacy / Profile） | **ない** ← 今ここではない |
| **[cursor.com/agents](https://cursor.com/agents)** の **MCP ドロップダウン** | **ある**（Cloud Agent 用） |
| Cursor **デスクトップアプリ** → Settings → **Tools & MCP** | **ある**（ローカル Agent 用） |
| リポジトリの `.cursor/mcp.json` | Cloud Agent には**自動では読まれない** |

スマホのみの場合は **`cursor.com/agents` で MCP を追加**してください。

## 1. Cloud Agent で Context7（スマホ向け・推奨）

1. スマホブラウザで https://cursor.com/agents を開く
2. **MCP** のドロップダウン（または「Add MCP」）を開く
3. カスタム MCP として HTTP タイプを追加:

```json
{
  "url": "https://mcp.context7.com/mcp",
  "headers": {
    "CONTEXT7_API_KEY": "（context7.com/dashboard で取得）"
  }
}
```

4. 新しい Cloud Agent 実行時に **Context7 を ON** にする

API キーは [context7.com/dashboard](https://context7.com/dashboard) で無料取得できます。

## 2. デスクトップがある場合（任意）

```bash
cp .cursor/mcp.json.example .cursor/mcp.json
```

Cursor アプリ → **Settings → Tools & MCP** で有効化。

`.cursor/mcp.json` は **git にコミットしない**（`.gitignore` 済み）。

## 3. Phase MCP-A（デスクトップ / mcp.json 利用時）

### Context7

`.cursor/mcp.json` の `context7` はそのまま有効。Cursor を再起動。

Agent への指示例:

```text
Context7 で Google Apps Script HtmlService の仕様を確認してから実装して。
```

### GitHub

**パターン A**: Cursor 組み込み GitHub 連携が使える場合 → 追加不要。

**パターン B**: PAT を使う場合 → GitHub で fine-grained PAT を発行（リポジトリ read/write、Issues/PR）。

```json
"github": {
  "url": "https://api.githubcopilot.com/mcp/",
  "headers": {
    "Authorization": "Bearer ghp_xxxx"
  }
}
```

## 3. Phase MCP-B（レビュー UI 後）

### Playwright

`playwright` ブロックを有効化。初回は `npx playwright install` が走る場合あり（Agent 環境で実行）。

テスト用 URL（環境変数）:

```bash
export GAS_WEBAPP_URL="https://script.google.com/macros/s/AKfycbyFKB71c6aykuvWvKrpecfjppeBCds6PzPJVFBvWFVzHbCt9PuDfn-Nl6WO7l1VLUQq7w/exec"
```

## 4. Phase MCP-C（Tips 連携前）

### Tips MCP

Tips 公式または利用中の MCP サーバー名・認証方法に従い Cursor に追加。

**許可**: 下書き作成・編集・販売状況取得  
**禁止**: 公開・削除（仕様書どおり）

接続確認後、Agent に:

```text
Tips MCP でテスト用下書きを1件作成できるか確認だけして。公開はしない。
```

## 5. Phase MCP-D（任意）

### Google Drive MCP

アクセス範囲を `Tips_AI_Auto_Sales_System/` 配下に限定。

### GAS MCP

```bash
npx clasp start-mcp-server
```

clasp push / `agent:bootstrap` が動いていれば後回しで可。

## 6. 動作確認チェックリスト

| MCP | 確認方法 |
|---|---|
| Context7 | 「GAS SpreadsheetApp の getRange 仕様を Context7 で確認して」と質問 |
| GitHub | Issue 一覧取得や PR 作成を Agent に依頼 |
| Playwright | 管理画面 URL を開いてスクリーンショット取得 |
| Tips | 下書き1件作成（非公開） |

## 関連

- [mcp-rollout.md](./mcp-rollout.md) — 段階導入の考え方
- [mcp-weapons.md](./mcp-weapons.md) — 一覧
