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
/**
 * @param {Object} product
 */
function sendTipsHandoffQueuedEmail_(product) {
  var email = getConfigValue(CONFIG_KEYS.REVIEW_EMAIL) || Session.getActiveUser().getEmail();
  if (!email || !product) {
    return;
  }
  var webAppUrl = getLatestWebAppUrl_();
  var body =
    '承認済みの商品が Tips 下書き連携待ちになりました。\n\n' +
    'タイトル: ' +
    product.title +
    '\n価格: ' +
    product.price_jpy +
    '円\n\n' +
    '次のいずれか:\n' +
    '1. 管理画面の「Tips連携」から下書きURLを登録\n' +
    '2. Cursor Agent に Tips MCP で下書き作成を依頼\n\n' +
    (webAppUrl ? webAppUrl + '?page=tips\n' : '');
  try {
    MailApp.sendEmail(email, '【Tips連携待ち】' + product.title, body);
  } catch (e) {
    writeErrorLog('sendTipsHandoffQueuedEmail_', e.message, { productId: product.product_id });
  }
}

/**
 * @param {Object} product
 * @param {string} tipsDraftUrl
 */
function sendTipsDraftReadyEmail_(product, tipsDraftUrl) {
  var email = getConfigValue(CONFIG_KEYS.REVIEW_EMAIL) || Session.getActiveUser().getEmail();
  if (!email || !product) {
    return;
  }
  var body =
    'Tips下書きURLが登録されました。Tipsアプリで内容を確認し、手動で公開してください。\n\n' +
    'タイトル: ' +
    product.title +
    '\n\nTips下書き:\n' +
    tipsDraftUrl +
    '\n\n※自動公開は行っていません。';
  try {
    MailApp.sendEmail(email, '【Tips下書き作成済】' + product.title, body);
  } catch (e) {
    writeErrorLog('sendTipsDraftReadyEmail_', e.message, { productId: product.product_id });
  }
}

/**
 * @param {Object|null} product
 * @param {string} errorMessage
 */
function sendTipsLinkErrorEmail_(product, errorMessage) {
  var email = getConfigValue(CONFIG_KEYS.REVIEW_EMAIL) || Session.getActiveUser().getEmail();
  if (!email) {
    return;
  }
  var title = product ? product.title : '（商品不明）';
  try {
    MailApp.sendEmail(email, '【Tips連携エラー】' + title, errorMessage || 'エラー');
  } catch (e) {
    writeErrorLog('sendTipsLinkErrorEmail_', e.message, {});
  }
}

function saveWebAppUrl(url) {
  PropertiesService.getScriptProperties().setProperty('WEB_APP_URL', url);
  var ss = getManagementSpreadsheet();
  if (ss) {
    setConfigValueOnSheet_(ss, 'WEB_APP_URL', url, '管理画面URL', true);
  }
  return { ok: true, url: url };
}
