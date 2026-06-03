/**
 * プロジェクト定数・シート定義
 * @see docs/sheet_schema.md
 */

var PROJECT = {
  NAME: 'Tips_AI_Auto_Sales_System',
  SETUP_VERSION: '1.0.0',
  ROOT_FOLDER_NAME: 'Tips_AI_Auto_Sales_System',
  SUB_FOLDERS: ['drafts', 'materials', 'reports', 'exports', 'templates'],
};

var SHEET_NAMES = {
  CONFIG: 'config',
  PRODUCTS: 'products',
  DRAFTS: 'drafts',
  REVIEWS: 'reviews',
  TIPS_LINKS: 'tips_links',
  API_USAGE_LOG: 'api_usage_log',
  SALES_LOG: 'sales_log',
  ERROR_LOG: 'error_log',
  OPERATION_LOG: 'operation_log',
  PROMPT_TEMPLATES: 'prompt_templates',
};

var SHEET_HEADERS = {};
SHEET_HEADERS[SHEET_NAMES.CONFIG] = ['key', 'value', 'description'];
SHEET_HEADERS[SHEET_NAMES.PRODUCTS] = [
  'product_id', 'product_type', 'title', 'target_reader', 'problem', 'promise',
  'price_jpy', 'risk_level', 'status', 'created_at', 'updated_at',
];
SHEET_HEADERS[SHEET_NAMES.DRAFTS] = [
  'draft_id', 'product_id', 'free_doc_url', 'paid_doc_url', 'full_doc_url',
  'cta_text', 'generation_model', 'generation_status', 'approved_by_user', 'approval_comment',
];
SHEET_HEADERS[SHEET_NAMES.REVIEWS] = [
  'review_id', 'draft_id', 'legal_risk', 'ad_risk', 'fabrication_risk', 'anxiety_risk',
  'value_score', 'readability_score', 'recommendation', 'review_summary',
];
SHEET_HEADERS[SHEET_NAMES.TIPS_LINKS] = [
  'tips_id', 'product_id', 'draft_id', 'tips_draft_url', 'tips_public_url',
  'tips_status', 'last_synced_at', 'error_message',
];
SHEET_HEADERS[SHEET_NAMES.API_USAGE_LOG] = [
  'log_id', 'timestamp', 'process_type', 'model', 'input_chars', 'output_chars',
  'estimated_tokens', 'estimated_cost_jpy', 'status', 'error_message',
];
SHEET_HEADERS[SHEET_NAMES.SALES_LOG] = [
  'sales_log_id', 'date', 'tips_id', 'product_id', 'gross_sales_jpy', 'platform_fee_jpy',
  'estimated_net_jpy', 'views', 'sales_count', 'conversion_rate', 'withdrawal_status', 'memo',
];
SHEET_HEADERS[SHEET_NAMES.ERROR_LOG] = [
  'error_id', 'timestamp', 'process_name', 'product_id', 'error_message',
  'stack_trace', 'resolved', 'memo',
];
SHEET_HEADERS[SHEET_NAMES.OPERATION_LOG] = [
  'log_id', 'timestamp', 'actor', 'action', 'product_id', 'before_status', 'after_status', 'comment',
];
SHEET_HEADERS[SHEET_NAMES.PROMPT_TEMPLATES] = [
  'prompt_id', 'prompt_type', 'name', 'template', 'version', 'active', 'memo',
];

/** config シートに保存するキー */
var CONFIG_KEYS = {
  SETUP_VERSION: 'SETUP_VERSION',
  SETUP_COMPLETED_AT: 'SETUP_COMPLETED_AT',
  SPREADSHEET_ID: 'SPREADSHEET_ID',
  PROJECT_ROOT_FOLDER_ID: 'PROJECT_ROOT_FOLDER_ID',
  DRAFTS_FOLDER_ID: 'DRAFTS_FOLDER_ID',
  MATERIALS_FOLDER_ID: 'MATERIALS_FOLDER_ID',
  REPORTS_FOLDER_ID: 'REPORTS_FOLDER_ID',
  EXPORTS_FOLDER_ID: 'EXPORTS_FOLDER_ID',
  TEMPLATES_FOLDER_ID: 'TEMPLATES_FOLDER_ID',
  AI_PROVIDER: 'AI_PROVIDER',
  GEMINI_MODEL_DEFAULT: 'GEMINI_MODEL_DEFAULT',
  MAX_DAILY_GENERATION: 'MAX_DAILY_GENERATION',
  AUTO_TIPS_DRAFT: 'AUTO_TIPS_DRAFT',
  AUTO_PUBLISH: 'AUTO_PUBLISH',
  HIGH_RISK_AUTO_STOP: 'HIGH_RISK_AUTO_STOP',
  DEFAULT_PRICE: 'DEFAULT_PRICE',
  REVIEW_EMAIL: 'REVIEW_EMAIL',
};

var DEFAULT_CONFIG_ROWS = [
  [CONFIG_KEYS.SETUP_VERSION, PROJECT.SETUP_VERSION, 'セットアップバージョン'],
  [CONFIG_KEYS.AI_PROVIDER, 'gemini', 'AIプロバイダー'],
  [CONFIG_KEYS.GEMINI_MODEL_DEFAULT, 'gemini-2.5-flash', 'デフォルト生成モデル'],
  [CONFIG_KEYS.MAX_DAILY_GENERATION, '1', '1日の最大生成数'],
  [CONFIG_KEYS.AUTO_TIPS_DRAFT, 'false', 'Tips下書き自動作成'],
  [CONFIG_KEYS.AUTO_PUBLISH, 'false', '自動公開'],
  [CONFIG_KEYS.HIGH_RISK_AUTO_STOP, 'true', '高リスク自動停止'],
  [CONFIG_KEYS.DEFAULT_PRICE, '980', 'デフォルト価格（円）'],
  [CONFIG_KEYS.REVIEW_EMAIL, '', 'レビュー通知先（要設定）'],
];

var SCRIPT_PROPERTY_KEYS = {
  GEMINI_API_KEY: 'GEMINI_API_KEY',
  GEMINI_MODEL_DEFAULT: 'GEMINI_MODEL_DEFAULT',
  GEMINI_MODEL_REVIEW: 'GEMINI_MODEL_REVIEW',
};

var GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
