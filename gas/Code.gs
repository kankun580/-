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
  var reviewWaitingCount = 0;
  if (ss) {
    try {
      var sheet = ss.getSheetByName(SHEET_NAMES.PRODUCTS);
      if (sheet && sheet.getLastRow() > 1) {
        var statuses = sheet.getRange(2, 9, sheet.getLastRow() - 1, 1).getValues();
        for (var i = 0; i < statuses.length; i++) {
          if (String(statuses[i][0]) === 'レビュー待ち') {
            reviewWaitingCount++;
          }
        }
      }
    } catch (e) {
      Logger.log('getProjectStatus count: ' + e.message);
    }
  }
  return {
    setupComplete: !!getConfigValue(CONFIG_KEYS.SETUP_COMPLETED_AT),
    spreadsheetId: getSpreadsheetId_(),
    spreadsheetUrl: ss ? ss.getUrl() : '',
    hasGeminiKey: !!PropertiesService.getScriptProperties().getProperty(SCRIPT_PROPERTY_KEYS.GEMINI_API_KEY),
    reviewWaitingCount: reviewWaitingCount,
  };
}
