/**
 * スマホ用 Web アプリ（セットアップ状態表示・将来の管理画面の入口）
 */

/**
 * @param {Object} e
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function doGet(e) {
  try {
    ensureProjectSetup();
  } catch (err) {
    Logger.log('doGet setup: ' + err.message);
  }
  var template = HtmlService.createTemplateFromFile('index');
  template.status = getProjectStatus();
  template.statusJson = JSON.stringify(getProjectStatus());
  return template
    .evaluate()
    .setTitle('Tips AI 管理')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * HtmlService テンプレート用
 * @param {string} name
 * @returns {string}
 */
function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}
