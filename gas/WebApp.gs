/**
 * スマホ用 Web アプリ（セットアップ状態表示・将来の管理画面の入口）
 */

/**
 * @param {Object} e
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function doGet(e) {
  e = e || {};
  try {
    if (e.parameter.page === 'setup') {
      return HtmlService.createHtmlOutputFromFile('Html/setup')
        .setTitle('初回セットアップ')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    }
    var template = HtmlService.createTemplateFromFile('Html/index');
    template.status = getProjectStatus();
    return template
      .evaluate()
      .setTitle('Tips AI 管理')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (err) {
    return HtmlService.createHtmlOutput(
      '<p>エラー: ' + escapeHtml_(err.message) + '</p>' +
        '<p><a href="?page=setup">初回セットアップへ</a></p>'
    ).setTitle('エラー');
  }
}

/**
 * @param {string} text
 * @returns {string}
 */
function escapeHtml_(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * HtmlService テンプレート用
 * @param {string} name
 * @returns {string}
 */
function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}
