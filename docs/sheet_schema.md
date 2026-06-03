# 裏側DBシート設計（正規スキーマ）

差分仕様（`diff_spec_gemini_mcp.md` §6）を正とする。ベース仕様の `contents` / `ideas` 等は概念対応のみ参照。

## シート一覧

| シート名 | 用途 |
|---|---|
| config | システム設定・Drive/Spreadsheet ID |
| products | 商品マスタ |
| drafts | 下書き・Doc URL・承認状態 |
| reviews | AIセルフレビュー結果 |
| tips_links | Tips連携URL・状態 |
| api_usage_log | Gemini API利用ログ |
| sales_log | 販売・手数料ログ |
| error_log | エラーログ |
| operation_log | 操作ログ |
| prompt_templates | プロンプトテンプレート |

## ベース仕様との対応（参考）

| 正規（本リポジトリ） | ベース仕様 |
|---|---|
| products | contents + ideas（商品案部分） |
| drafts | contents（Doc URL・承認） |
| reviews | contents.ai_review 相当 |
| tips_links | contents.tips_* 相当 |
| config | settings |
| operation_log | operation_logs |
| error_log | error_logs |
| sales_log | sales_logs |
| prompt_templates | prompts |

## カラム定義

### config

| 列 | 説明 |
|---|---|
| key | 設定キー |
| value | 値 |
| description | 説明 |

初期キー例: `SPREADSHEET_ID`, `PROJECT_ROOT_FOLDER_ID`, `AI_PROVIDER`, `MAX_DAILY_GENERATION`, `REVIEW_EMAIL`

### products

| 列 | 説明 |
|---|---|
| product_id | 商品ID（例: PRD-20260604-001） |
| product_type | テンプレート集 / 手順書 / プロンプト集 等 |
| title | タイトル |
| target_reader | 対象読者 |
| problem | 読者の悩み |
| promise | 提供価値 |
| price_jpy | 想定価格（円） |
| risk_level | low / medium / high |
| status | 未着手 / 生成中 / レビュー待ち / 承認済み 等 |
| created_at | 作成日時 |
| updated_at | 更新日時 |

### drafts

| 列 | 説明 |
|---|---|
| draft_id | 下書きID |
| product_id | 商品ID |
| free_doc_url | 無料部分 Doc URL |
| paid_doc_url | 有料部分 Doc URL |
| full_doc_url | 統合 Doc URL |
| cta_text | CTA |
| generation_model | 使用モデル |
| generation_status | 生成ステータス |
| approved_by_user | 未確認 / 承認 / 修正 / 保留 / 停止 |
| approval_comment | 承認・修正コメント |

### reviews

| 列 | 説明 |
|---|---|
| review_id | レビューID |
| draft_id | 下書きID |
| legal_risk | 法律断定リスク |
| ad_risk | 広告表現リスク |
| fabrication_risk | 捏造リスク |
| anxiety_risk | 不安煽りリスク |
| value_score | 商品価値スコア（1-5） |
| readability_score | 可読性スコア（1-5） |
| recommendation | approve / revise / hold |
| review_summary | レビュー要約 |

### tips_links

| 列 | 説明 |
|---|---|
| tips_id | Tips側ID |
| product_id | 商品ID |
| draft_id | 下書きID |
| tips_draft_url | Tips下書きURL |
| tips_public_url | 公開URL |
| tips_status | draft / published / error |
| last_synced_at | 最終同期日時 |
| error_message | 連携エラー |

### api_usage_log

| 列 | 説明 |
|---|---|
| log_id | ログID |
| timestamp | 実行日時 |
| process_type | 処理種別 |
| model | モデル名 |
| input_chars | 入力文字数 |
| output_chars | 出力文字数 |
| estimated_tokens | 概算トークン |
| estimated_cost_jpy | 概算費用（円） |
| status | success / error |
| error_message | エラー |

### sales_log

| 列 | 説明 |
|---|---|
| sales_log_id | ログID |
| date | 日付 |
| tips_id | Tips ID |
| product_id | 商品ID |
| gross_sales_jpy | 売上（円） |
| platform_fee_jpy | 手数料（円） |
| estimated_net_jpy | 概算純利益（円） |
| views | 閲覧数 |
| sales_count | 販売数 |
| conversion_rate | CVR |
| withdrawal_status | 出金状態 |
| memo | メモ |

### error_log

| 列 | 説明 |
|---|---|
| error_id | エラーID |
| timestamp | 発生日時 |
| process_name | 処理名 |
| product_id | 対象商品ID |
| error_message | メッセージ |
| stack_trace | スタック |
| resolved | TRUE/FALSE |
| memo | メモ |

### operation_log

| 列 | 説明 |
|---|---|
| log_id | ログID |
| timestamp | 操作日時 |
| actor | user / system / ai |
| action | 操作内容 |
| product_id | 対象商品ID |
| before_status | 変更前 |
| after_status | 変更後 |
| comment | コメント |

### prompt_templates

| 列 | 説明 |
|---|---|
| prompt_id | ID |
| prompt_type | generate / review / revise / analysis |
| name | 名前 |
| template | 本文 |
| version | バージョン |
| active | TRUE/FALSE |
| memo | メモ |

## ステータス値（products.status）

`未着手` → `生成中` → `レビュー生成中` → `レビュー待ち` → `承認済み` → `Tips下書き作成中` → `Tips下書き作成済み` → `手動公開待ち` → `公開済み`

例外: `生成失敗` / `修正待ち` / `保留` / `停止` / `Tips連携エラー` / `エラー`
