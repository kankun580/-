# Tips向けAI自動販売システム 差分仕様書  
## Gemini API採用・MCP 6点セット・GAS自動構築対応版

作成日：2026-06-04  
対象元仕様書：`tips_ai_auto_sales_system_spec.md`  
本文書の位置づけ：既存仕様書に対する追加・変更・補強仕様  
対象プロジェクト：Tips販売用AI半自動生成・承認・投稿支援システム

---

## 1. 本差分仕様書の目的

本書は、既存の「Tips向けAI自動販売システム」仕様に対して、以下の方針変更・追加決定を反映するための差分仕様書である。

### 1.1 追加・変更された主要方針

1. **販売先はTipsを主軸とする**
   - noteではなく、Tips販売を主たる収益化先とする。
   - WordPressは当面必須ではなく、将来の集客用入口として後回しにする。
   - Tips MCPを前提に、記事作成・下書き作成・販売分析を自動化対象とする。

2. **AI生成エンジンにはGemini APIを採用する**
   - Google AI Proは手動レビュー・壁打ち・構成検討に活用する。
   - GAS等のプログラム自動実行ではGemini APIを使う。
   - 初期はGemini 2.5 Flash / Flash-Lite系を中心に使い、コストを抑える。
   - 重要商品や高リスク記事のみ、上位モデルまたは手動レビューを併用する。

3. **Cursor Cloudを司令塔とする**
   - Codexは使わない。
   - Cursor Cloudに実装・修正・レビュー補助・運用改善を担当させる。
   - Cursor CloudからMCPを利用して、GitHub、Tips、Google Drive、GAS、Web UIテストを操作できる構成を目指す。

4. **MCPは6点セットを導入候補とする**
   - Tips MCP
   - GitHub MCP
   - Context7 MCP
   - Google Drive MCP
   - Playwright MCP
   - Google Apps Script MCP または claspベースのGAS操作

5. **スプレッドシートは直接操作しない**
   - Google Sheetsは裏側のデータベースとして利用する。
   - スマホ操作はGAS Webアプリの専用管理画面で行う。
   - 初期はGmail通知＋Googleフォーム承認でもよいが、最終的にはGAS Webアプリに統合する。

6. **完全自動公開は初期対象外**
   - 初期は「AI生成 → 下書き → スマホ承認 → Tips下書き作成」まで。
   - 安定性確認後に、低リスク商品だけ自動化範囲を広げる。
   - Tipsでの公開操作は当面、人間承認必須とする。

---

## 2. 更新後の全体アーキテクチャ

### 2.1 旧構成からの変更点

旧構成では、WordPressやnoteも投稿・販売先として検討対象に含めていた。  
本差分では、初期の実装対象を **Tips販売に集中** させる。

### 2.2 新しい推奨構成

```text
スマホ
  ↓
GAS Webアプリ
  ↓
Google Apps Script
  ↓
Google Sheets（裏側DB）
  ↓
Google Docs / Drive（下書き・素材保管）
  ↓
Gemini API（本文生成・レビュー・改善）
  ↓
Tips MCP（Tips下書き作成・販売分析）
  ↓
Tips販売ページ
```

開発・運用補助側：

```text
スマホ
  ↓
Cursor Cloud
  ↓
MCP 6点セット
  ├─ Tips MCP
  ├─ GitHub MCP
  ├─ Context7 MCP
  ├─ Google Drive MCP
  ├─ Playwright MCP
  └─ GAS MCP / clasp
  ↓
GitHub Repository
  ↓
GAS Project / Google Workspace / Tips
```

### 2.3 役割分担

| 要素 | 役割 |
|---|---|
| Cursor Cloud | 司令塔。設計、実装、修正、MCP操作、運用改善 |
| GitHub | ソースコード、仕様書、Issue、変更履歴の管理 |
| GAS | 定期実行、Webアプリ、承認処理、Sheets/Docs/Gmail操作 |
| Google Sheets | 裏側DB。商品案、ステータス、ログ、販売情報を保持 |
| GAS Webアプリ | スマホ用管理画面。承認、修正依頼、保留、下書き確認 |
| Google Docs | AI生成された無料部分・有料部分・レビュー結果の保存 |
| Google Drive | 専用フォルダで素材、下書き、レポートを管理 |
| Gemini API | 自動生成、自動レビュー、修正案生成、販売分析コメント生成 |
| Google AI Pro | 手動レビュー、壁打ち、重要商品の磨き込み |
| Tips MCP | Tips記事の作成・編集・販売状況確認 |
| Playwright MCP | GAS WebアプリのUI・承認導線テスト |
| Context7 MCP | 最新API、GAS、clasp、MCP仕様確認 |
| GAS MCP / clasp | GASプロジェクト作成、編集、デプロイ、実行補助 |

---

## 3. Gemini API採用仕様

### 3.1 Gemini APIの位置づけ

Gemini APIは、本システムにおける自動生成エンジンである。

Google AI Proに加入済みであっても、GASからの自動呼び出しにはGemini APIキーを用いる。  
Google AI Proは、あくまで人間がGeminiアプリ等で使う補助環境として扱う。

### 3.2 Google AI Proとの役割分担

| 用途 | 使用するもの |
|---|---|
| GASからの自動本文生成 | Gemini API |
| GASからのセルフレビュー | Gemini API |
| GASからの修正案生成 | Gemini API |
| 重要商品の人間レビュー | Google AI Pro / Geminiアプリ |
| 仕様検討・壁打ち | Google AI Pro / ChatGPT |
| 実装作業 | Cursor Cloud |
| 実装時の公式仕様確認 | Context7 MCP |

### 3.3 推奨モデル構成

| 処理 | 推奨モデル | 備考 |
|---|---|---|
| 商品テーマ案生成 | Gemini Flash-Lite系 | 低コスト優先 |
| Tips無料部分生成 | Gemini Flash系 | 品質と速度のバランス |
| Tips有料部分生成 | Gemini Flash系 | 文字量が増えるためコスト監視 |
| CTA生成 | Gemini Flash-Lite / Flash | 短文生成 |
| セルフレビュー | Gemini Flash系 | リスクチェックに使用 |
| 修正版生成 | Gemini Flash系 | 初期は人間確認必須 |
| 高リスク記事の再レビュー | 上位モデルまたは手動 | 法律・労務・医療・金融に近い場合 |
| 週次分析コメント | Gemini Flash-Lite / Flash | Sheetsログの要約 |

### 3.4 Gemini API呼び出し方針

GASからGemini APIを呼び出す処理は、以下のようにモジュール化する。

```text
geminiClient.gs
  - callGemini(prompt, options)
  - generateTipsDraft(input)
  - reviewTipsDraft(draft)
  - reviseTipsDraft(draft, review, instruction)
  - analyzeSalesLog(logData)
```

### 3.5 プロンプト設計方針

Gemini APIへ渡すプロンプトは、用途別にテンプレート化する。

```text
prompts/
  - product_idea_prompt.md
  - tips_free_part_prompt.md
  - tips_paid_part_prompt.md
  - tips_cta_prompt.md
  - self_review_prompt.md
  - revision_prompt.md
  - sales_analysis_prompt.md
```

GASプロジェクト内では、テンプレートを直接文字列として持ってもよい。  
ただし将来的な保守性を考えると、Google DocsまたはGitHub上にテンプレート原本を持ち、GASに同期する方式を検討する。

### 3.6 APIキー管理

Gemini APIキーは以下のいずれかで管理する。

#### 推奨：Apps Script Properties Service

```text
Script Properties:
  GEMINI_API_KEY
  GEMINI_MODEL_DEFAULT
  GEMINI_MODEL_REVIEW
```

#### 禁止事項

- APIキーをGitHubにコミットしない。
- GASコード内に直書きしない。
- Google Sheetsに平文保存しない。
- Webアプリ画面に表示しない。
- ログに出力しない。

### 3.7 コスト制御

初期は以下の制限を設ける。

| 項目 | 初期上限 |
|---|---:|
| 1日あたり生成商品数 | 1〜3件 |
| 1商品あたり自動生成回数 | 最大3回 |
| 1商品あたり自動レビュー回数 | 最大2回 |
| 1日あたりAPI呼び出し失敗許容 | 3回 |
| 月間API予算目安 | 0円〜500円 |
| 上限警告ライン | 月300円相当 |
| 停止ライン | 月1,000円相当 |

GAS側でAPI使用回数と概算トークン数を記録する。

```text
api_usage_log シート
  - timestamp
  - process_type
  - model
  - input_chars
  - output_chars
  - estimated_tokens
  - estimated_cost_jpy
  - status
  - error_message
```

### 3.8 Gemini APIエラー時の挙動

| エラー | 挙動 |
|---|---|
| APIキー不正 | 処理停止、管理画面にエラー表示 |
| レート制限 | 再試行最大2回、その後停止 |
| タイムアウト | 再試行最大2回 |
| 出力空 | ステータスを「生成失敗」に変更 |
| 不適切出力 | ステータスを「要確認」に変更 |
| JSON解析失敗 | 元レスポンスをログ保存し、修正対象にする |

---

## 4. MCP 6点セット導入仕様

### 4.1 MCP導入の基本方針

MCPは、Cursor Cloudに外部サービス操作権限を渡すための拡張手段である。  
便利だが、権限が強くなりすぎるため、初期は最小権限・段階導入とする。

### 4.2 導入対象MCP

| MCP | 初期導入 | 用途 |
|---|---:|---|
| Tips MCP | 必須 | Tips下書き作成、編集、販売状況確認 |
| GitHub MCP | 必須 | リポジトリ、Issue、PR、仕様書管理 |
| Context7 MCP | 必須 | 最新ドキュメント参照 |
| Google Drive MCP | 必須 | Docs/Driveの素材・下書き参照 |
| Playwright MCP | 推奨 | GAS WebアプリUIテスト |
| GAS MCP / clasp | 推奨 | GAS作成、編集、デプロイ、実行 |

### 4.3 Tips MCP仕様

#### 初期許可操作

| 操作 | 許可 |
|---|---|
| Tips下書き作成 | 許可 |
| Tips記事編集 | 許可 |
| Tips販売状況確認 | 許可 |
| Tips記事一覧取得 | 許可 |
| Tips公開操作 | 原則禁止 |
| Tips削除操作 | 禁止 |

#### 初期ユースケース

```text
- Google Docsの下書きをTips形式へ整形
- Tips下書きとして登録
- 登録URLをSheetsへ保存
- 販売状況を週次で取得
- 売上・閲覧・購入数から改善案を作成
```

#### 注意事項

- 全文AI生成のみで公開しない。
- 法律・労務・健康・金融の断定表現は人間確認必須。
- 体験談を捏造しない。
- 過度な煽り表現を避ける。
- 公開前に必ずスマホ承認画面を通す。

### 4.4 GitHub MCP仕様

#### 対象リポジトリ

専用リポジトリを作成する。

```text
tips-ai-auto-sales-system
```

#### 主な用途

```text
- 仕様書管理
- GASコード管理
- WebアプリHTML/CSS/JS管理
- プロンプトテンプレート管理
- Issueによるタスク管理
- 実装履歴の保存
- Cursor Cloudへの作業指示
```

#### 推奨ディレクトリ構成

```text
tips-ai-auto-sales-system/
  README.md
  docs/
    original_spec.md
    diff_spec_gemini_mcp.md
    operation_manual.md
    security_policy.md
  gas/
    appsscript.json
    Code.gs
    Config.gs
    GeminiClient.gs
    SheetService.gs
    DocService.gs
    TipsService.gs
    GmailService.gs
    TriggerService.gs
    WebApp.gs
    Html/
      index.html
      detail.html
      styles.html
      scripts.html
  prompts/
    product_idea_prompt.md
    tips_free_part_prompt.md
    tips_paid_part_prompt.md
    self_review_prompt.md
    revision_prompt.md
    sales_analysis_prompt.md
  tests/
    playwright/
      review_flow.spec.ts
      mobile_ui.spec.ts
  .cursor/
    rules/
      project_rules.md
```

### 4.5 Context7 MCP仕様

#### 用途

Cursorが実装時に古いAPIや架空APIを使わないようにする。

#### 必須確認対象

```text
- Google Apps Script
- Google Sheets API
- Google Docs API
- Google Drive API
- Apps Script Properties Service
- Apps Script Triggers
- clasp
- Tips MCP
- Playwright MCP
- Cursor MCP設定
```

#### Cursorルール

```text
外部API、MCP、Googleサービス、clasp、Tips連携、認証処理を書く場合は、
必ずContext7または公式ドキュメントを確認してから実装する。
推測で関数名やエンドポイントを書かない。
```

### 4.6 Google Drive MCP仕様

#### 初期アクセス範囲

Google Drive全体ではなく、専用フォルダに限定する。

```text
/Tips_AI_Auto_Sales_System/
  /drafts/
  /materials/
  /reports/
  /exports/
  /templates/
```

#### 主な用途

```text
- Google Docs下書きの検索
- 素材ファイルの参照
- レポートの確認
- テンプレート文書の参照
- 生成物の格納先確認
```

#### 禁止事項

```text
- Drive全体の無差別検索
- 既存個人ファイルの編集
- ファイル削除
- 機密ファイルの読み込み
```

### 4.7 Playwright MCP仕様

#### 用途

GAS WebアプリのスマホUIと承認フローを自動テストする。

#### 初期テスト対象

```text
- レビュー待ち一覧が表示される
- 詳細画面が開く
- 本文プレビューが表示される
- 承認ボタンが機能する
- 修正依頼ボタンが機能する
- 保留ボタンが機能する
- スマホ幅で表示崩れがない
- 不正なIDで詳細ページを開いた場合にエラー表示される
```

#### 禁止・注意事項

- 本番Tips公開操作の自動テストは禁止。
- 本番販売ページに対する破壊的操作は禁止。
- 初期はGAS Webアプリのテスト専用とする。

### 4.8 GAS MCP / clasp仕様

#### 方針

GAS操作は、**claspを背骨** とする。  
GAS MCPは便利だが、コミュニティ実装の場合は安定性確認後に本格利用する。

#### 初期採用方針

```text
1. GitHubでGASコードを管理
2. claspでGASプロジェクトへpush
3. setupProject()を手動またはMCP経由で実行
4. Webアプリをデプロイ
5. 必要に応じてGAS MCPで実行・デプロイ補助
```

#### Cursorに実行させたい作業

```text
- GASプロジェクトの雛形作成
- appsscript.json作成
- clasp設定
- Code.gs等のファイル作成
- setupProject()作成
- デプロイ手順書作成
- 実行ログ確認
- エラー時の修正
```

---

## 5. GAS Webアプリ仕様の差分

### 5.1 目的

Google Sheetsをスマホで直接見る運用を廃止し、GAS Webアプリをスマホ専用管理画面として使用する。

### 5.2 初期画面一覧

| 画面 | 用途 |
|---|---|
| ダッシュボード | レビュー待ち、エラー、売上概要 |
| 下書き一覧 | AI生成済み商品の一覧 |
| 下書き詳細 | 無料部分・有料部分・レビュー結果の確認 |
| 承認操作 | 承認、修正依頼、保留、停止 |
| 修正コメント入力 | AIへの修正指示を入力 |
| Tips連携状態 | Tips下書きURL、連携エラー確認 |
| API使用量 | Gemini APIの概算使用量確認 |
| 設定 | モデル、通知先、生成数上限の確認 |

### 5.3 スマホUIの基本方針

```text
- 横スクロールを発生させない
- 表形式を避ける
- カード型UIにする
- 操作ボタンを大きくする
- 1画面1目的にする
- 本文は折りたたみ表示にする
- 危険操作は確認ダイアログを出す
```

### 5.4 ダッシュボード表示項目

```text
- レビュー待ち件数
- 修正待ち件数
- Tips下書き作成済み件数
- エラー件数
- 今月の生成数
- Gemini API概算費用
- Tips販売数
- Tips売上概算
- 最新エラー
```

### 5.5 下書きカード表示項目

```text
- タイトル
- 商品タイプ
- 想定価格
- リスク区分
- ステータス
- AIレビュー要約
- 生成日時
- 詳細を見るボタン
```

### 5.6 詳細画面表示項目

```text
- タイトル
- ターゲット読者
- 商品概要
- 無料部分プレビュー
- 有料部分プレビュー
- CTA
- AIセルフレビュー
- リスク判定
- 修正履歴
- Google Docs URL
- Tips下書きURL
```

### 5.7 操作ボタン

| ボタン | 動作 |
|---|---|
| 承認 | ステータスを「承認済み」に変更 |
| 修正依頼 | コメント入力後「修正待ち」に変更 |
| 保留 | 「保留」に変更 |
| 停止 | 「停止」に変更 |
| Tips下書き作成 | Tips MCP連携を実行 |
| 再レビュー | Gemini APIでセルフレビュー再実行 |
| 再生成 | Gemini APIで本文再生成。ただし確認付き |

### 5.8 危険操作の扱い

以下の操作には確認ダイアログを必須とする。

```text
- 再生成
- Tips下書き作成
- 停止
- 設定変更
- トリガー変更
- APIキー設定
```

Tips公開操作は初期Webアプリには実装しない。  
将来的に実装する場合も、2段階確認とリスク判定を必須とする。

---

## 6. Google Sheets裏側DB差分

### 6.1 スプレッドシート直接操作禁止方針

マスターは原則としてGoogle Sheetsを直接操作しない。  
SheetsはGAS、Cursor、AIが読む裏側DBとして扱う。

### 6.2 必要シート

```text
config
products
drafts
reviews
tips_links
api_usage_log
sales_log
error_log
operation_log
prompt_templates
```

### 6.3 productsシート

| 列 | 説明 |
|---|---|
| product_id | 商品ID |
| product_type | 商品タイプ |
| title | タイトル |
| target_reader | 対象読者 |
| problem | 読者の悩み |
| promise | 商品が提供する価値 |
| price_jpy | 想定価格 |
| risk_level | low / medium / high |
| status | ステータス |
| created_at | 作成日時 |
| updated_at | 更新日時 |

### 6.4 draftsシート

| 列 | 説明 |
|---|---|
| draft_id | 下書きID |
| product_id | 商品ID |
| free_doc_url | 無料部分Doc URL |
| paid_doc_url | 有料部分Doc URL |
| full_doc_url | 統合Doc URL |
| cta_text | CTA |
| generation_model | 生成モデル |
| generation_status | 生成ステータス |
| approved_by_user | 承認状態 |
| approval_comment | 承認・修正コメント |

### 6.5 reviewsシート

| 列 | 説明 |
|---|---|
| review_id | レビューID |
| draft_id | 下書きID |
| legal_risk | 法律断定リスク |
| ad_risk | 広告表現リスク |
| fabrication_risk | 捏造リスク |
| anxiety_risk | 不安煽りリスク |
| value_score | 商品価値スコア |
| readability_score | スマホ可読性スコア |
| recommendation | approve / revise / hold |
| review_summary | レビュー要約 |

### 6.6 tips_linksシート

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

### 6.7 api_usage_logシート

| 列 | 説明 |
|---|---|
| log_id | ログID |
| timestamp | 実行日時 |
| process_type | 処理種別 |
| model | 使用モデル |
| input_chars | 入力文字数 |
| output_chars | 出力文字数 |
| estimated_tokens | 概算トークン |
| estimated_cost_jpy | 概算費用 |
| status | success / error |
| error_message | エラー内容 |

---

## 7. setupProject() 自動構築仕様

### 7.1 目的

Cursor CloudとGAS/claspにより、初期セットアップを可能な限り自動化する。

### 7.2 setupProject()が作成するもの

```text
- 専用Google Driveフォルダ
- draftsフォルダ
- materialsフォルダ
- reportsフォルダ
- templatesフォルダ
- 管理用Googleスプレッドシート
- 必要な全シート
- ヘッダー行
- 初期設定行
- サンプル商品案
- Gmail通知先設定
- 時間主導トリガー
- Webアプリ初期設定
```

### 7.3 setupProject()の実行条件

```text
- 初回のみ実行
- 既存設定がある場合は上書きしない
- 既存ファイルがある場合は再利用する
- 作成結果をconfigシートに保存する
- エラー発生時はerror_logに記録する
```

### 7.4 setupProject()の安全装置

```text
- 既存Driveファイルを削除しない
- 既存Sheetsを破壊しない
- configに既存IDがある場合は確認モードにする
- APIキーは作成しない
- APIキー入力は別途手動設定
```

### 7.5 想定関数

```text
setupProject()
createProjectFolders()
createManagementSpreadsheet()
createRequiredSheets()
initializeHeaders()
initializeConfig()
createSampleRows()
createTimeTriggers()
sendSetupCompleteEmail()
```

---

## 8. Tips商品生成ワークフロー差分

### 8.1 初期ワークフロー

```text
1. GASがproductsシートから未着手の商品案を取得
2. Gemini APIで無料部分を生成
3. Gemini APIで有料部分を生成
4. Gemini APIでCTAを生成
5. Google Docsに保存
6. Gemini APIでセルフレビュー
7. reviewsシートへ結果保存
8. GAS Webアプリにレビュー待ちとして表示
9. マスターがスマホで確認
10. 承認後、Tips MCPでTips下書きを作成
11. tips_linksシートへURL保存
12. Gmailで完了通知
```

### 8.2 ステータス遷移

```text
未着手
  ↓
生成中
  ↓
レビュー生成中
  ↓
レビュー待ち
  ↓
承認済み
  ↓
Tips下書き作成中
  ↓
Tips下書き作成済み
  ↓
手動公開待ち
  ↓
公開済み
```

例外：

```text
生成失敗
修正待ち
保留
停止
Tips連携エラー
```

### 8.3 修正依頼ワークフロー

```text
1. 管理画面で修正依頼を選択
2. 修正コメントを入力
3. ステータスを修正待ちに変更
4. Gemini APIが修正版を生成
5. Docsに新バージョンとして保存
6. 再レビュー実行
7. 再びレビュー待ちに戻す
```

### 8.4 バージョン管理

Google Docsは上書きではなく、以下のいずれかとする。

#### 推奨A：1ドキュメント内に履歴を追記

```text
# v1
本文

# AIレビュー v1
レビュー

# v2
修正版

# AIレビュー v2
レビュー
```

#### 推奨B：バージョン別Docを作成

```text
draft_PRODUCTID_v1
draft_PRODUCTID_v2
draft_PRODUCTID_v3
```

初期はAを推奨する。Drive内ファイルが増えすぎないため。

---

## 9. セキュリティ・権限設計差分

### 9.1 最小権限原則

MCP、GAS、APIキー、OAuthはすべて最小権限で設定する。

### 9.2 禁止事項

```text
- APIキーのGitHubコミット
- Tips公開の完全自動化
- Drive全体への無制限アクセス
- 既存ファイル削除
- 本番Tips記事の自動削除
- AIによる法的断定
- AIによる体験談捏造
- 高リスク商品の自動公開
```

### 9.3 MCP権限の初期設定

| MCP | 初期権限方針 |
|---|---|
| Tips MCP | 下書き作成・編集・販売状況確認まで |
| GitHub MCP | 専用リポジトリのみ |
| Context7 MCP | 読み取り中心 |
| Google Drive MCP | 専用フォルダのみ |
| Playwright MCP | GAS Webアプリテストのみ |
| GAS MCP / clasp | 専用GASプロジェクトのみ |

### 9.4 承認必須条件

以下の場合は必ず人間承認を必要とする。

```text
- Tips公開
- 価格設定変更
- 高リスク記事のTips下書き作成
- 法律・労務・金融・健康に触れる本文
- 販売ページの煽り表現が強い場合
- API使用上限変更
- トリガー頻度変更
```

---

## 10. 費用設計差分

### 10.1 追加費用前提

マスターはGoogle AI Pro加入済み。  
ただしGemini APIは別枠として扱う。

### 10.2 初期費用目安

| 項目 | 月額目安 | 備考 |
|---|---:|---|
| Cursor Pro | 約3,200円 | 主担当ツール |
| Google AI Pro | 加入済み | 追加費用なし扱い |
| GAS | 0円 | 無料枠中心 |
| Google Sheets / Docs / Drive | 0円 | 個人利用前提 |
| Gemini API | 0円〜500円 | 初期少量生成 |
| GitHub | 0円 | 無料枠 |
| Tips | 0円 | 売上時手数料 |
| 独自ドメイン | 不要 | 初期はTips販売のみ |
| WordPress | 不要 | 初期対象外 |
| Canva Pro | 任意 | 必須ではない |

### 10.3 初期想定月額

```text
約3,200円〜3,800円
```

大半はCursor Pro費用。  
Gemini APIは初期運用では小額想定。

### 10.4 売上時のTips手数料

Tipsは売上時に販売手数料が発生する。  
仕様上は、売上管理シートに以下を持つ。

```text
sales_log
  - tips_id
  - product_id
  - gross_sales_jpy
  - platform_fee_jpy
  - estimated_net_jpy
  - withdrawal_status
```

### 10.5 コスト警告

GAS Webアプリのダッシュボードに以下を表示する。

```text
- 今月のGemini API概算利用額
- 今月の生成回数
- 1商品あたり平均API費用
- 警告ライン到達有無
```

---

## 11. Cursor Cloud向け実装指示差分

### 11.1 Cursorに最初に渡す指示

```text
このプロジェクトでは、Tips販売用のAI半自動生成・承認・投稿支援システムを実装する。

既存仕様書に加えて、以下の差分仕様書を必ず反映する。

- Codexは使わない
- Cursor Cloudを司令塔とする
- AI生成エンジンはGemini APIを使う
- Google AI Proは手動レビュー補助として扱う
- Tipsを主販売先とする
- MCPは以下6点を導入前提とする
  1. Tips MCP
  2. GitHub MCP
  3. Context7 MCP
  4. Google Drive MCP
  5. Playwright MCP
  6. GAS MCP または clasp
- GAS操作はclaspを背骨にする
- スプレッドシートは裏側DBとして使い、ユーザーは直接見ない
- スマホ操作はGAS Webアプリで行う
- 初期はTips下書き作成まで。公開は手動承認とする
- setupProject()でSheets、Driveフォルダ、初期シート、トリガーを自動作成する
- APIキーはProperties Serviceで管理し、コードやGitHubに含めない
- Context7で最新仕様を確認しながら実装する
```

### 11.2 実装順序

```text
Phase 0: GitHubリポジトリ作成
Phase 1: GAS/clasp雛形作成
Phase 2: setupProject()実装
Phase 3: Sheets裏側DB作成処理
Phase 4: GeminiClient実装
Phase 5: Google Docs保存処理
Phase 6: GAS WebアプリUI実装
Phase 7: 承認・修正・保留フロー実装
Phase 8: Tips MCP連携
Phase 9: Playwright MCPでUIテスト
Phase 10: 費用ログ・エラーログ・週次レポート実装
```

### 11.3 初期リリース範囲

初期リリースでは、以下までを完了条件とする。

```text
- setupProject()が正常に動く
- 管理用スプレッドシートが作成される
- 必要シートが作成される
- Gemini APIキーをPropertiesに設定できる
- 商品案1件からTips下書き原稿を生成できる
- Google Docsに保存できる
- GAS Webアプリでスマホ表示できる
- 承認・修正・保留ができる
- Tips下書き作成前まで進められる
```

Tips MCPによる下書き作成は初期リリース直後の拡張でもよい。  
まずはGoogle Docs下書き生成とスマホ承認UIの安定を優先する。

---

## 12. テスト仕様差分

### 12.1 GAS単体テスト観点

```text
- setupProject()が二重実行されても破壊しない
- 必要シートが存在しない場合に再作成できる
- Gemini APIキー未設定時に明確なエラーを出す
- API失敗時にerror_logへ記録する
- Docs作成失敗時にステータスがエラーになる
- 承認操作で正しくステータスが変わる
- 修正依頼コメントが保存される
```

### 12.2 Playwrightテスト観点

```text
- スマホ幅でダッシュボードが表示される
- レビュー待ちカードが表示される
- 詳細画面に遷移できる
- 承認ボタンを押すと確認ダイアログが出る
- 修正依頼入力欄が表示される
- 保留操作ができる
- エラー状態の商品が視認できる
```

### 12.3 Tips MCP連携テスト観点

```text
- テスト商品を下書きとして作成できる
- 下書きURLを取得できる
- SheetsにURLを保存できる
- エラー時にTips連携エラーとして記録できる
- 公開操作が自動実行されない
```

---

## 13. 運用ルール差分

### 13.1 日常運用

```text
1. GASが商品案を生成または取得
2. Gemini APIで下書き生成
3. Docs保存
4. セルフレビュー
5. スマホ管理画面に表示
6. マスターが承認・修正・保留
7. 承認済みのみTips下書き作成
8. Tips上で最終確認して手動公開
```

### 13.2 週次運用

```text
- 販売状況を取得
- 売れた商品を分析
- 売れていない商品を分析
- 次週の商品案を生成
- API費用を確認
- エラーログを確認
```

### 13.3 月次運用

```text
- 商品カテゴリ別売上確認
- 価格帯別売上確認
- 高リスク表現の見直し
- プロンプト改善
- MCP権限棚卸し
- 自動化範囲拡大可否の判断
```

---

## 14. 将来拡張方針

### 14.1 自動公開検討条件

以下を満たすまで自動公開は検討しない。

```text
- 30件以上の下書き生成で重大事故なし
- Tips下書き連携が10件以上安定
- Gemini API費用が想定内
- 高リスク判定が正常に機能
- 手動公開後の修正率が低い
- 売上または反応データが蓄積されている
```

### 14.2 自動公開対象候補

自動公開を検討する場合も、対象は低リスク商品のみとする。

```text
- チェックリスト
- プロンプト集
- 作業テンプレート
- スマホ操作手順
- 汎用的な整理ノート
```

### 14.3 自動公開対象外

```text
- 退職代行比較
- 法律・労務に触れる商品
- 収益保証に見える商品
- 医療・健康に触れる商品
- 金融判断に触れる商品
- 読者の不安を強く煽る商品
```

---

## 15. 本差分の最終結論

本プロジェクトは、以下の形に更新する。

```text
Cursor Cloudを司令塔とし、
MCP 6点セットを段階導入し、
GAS Webアプリをスマホ管理画面とし、
Google Sheetsを裏側DB、
Google Docsを下書き保管庫、
Gemini APIを自動生成エンジン、
Tipsを販売先として使う。

初期は完全自動公開を行わず、
AI生成、セルフレビュー、Docs保存、スマホ承認、Tips下書き作成までを対象とする。

安定性確認後にのみ、低リスク商品から自動化範囲を拡張する。
```

---

## 16. 既存仕様書への反映対象まとめ

既存仕様書に対して、以下を追記・置換する。

| 既存項目 | 差分対応 |
|---|---|
| 投稿先設計 | Tips主軸へ変更 |
| AI API設計 | Gemini API採用を明記 |
| Google AI Pro | 手動レビュー補助として追記 |
| スマホ管理 | GAS Webアプリを本命化 |
| Sheets運用 | 直接操作禁止、裏側DB化 |
| MCP設計 | 6点セット導入 |
| GAS操作 | clasp背骨＋GAS MCP補助 |
| セキュリティ | MCP最小権限、公開操作禁止を追記 |
| 費用 | Cursor Pro＋Gemini API少額に更新 |
| テスト | Playwright MCPによるスマホUIテストを追記 |
| 自動化段階 | 初期は下書き・承認までに制限 |

以上。
