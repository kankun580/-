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
      return htmlPage_(injectSharedStyles_(tipsT.evaluate().getContent()), 'Tips連携');
    }
    if (page === 'detail' && e.parameter.product_id) {
      var t = HtmlService.createTemplateFromFile('Html/detail');
      t.productId = e.parameter.product_id;
      return htmlPage_(injectSharedStyles_(t.evaluate().getContent()), '記事詳細');
    }

    var template = HtmlService.createTemplateFromFile('Html/index');
    template.status = getProjectStatus();
    return htmlPage_(injectSharedStyles_(template.evaluate().getContent()), 'Tips AI 管理');
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
  var html = injectSharedStyles_(HtmlService.createHtmlOutputFromFile(file).getContent());
  return htmlPage_(html, title);
}

/**
 * 共通 CSS を head 内に挿入（テンプレート評価を避ける静的 HTML 用）
 * @param {string} html
 * @returns {string}
 */
function injectSharedStyles_(html) {
  var styles = include('Html/shared_styles');
  if (html.indexOf('</head>') >= 0) {
    return html.replace('</head>', styles + '</head>');
  }
  return styles + html;
}

/**
 * @param {string} html
 * @param {string} title
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function htmlPage_(html, title) {
  return HtmlService.createHtmlOutput(html)
    .setTitle(title)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
