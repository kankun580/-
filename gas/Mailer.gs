/**
 * Gmail 通知
 */

/**
 * @param {Object} product
 * @param {string} docUrl
 * @param {string} reviewSummary
 */
function sendReviewNotificationEmail_(product, docUrl, reviewSummary) {
  var email = getConfigValue(CONFIG_KEYS.REVIEW_EMAIL) || Session.getActiveUser().getEmail();
  if (!email) {
    return;
  }
  var webAppUrl = getLatestWebAppUrl_();
  var subject = '【レビュー待ち】' + product.title;
  var body =
    '新しいTips商品下書きが生成されました。\n\n' +
    'タイトル: ' +
    product.title +
    '\n' +
    '価格: ' +
    product.price_jpy +
    '円\n' +
    'リスク: ' +
    product.risk_level +
    '\n\n' +
    'AIレビュー:\n' +
    (reviewSummary || '') +
    '\n\n' +
    'Google Docs:\n' +
    docUrl +
    '\n\n' +
    'スマホ管理画面:\n' +
    (webAppUrl || '（WebアプリURL未設定）') +
    '\n?page=review\n';

  try {
    MailApp.sendEmail(email, subject, body);
  } catch (e) {
    writeErrorLog('sendReviewNotificationEmail_', e.message, { productId: product.product_id });
  }
}

/**
 * @returns {string}
 */
function getLatestWebAppUrl_() {
  var fromProps = PropertiesService.getScriptProperties().getProperty('WEB_APP_URL');
  if (fromProps) {
    return fromProps;
  }
  return getConfigValue('WEB_APP_URL') || '';
}

/**
 * WebアプリURLを Script Properties に保存
 * @param {string} url
 */
function saveWebAppUrl(url) {
  PropertiesService.getScriptProperties().setProperty('WEB_APP_URL', url);
  var ss = getManagementSpreadsheet();
  if (ss) {
    setConfigValueOnSheet_(ss, 'WEB_APP_URL', url, '管理画面URL', true);
  }
  return { ok: true, url: url };
}
