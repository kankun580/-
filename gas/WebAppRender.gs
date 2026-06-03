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
  Object.keys(placeholders).forEach(function (key) {
    html = html.split(key).join(placeholders[key]);
  });
  return html;
}

/**
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function renderReviewPage_() {
  var listHtml;
  try {
    listHtml = buildReviewListHtml_(getReviewWaitingProducts());
  } catch (err) {
    listHtml = '<p class="error">データ取得エラー: ' + escapeHtml_(err.message) + '</p>';
    writeErrorLog('renderReviewPage_', err.message, { stackTrace: err.stack || '' });
  }
  var html = renderHtmlFile_('Html/review', { '<!--REVIEW_LIST-->': listHtml });
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
  var href = '?page=detail&product_id=' + encodeURIComponent(String(p.product_id));
  var summary = String(p.review_summary || '');
  if (summary.length > 80) {
    summary = summary.substring(0, 80);
  }
  return (
    '<div class="card"><a href="' +
    escapeHtml_(href) +
    '">' +
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
  var html = renderHtmlFile_('Html/revision', { '<!--REVISION_LIST-->': listHtml });
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
    var href = '?page=detail&product_id=' + encodeURIComponent(String(p.product_id));
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
        '">詳細を見る</a>' +
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
    '<!--TIPS_PENDING-->': pendingHtml,
    '<!--TIPS_LINKED-->': linkedHtml,
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
    var href = '?page=tips_detail&product_id=' + encodeURIComponent(String(p.product_id));
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
        '">URLを登録 / 詳細</a></div>'
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
