/**
 * 初回ブートストラップ（clasp run から実行）
 * APIキーは Script Properties にのみ保存する。
 */

/**
 * Gemini API キーを Script Properties に設定（未設定時または上書き許可時）
 * @param {string} apiKey
 * @param {boolean=} allowOverwrite
 * @returns {Object}
 */
function bootstrapGeminiKey(apiKey, allowOverwrite) {
  if (!apiKey || String(apiKey).length < 20) {
    throw new Error('有効な Gemini API キーを渡してください。');
  }
  var props = PropertiesService.getScriptProperties();
  var existing = props.getProperty(SCRIPT_PROPERTY_KEYS.GEMINI_API_KEY);
  if (existing && !allowOverwrite) {
    return { ok: true, message: 'GEMINI_API_KEY は既に設定済みです（上書きしません）' };
  }
  props.setProperty(SCRIPT_PROPERTY_KEYS.GEMINI_API_KEY, String(apiKey));
  writeOperationLog('system', 'bootstrapGeminiKey', { comment: 'APIキーを設定しました' });
  return { ok: true, message: 'GEMINI_API_KEY を Script Properties に保存しました' };
}

/**
 * clasp run 用: セットアップ一括（キー設定 → setupProject → 疎通テスト）
 * @param {string} apiKey
 * @returns {Object}
 */
function bootstrapAll(apiKey) {
  var steps = [];
  steps.push(bootstrapGeminiKey(apiKey, true));
  steps.push(setupProject());
  steps.push(testGeminiConnection());
  steps.push(installAutomationTriggers());
  return { ok: true, steps: steps };
}

/**
 * スマホ Web アプリから初回セットアップ（ログイン済み Google アカウントで実行）
 * @param {string} apiKey
 * @returns {Object}
 */
function completeSetupFromWeb(apiKey) {
  var result = bootstrapAll(apiKey);
  writeOperationLog('user', 'completeSetupFromWeb', { comment: 'Web初回セットアップ' });
  return result;
}
