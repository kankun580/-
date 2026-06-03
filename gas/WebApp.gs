/**
 * スマホ用 Web アプリ
 */

/**
 * @param {Object} e
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function doGet(e) {
  e = e || {};
  var page = e.parameter.page || 'home';

  try {
    if (page === 'setup') {
      return pageHtml_('Html/setup', '初回セットアップ');
    }
    if (page === 'review') {
      return pageHtml_('Html/review', 'レビュー待ち');
    }
    if (page === 'revision') {
      return pageHtml_('Html/revision', '修正待ち');
    }
    if (page === 'detail' && e.parameter.product_id) {
      var t = HtmlService.createTemplateFromFile('Html/detail');
      t.productId = e.parameter.product_id;
      return t.evaluate().setTitle('記事詳細').addMetaTag('viewport', 'width=device-width, initial-scale=1');
    }

    var template = HtmlService.createTemplateFromFile('Html/index');
    template.status = getProjectStatus();
    return template.evaluate().setTitle('Tips AI 管理').addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (err) {
    return HtmlService.createHtmlOutput(
      '<p>エラー: ' + escapeHtml_(err.message) + '</p><p><a href="?page=home">ホーム</a></p>'
    ).setTitle('エラー');
  }
}

/**
 * @param {string} file
 * @param {string} title
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function pageHtml_(file, title) {
  return HtmlService.createHtmlOutputFromFile(file)
    .setTitle(title)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
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

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}
