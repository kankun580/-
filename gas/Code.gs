/**
 * エントリポイント
 */

/**
 * セットアップ状態を確認
 * @returns {Object}
 */
function getProjectStatus() {
  var ss = getManagementSpreadsheet();
  var reviewWaitingCount = getProductsByStatus('レビュー待ち').length;
  return {
    setupComplete: !!getConfigValue(CONFIG_KEYS.SETUP_COMPLETED_AT),
    spreadsheetId: getSpreadsheetId_(),
    spreadsheetUrl: ss ? ss.getUrl() : '',
    hasGeminiKey: !!PropertiesService.getScriptProperties().getProperty(SCRIPT_PROPERTY_KEYS.GEMINI_API_KEY),
    reviewWaitingCount: reviewWaitingCount,
    pendingCount: getProductsByStatus('未着手').length,
  };
}
