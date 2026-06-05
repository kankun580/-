/**
 * Web アプリ HTML のサーバー側レンダリング（google.script.run 非依存）
 */

var SHARED_STYLES_HTML_ =
  '<style>' +
  '*,*::before,*::after{box-sizing:border-box;}' +
  'html{-webkit-text-size-adjust:100%;overflow-x:hidden;}' +
  'body{overflow-x:hidden;max-width:100%;}' +
  '.btn,input,textarea,select,.card{max-width:100%;}' +
  '</style>';

/**
 * @param {string} html
 * @returns {string}
 */
function injectSharedStyles_(html) {
  if (html.indexOf('</head>') >= 0) {
    return html.replace('</head>', SHARED_STYLES_HTML_ + '</head>');
  }
  return SHARED_STYLES_HTML_ + html;
}

/**
 * @param {string} file
 * @param {Object<string, string>} placeholders
 * @returns {string}
 */
function renderHtmlFile_(file, placeholders) {
  var html = HtmlService.createHtmlOutputFromFile(file).getContent();
  html = html.split('{{WEBAPP_URL}}').join(getWebAppUrl_());
  Object.keys(placeholders).forEach(function (key) {
    html = html.split(key).join(placeholders[key]);
  });
  return html;
}

var PAGE_LIST_CSS_ =
  'body{font-family:-apple-system,sans-serif;margin:0;padding:16px;background:#f5f5f5;}' +
  'h1{font-size:1.2rem;}.card{background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,.08);}' +
  '.card a{text-decoration:none;color:inherit;display:block;}.meta{font-size:13px;color:#666;margin-top:6px;}' +
  '.risk-high{color:#c33;}.risk-medium{color:#e37400;}.risk-low{color:#0a7;}' +
  '.back{display:inline-block;margin-bottom:12px;color:#1a73e8;}.error{color:#c33;font-size:14px;}';

/**
 * 一覧ページの HTML を直接組み立て（Html ファイルのコメント消失を回避）
 * @param {string} title
 * @param {string} listHtml
 * @returns {string}
 */
function buildListPageHtml_(title, listHtml) {
  var homeUrl = buildPageUrl_('home');
  return (
    '<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    '<style>' +
    PAGE_LIST_CSS_ +
    '</style></head><body>' +
    '<a class="back" href="' +
    escapeHtml_(homeUrl) +
    '" target="_top">← ホーム</a>' +
    '<h1>' +
    escapeHtml_(title) +
    '</h1>' +
    '<div id="list">' +
    listHtml +
    '</div></body></html>'
  );
}

/**
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function renderReviewPage_() {
  var listHtml;
  var count = 0;
  try {
    try {
      sanitizeReviewWaitingDocs_();
    } catch (sanitizeErr) {
      writeErrorLog('renderReviewPage_sanitize', sanitizeErr.message, {});
    }
    var items = getReviewWaitingProducts();
    count = items.length;
    listHtml = buildReviewListHtml_(items);
  } catch (err) {
    listHtml = '<p class="error">データ取得エラー: ' + escapeHtml_(err.message) + '</p>';
    writeErrorLog('renderReviewPage_', err.message, { stackTrace: err.stack || '' });
  }
  if (count > 0 && listHtml.indexOf('card') < 0 && listHtml.indexOf('error') < 0) {
    listHtml = '<p class="error">一覧の表示に失敗しました（データ ' + count + ' 件）</p>';
  }
  var html = buildListPageHtml_('レビュー待ち', listHtml);
  return htmlPage_(injectSharedStyles_(html), 'レビュー待ち');
}

/**
 * @param {Array<Object>} items
 * @returns {string}
 */
function buildReviewListHtml_(items) {
  if (!items || !items.length) {
    return '<p>レビュー待ちはありません。</p>';
  }
  var parts = [];
  for (var i = 0; i < items.length; i++) {
    parts.push(buildReviewCardHtml_(items[i]));
  }
  return parts.join('');
}

/**
 * @param {Object} p
 * @returns {string}
 */
function buildReviewCardHtml_(p) {
  var riskClass = 'risk-low';
  if (p.risk_level === 'high') {
    riskClass = 'risk-high';
  } else if (p.risk_level === 'medium') {
    riskClass = 'risk-medium';
  }
  var href = buildPageUrl_('detail', { product_id: String(p.product_id) });
  var summary = String(p.review_summary || '');
  if (summary.length > 80) {
    summary = summary.substring(0, 80);
  }
  return (
    '<div class="card"><a href="' +
    escapeHtml_(href) +
    '" target="_top">' +
    '<strong>' +
    escapeHtml_(p.title) +
    '</strong>' +
    '<div class="meta">' +
    escapeHtml_(p.product_type) +
    ' · ' +
    escapeHtml_(String(p.price_jpy)) +
    '円 · <span class="' +
    riskClass +
    '">' +
    escapeHtml_(p.risk_level) +
    '</span></div>' +
    '<div class="meta">' +
    escapeHtml_(summary) +
    '</div></a></div>'
  );
}

/**
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function renderRevisionPage_() {
  var listHtml;
  try {
    listHtml = buildRevisionListHtml_(getRevisionWaitingProducts());
  } catch (err) {
    listHtml = '<p class="error">データ取得エラー: ' + escapeHtml_(err.message) + '</p>';
  }
  var html = renderHtmlFile_('Html/revision', { '{{REVISION_LIST}}': listHtml });
  return htmlPage_(injectSharedStyles_(html), '修正待ち');
}

/**
 * @param {Array<Object>} items
 * @returns {string}
 */
function buildRevisionListHtml_(items) {
  if (!items || !items.length) {
    return '<p>修正待ちはありません。</p>';
  }
  var parts = [];
  for (var i = 0; i < items.length; i++) {
    var p = items[i];
    var href = buildPageUrl_('detail', { product_id: String(p.product_id) });
    parts.push(
      '<div class="card"><strong>' +
        escapeHtml_(p.title) +
        '</strong>' +
        '<div class="meta">' +
        escapeHtml_(p.product_type) +
        ' · ' +
        escapeHtml_(String(p.price_jpy)) +
        '円</div>' +
        (p.approval_comment
          ? '<div class="comment">' + escapeHtml_(p.approval_comment) + '</div>'
          : '') +
        '<a class="btn link" href="' +
        escapeHtml_(href) +
        '" target="_top">詳細を見る</a>' +
        '<button type="button" class="btn" data-pid="' +
        escapeHtml_(String(p.product_id)) +
        '" onclick="regen(this.getAttribute(\'data-pid\'))">この商品を AI 再生成</button></div>'
    );
  }
  return parts.join('');
}

/**
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function renderTipsPage_() {
  var pendingHtml;
  var linkedHtml;
  try {
    pendingHtml = buildTipsPendingListHtml_(getTipsPendingProducts());
    linkedHtml = buildTipsLinkedListHtml_(getTipsLinkedProducts());
  } catch (err) {
    pendingHtml = '<p class="error">' + escapeHtml_(err.message) + '</p>';
    linkedHtml = '';
  }
  var html = renderHtmlFile_('Html/tips', {
    '{{TIPS_PENDING}}': pendingHtml,
    '{{TIPS_LINKED}}': linkedHtml,
  });
  return htmlPage_(injectSharedStyles_(html), 'Tips連携');
}

/**
 * @param {Array<Object>} items
 * @returns {string}
 */
function buildTipsPendingListHtml_(items) {
  if (!items || !items.length) {
    return '<p>連携待ちはありません。</p>';
  }
  var parts = [];
  for (var i = 0; i < items.length; i++) {
    var p = items[i];
    var href = buildPageUrl_('tips_detail', { product_id: String(p.product_id) });
    parts.push(
      '<div class="card"><strong>' +
        escapeHtml_(p.title) +
        '</strong>' +
        '<div class="meta">' +
        escapeHtml_(String(p.price_jpy)) +
        '円 · ' +
        escapeHtml_(p.status) +
        '</div>' +
        (p.tips_error ? '<div class="err">' + escapeHtml_(p.tips_error) + '</div>' : '') +
        '<a class="btn" href="' +
        escapeHtml_(href) +
        '" target="_top">URLを登録 / 詳細</a></div>'
    );
  }
  return parts.join('');
}

/**
 * @param {Array<Object>} items
 * @returns {string}
 */
function buildTipsLinkedListHtml_(items) {
  if (!items || !items.length) {
    return '<p>まだ登録がありません。</p>';
  }
  var parts = [];
  for (var i = 0; i < items.length; i++) {
    var p = items[i];
    parts.push(
      '<div class="card"><strong>' +
        escapeHtml_(p.title) +
        '</strong>' +
        '<div class="meta">' +
        escapeHtml_(p.status) +
        '</div>' +
        (p.tips_draft_url
          ? '<a href="' + escapeHtml_(p.tips_draft_url) + '" target="_blank" rel="noopener">Tips下書きを開く</a>'
          : '') +
        '</div>'
    );
  }
  return parts.join('');
}
