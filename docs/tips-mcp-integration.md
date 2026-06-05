# Tips MCP 連携ガイド（フェーズ3）

## 方針

- **許可**: Tips 下書き作成、下書き URL の取得、販売状況確認（フェーズ4）
- **禁止**: 公開、削除、価格の自動変更
- Tips MCP が使えない場合は、管理画面から **手動で Tips に貼り付け** → 下書き URL を登録

## スマホ運用（あなた）

1. レビューで **承認**
2. **Tips連携**（`?page=tips`）を開く
3. 次のいずれか:
   - Tips アプリで下書きを手動作成 → **下書き URL を登録**
   - Cursor Agent に「Tips MCP で下書き作成」と依頼 → 完了後 URL が登録される（Webhook または手動登録）

## Cursor Cloud Agent + Tips MCP

### 1. Tips MCP を有効化

[cursor.com/agents](https://cursor.com/agents) の MCP ドロップダウンで、利用中の **Tips MCP** を追加（パッケージ名は Tips 提供元のドキュメントに従う）。

### 2. 連携待ち商品の確認

管理画面 **Tips連携** 一覧、または Drive の `exports/tips_handoff_*.json` を参照。

Web 詳細画面の「連携用JSONを表示」でも同じペイロードを取得できます。

### 3. Agent への指示例

```text
Tips MCP を使って下書きのみ作成してください。公開・削除は禁止です。

1. 管理画面 Tips連携 の連携待ちから product_id を1件選ぶ
2. getTipsDraftPayloadForWeb 相当の JSON（または exports の handoff JSON）を読む
3. title / free_part / paid_part / price_jpy を Tips の下書き形式に整形して作成
4. 得られた下書き URL を Webhook で登録する（下記）
```

### 4. Webhook で URL 登録（任意）

Script Properties の `TIPS_WEBHOOK_SECRET` を使用（初回セットアップ時に自動生成）。

```bash
curl -X POST 'https://script.google.com/macros/s/YOUR_DEPLOY_ID/exec' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "record_tips_draft",
    "secret": "YOUR_TIPS_WEBHOOK_SECRET",
    "product_id": "PRD-...",
    "tips_draft_url": "https://tips.jp/...",
    "tips_id": ""
  }'
```

エラー時:

```json
{
  "action": "tips_error",
  "secret": "...",
  "product_id": "PRD-...",
  "error_message": "理由"
}
```

### 5. シークレットの確認

GAS エディタで `ensureTipsWebhookSecret()` を実行するか、Script Properties の `TIPS_WEBHOOK_SECRET` を確認。

## GAS API（google.script.run / clasp run）

| 関数 | 用途 |
|------|------|
| `getTipsPendingProducts()` | 連携待ち一覧 |
| `buildTipsDraftPayload(productId)` | MCP 用 JSON |
| `exportTipsHandoffJson(productId)` | Drive exports に保存 |
| `recordTipsDraftLink(productId, url, tipsId)` | URL 手動登録 |
| `recordTipsDraftFromWebhook(payload)` | Webhook 登録 |

## ステータス遷移

`レビュー待ち` → 承認 → `Tips下書き作成待ち` → （MCP/手動）→ `手動公開待ち` → Tips で公開 → `公開済み`（手動更新は今後拡張）

## 関連

- [mcp-setup.md](./mcp-setup.md) — Phase MCP-C
- [sheet_schema.md](./sheet_schema.md) — `tips_links` シート
