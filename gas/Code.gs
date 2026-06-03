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
  var revisionWaitingCount = getProductsByStatus('修正待ち').length;
  var tipsPendingCount = getTipsPendingProducts().length;
  return {
    setupComplete: !!getConfigValue(CONFIG_KEYS.SETUP_COMPLETED_AT),
    spreadsheetId: getSpreadsheetId_(),
    spreadsheetUrl: ss ? ss.getUrl() : '',
    hasGeminiKey: !!PropertiesService.getScriptProperties().getProperty(SCRIPT_PROPERTY_KEYS.GEMINI_API_KEY),
    reviewWaitingCount: reviewWaitingCount,
    revisionWaitingCount: revisionWaitingCount,
    tipsPendingCount: tipsPendingCount,
    pendingCount: getProductsByStatus('未着手').length,
  };
}
