/**
 * エントリポイント・未実装スタブ
 */

/** フェーズ1で実装予定: 生成待ち商品から下書き生成 */
function generateDrafts() {
  throw new Error('generateDrafts() はフェーズ1で実装予定です。');
}

/**
 * セットアップ状態を確認（ログ出力用）
 * @returns {Object}
 */
function getProjectStatus() {
  var ss = getManagementSpreadsheet();
  return {
    setupComplete: !!getConfigValue(CONFIG_KEYS.SETUP_COMPLETED_AT),
    spreadsheetId: getConfigValue(CONFIG_KEYS.SPREADSHEET_ID),
    spreadsheetUrl: ss ? ss.getUrl() : '',
    hasGeminiKey: !!PropertiesService.getScriptProperties().getProperty(SCRIPT_PROPERTY_KEYS.GEMINI_API_KEY),
  };
}
