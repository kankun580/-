/**
 * スマホ用 Web アプリ
 */

/**
 * @param {Object} e
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
/**
 * Tips MCP Webhook（POST JSON）
 * @param {Object} e
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
  try {
    var body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    var action = body.action || 'record_tips_draft';

    if (action === 'record_tips_draft') {
      var result = recordTipsDraftFromWebhook(body);
      return jsonResponse_({ ok: true, result: result });
    }
    if (action === 'tips_error') {
      recordTipsLinkError(body.product_id, body.error_message || 'Webhook error');
      return jsonResponse_({ ok: true });
    }

    return jsonResponse_({ ok: false, error: '不明な action: ' + action });
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message });
  }
}

/**
 * @param {Object} obj
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

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
    if (page === 'tips') {
      return pageHtml_('Html/tips', 'Tips連携');
    }
    if (page === 'tips_detail' && e.parameter.product_id) {
      var tipsT = HtmlService.createTemplateFromFile('Html/tips_detail');
      tipsT.productId = e.parameter.product_id;
      return tipsT.evaluate().setTitle('Tips連携').addMetaTag('viewport', 'width=device-width, initial-scale=1');
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
  return HtmlService.createTemplateFromFile(file)
    .evaluate()
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
