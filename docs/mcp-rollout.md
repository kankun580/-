# MCP 段階導入プラン（結論と反論）

## 結論：**賛成（ただし6つ一括ではなく段階導入）**

MCP を揃えること自体は正しい。ただし **全部を今入れる必要はない**。  
最小実用版の次は「原稿生成 + スマホ承認 UI」が主戦場で、MCP はその実装を速く・安全にするための**装備**です。

## 反論（6つ一括導入にしない理由）

| MCP | 今すぐ必須か | 理由 |
|---|---|---|
| **Context7** | **はい** | GAS / Gemini / clasp の API 誤り防止。実装前に効く |
| **GitHub** | **ほぼはい** | Cloud Agent は既に git push 可能。Issue/PR 運用を明示化 |
| **Playwright** | いいえ（少し後） | テスト対象のレビュー UI がまだない |
| **Tips MCP** | いいえ（フェーズ3直前） | 下書き工場が動くまで不要。不安定なら設計が変わる |
| **Google Drive MCP** | いいえ | GAS が Drive/Docs/Sheets を既に操作。重複しやすい |
| **GAS MCP** | いいえ | **clasp + bootstrap 済み**。補助として後からで十分 |

仕様書の「6点セット必須」は**プロジェクト全体**の話。  
**今週の実装順**としては上表の方がリスクが低い。

## 推奨ロードマップ

```text
【今すぐ】Phase MCP-A
  Context7  … 実装時の公式仕様確認
  GitHub    … PR / Issue / コード参照（PAT または Cursor 組み込み）

【レビュー UI 実装と同時】Phase MCP-B
  Playwright  … 管理画面のスマホ幅・承認ボタンの回帰テスト

【Tips 連携の直前】Phase MCP-C
  Tips MCP    … 下書き作成のみ試験。公開・削除は禁止のまま

【必要なら】Phase MCP-D
  Google Drive MCP … 専用フォルダのみ。GAS で足りなければ
  GAS MCP            … clasp で足りなければ
```

## スマホ運用との関係

- **日常運用（あなた）**: GAS Web アプリのみ。MCP は使わない。
- **開発（Cloud Agent）**: MCP で実装・検証を自動化。
- **設定作業**: Cursor アプリ（スマホ可）→ Settings → MCP。PC 不要。

## 次の実装（コード側・MCP と並行可）

1. `generateDrafts()` — Gemini で本文生成 → Google Docs 保存
2. 管理画面 — レビュー待ち一覧・詳細・承認 / 修正 / 保留 / 停止
3. Gmail レビュー通知

MCP-A（Context7）を入れた状態で 1→2 を進めるのが最も効率的。

## 設定ファイル

- テンプレート: [.cursor/mcp.json.example](../.cursor/mcp.json.example)
- 手順: [mcp-setup.md](./mcp-setup.md)
