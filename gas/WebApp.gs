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
  ensureWebAppUrlSaved_();

  try {
    if (page === 'ping') {
      return ContentService.createTextOutput('pong build=' + getWebAppUrl_()).setMimeType(
        ContentService.MimeType.TEXT
      );
    }
    if (page === 'setup') {
      return pageHtml_('Html/setup', '初回セットアップ');
    }
    if (page === 'review') {
      return renderReviewPage_();
    }
    if (page === 'revision') {
      return renderRevisionPage_();
    }
    if (page === 'tips') {
      return renderTipsPage_();
    }
    if (page === 'tips_detail' && e.parameter.product_id) {
      var tipsT = HtmlService.createTemplateFromFile('Html/tips_detail');
      tipsT.productId = e.parameter.product_id;
      tipsT.webAppUrl = getWebAppUrl_();
      return htmlPage_(injectSharedStyles_(tipsT.evaluate().getContent()), 'Tips連携');
    }
    if (page === 'detail' && e.parameter.product_id) {
      var t = HtmlService.createTemplateFromFile('Html/detail');
      t.productId = e.parameter.product_id;
      t.webAppUrl = getWebAppUrl_();
      return htmlPage_(injectSharedStyles_(t.evaluate().getContent()), '記事詳細');
    }

    var template = HtmlService.createTemplateFromFile('Html/index');
    template.status = getProjectStatus();
    template.webAppUrl = getWebAppUrl_();
    template.authStatus = getAuthStatusForWeb();
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
 * @param {string} html
 * @param {string} title
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function htmlPage_(html, title) {
  return HtmlService.createHtmlOutput(html)
    .setTitle(title)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
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

/**
 * デプロイ済み Web アプリの exec URL（userCodeAppPanel ではなくこちらを使う）
 * @returns {string}
 */
function getWebAppUrl_() {
  try {
    var live = ScriptApp.getService().getUrl();
    if (live) {
      return String(live).replace(/\/$/, '');
    }
  } catch (e) {
    /* 未デプロイ時 */
  }
  return String(getLatestWebAppUrl_() || '').replace(/\/$/, '');
}

/**
 * @param {string} page
 * @param {Object<string, string>=} params
 * @returns {string}
 */
function buildPageUrl_(page, params) {
  params = params || {};
  var parts = ['page=' + encodeURIComponent(page)];
  Object.keys(params).forEach(function (key) {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(params[key])));
    }
  });
  var qs = parts.join('&');
  var base = getWebAppUrl_();
  return base ? base + '?' + qs : '?' + qs;
}

function ensureWebAppUrlSaved_() {
  try {
    var url = ScriptApp.getService().getUrl();
    if (url) {
      PropertiesService.getScriptProperties().setProperty('WEB_APP_URL', url);
    }
  } catch (e) {
    /* ignore */
  }
}
