/**
 * Tips 下書き連携（MCP ハンドオフ + 手動 URL 登録）
 * 公開・削除は行わない（仕様書どおり）
 */

var TIPS_HANDOFF_STATUSES = ['承認済み', 'Tips下書き作成待ち', 'Tips連携エラー'];

/**
 * Tips 連携待ちの商品一覧
 * @returns {Array<Object>}
 */
function getTipsPendingProducts() {
  var list = [];
  for (var i = 0; i < TIPS_HANDOFF_STATUSES.length; i++) {
    var products = getProductsByStatus(TIPS_HANDOFF_STATUSES[i]);
    for (var j = 0; j < products.length; j++) {
      var p = products[j];
      if (hasCompletedTipsLink_(p.product_id)) {
        continue;
      }
      list.push(enrichTipsListItem_(p));
    }
  }
  return list;
}

/**
 * Tips 下書き作成済み一覧
 * @returns {Array<Object>}
 */
function getTipsLinkedProducts() {
  var links = getAllTipsLinks_();
  var list = [];
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    if (!link.tips_draft_url && link.tips_status !== 'draft') {
      continue;
    }
    var product = getProductById(link.product_id);
    if (!product) {
      continue;
    }
    list.push({
      product_id: product.product_id,
      title: product.title,
      price_jpy: product.price_jpy,
      status: product.status,
      tips_id: link.tips_id,
      tips_draft_url: link.tips_draft_url,
      tips_public_url: link.tips_public_url,
      tips_status: link.tips_status,
    });
  }
  return list;
}

/**
 * Tips MCP / 手動貼り付け用のペイロード
 * @param {string} productId
 * @returns {Object}
 */
function buildTipsDraftPayload(productId) {
  var product = getProductById(productId);
  if (!product) {
    throw new Error('商品が見つかりません');
  }
  var draft = getLatestDraftByProductId(productId);
  if (!draft || !draft.full_doc_url) {
    throw new Error('Google Docs 下書きがありません');
  }

  var docId = getDocIdFromUrl_(draft.full_doc_url);
  var sections = readArticleSectionsFromDoc(docId);

  return {
    schema_version: '1',
    product_id: product.product_id,
    draft_id: draft.draft_id,
    title: product.title,
    product_type: product.product_type,
    price_jpy: product.price_jpy,
    risk_level: product.risk_level,
    target_reader: product.target_reader,
    free_part: sections.free_part,
    paid_part: sections.paid_part,
    cta: sections.cta || draft.cta_text || '',
    disclaimer: sections.disclaimer,
    google_docs_url: draft.full_doc_url,
    mcp_instructions:
      'Tipsで下書きのみ作成すること。公開・削除・価格変更は行わない。完了後 recordTipsDraftFromWebhook または管理画面で下書きURLを登録する。',
  };
}

/**
 * Drive の exports フォルダにハンドオフ JSON を保存
 * @param {string} productId
 * @returns {Object}
 */
function exportTipsHandoffJson(productId) {
  var payload = buildTipsDraftPayload(productId);
  var folderId = getConfigValue(CONFIG_KEYS.EXPORTS_FOLDER_ID);
  if (!folderId) {
    throw new Error('exports フォルダが未設定です。setupProject() を実行してください。');
  }

  var fileName = 'tips_handoff_' + productId + '_' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd-HHmmss') + '.json';
  var file = DriveApp.getFolderById(folderId).createFile(fileName, JSON.stringify(payload, null, 2), MimeType.PLAIN_TEXT);

  updateProductStatus(productId, 'Tips下書き作成待ち');
  writeOperationLog('system', 'exportTipsHandoffJson', {
    productId: productId,
    comment: file.getUrl(),
  });

  return { ok: true, file_url: file.getUrl(), file_name: fileName, payload: payload };
}

/**
 * Tips 下書き作成開始（MCP 実行前）
 * @param {string} productId
 * @returns {Object}
 */
function markTipsDraftCreating(productId) {
  var product = getProductById(productId);
  if (!product) {
    throw new Error('商品が見つかりません');
  }
  updateProductStatus(productId, 'Tips下書き作成中');
  return { ok: true, message: 'Tips下書き作成中に更新しました' };
}

/**
 * Tips 下書き URL を登録（スマホ手動 or Webhook）
 * @param {string} productId
 * @param {string} tipsDraftUrl
 * @param {string=} tipsId
 * @param {string=} tipsPublicUrl
 * @returns {Object}
 */
function recordTipsDraftLink(productId, tipsDraftUrl, tipsId, tipsPublicUrl) {
  if (!tipsDraftUrl) {
    throw new Error('Tips下書きURLが必要です');
  }
  validateTipsDraftUrl_(tipsDraftUrl);

  var product = getProductById(productId);
  if (!product) {
    throw new Error('商品が見つかりません');
  }
  var draft = getLatestDraftByProductId(productId);
  if (!draft) {
    throw new Error('下書きが見つかりません');
  }

  upsertTipsLink_({
    tips_id: tipsId || '',
    product_id: productId,
    draft_id: draft.draft_id,
    tips_draft_url: tipsDraftUrl,
    tips_public_url: tipsPublicUrl || '',
    tips_status: 'draft',
    error_message: '',
  });

  updateProductStatus(productId, '手動公開待ち');
  sendTipsDraftReadyEmail_(product, tipsDraftUrl);

  writeOperationLog('user', 'recordTipsDraftLink', {
    productId: productId,
    afterStatus: '手動公開待ち',
    comment: tipsDraftUrl,
  });

  return {
    ok: true,
    message: 'Tips下書きURLを登録しました。Tipsアプリで内容を確認し、手動で公開してください。',
    tips_draft_url: tipsDraftUrl,
  };
}

/**
 * Webhook 用（Cursor Agent + Tips MCP 完了時）
 * @param {Object} payload
 * @returns {Object}
 */
function recordTipsDraftFromWebhook(payload) {
  payload = payload || {};
  verifyTipsWebhookSecret_(payload.secret);

  var productId = payload.product_id;
  if (!productId) {
    throw new Error('product_id が必要です');
  }

  markTipsDraftCreating(productId);
  return recordTipsDraftLink(productId, payload.tips_draft_url, payload.tips_id, payload.tips_public_url);
}

/**
 * Tips 連携エラー記録
 * @param {string} productId
 * @param {string} errorMessage
 * @returns {Object}
 */
function recordTipsLinkError(productId, errorMessage) {
  var draft = getLatestDraftByProductId(productId);
  upsertTipsLink_({
    tips_id: '',
    product_id: productId,
    draft_id: draft ? draft.draft_id : '',
    tips_draft_url: '',
    tips_public_url: '',
    tips_status: 'error',
    error_message: errorMessage || '不明なエラー',
  });
  updateProductStatus(productId, 'Tips連携エラー');
  writeErrorLog('recordTipsLinkError', errorMessage, { productId: productId });
  sendTipsLinkErrorEmail_(getProductById(productId), errorMessage);
  return { ok: false, message: errorMessage };
}

/**
 * 承認時に Tips 連携待ちへ
 * @param {string} productId
 */
function queueProductForTipsHandoff_(productId) {
  updateProductStatus(productId, 'Tips下書き作成待ち');
  var product = getProductById(productId);
  if (product) {
    sendTipsHandoffQueuedEmail_(product);
  }
}

/**
 * @param {string} url
 */
function validateTipsDraftUrl_(url) {
  var u = String(url).trim();
  if (u.indexOf('http://') !== 0 && u.indexOf('https://') !== 0) {
    throw new Error('URL は https:// で始めてください');
  }
}

/**
 * @param {string} secret
 */
function verifyTipsWebhookSecret_(secret) {
  var expected = PropertiesService.getScriptProperties().getProperty('TIPS_WEBHOOK_SECRET') || '';
  if (!expected) {
    throw new Error('TIPS_WEBHOOK_SECRET が未設定です。completeSetupFromWeb 後に再実行するか Script Properties を設定してください');
  }
  if (String(secret) !== expected) {
    throw new Error('Webhook シークレットが不正です');
  }
}

/**
 * Webhook シークレットを生成・保存
 * @returns {Object}
 */
function ensureTipsWebhookSecret() {
  var props = PropertiesService.getScriptProperties();
  var existing = props.getProperty('TIPS_WEBHOOK_SECRET');
  if (existing) {
    return { ok: true, secret: existing, created: false };
  }
  var secret = Utilities.getUuid() + Utilities.getUuid();
  props.setProperty('TIPS_WEBHOOK_SECRET', secret);
  return { ok: true, secret: secret, created: true };
}

/**
 * @param {Object} p
 * @returns {Object}
 */
function enrichTipsListItem_(p) {
  var draft = getLatestDraftByProductId(p.product_id);
  var link = getTipsLinkByProductId_(p.product_id);
  return {
    product_id: p.product_id,
    title: p.title,
    price_jpy: p.price_jpy,
    risk_level: p.risk_level,
    status: p.status,
    doc_url: draft ? draft.full_doc_url : '',
    tips_error: link ? link.error_message : '',
  };
}

/**
 * @param {string} productId
 * @returns {boolean}
 */
function hasCompletedTipsLink_(productId) {
  var link = getTipsLinkByProductId_(productId);
  return !!(link && link.tips_draft_url && link.tips_status === 'draft');
}

/**
 * @param {Object} link
 */
function upsertTipsLink_(link) {
  var ss = getManagementSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.TIPS_LINKS);
  if (!sheet) {
    throw new Error('tips_links シートがありません');
  }
  var now = formatTimestamp_(new Date());
  var row = findTipsLinkRow_(sheet, link.product_id);
  var rowData = [
    link.tips_id || '',
    link.product_id,
    link.draft_id || '',
    link.tips_draft_url || '',
    link.tips_public_url || '',
    link.tips_status || 'draft',
    now,
    link.error_message || '',
  ];
  if (row > 0) {
    sheet.getRange(row, 1, row, 8).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

/**
 * @param {string} productId
 * @returns {Object|null}
 */
function getTipsLinkByProductId_(productId) {
  var ss = getManagementSpreadsheet();
  if (!ss) {
    return null;
  }
  var sheet = ss.getSheetByName(SHEET_NAMES.TIPS_LINKS);
  if (!sheet || sheet.getLastRow() < 2) {
    return null;
  }
  var lastRow = sheet.getLastRow();
  var data = sheet.getRange(2, 1, lastRow, 8).getValues();
  for (var i = data.length - 1; i >= 0; i--) {
    if (String(data[i][1]) === productId) {
      return {
        tips_id: String(data[i][0]),
        product_id: String(data[i][1]),
        draft_id: String(data[i][2]),
        tips_draft_url: String(data[i][3]),
        tips_public_url: String(data[i][4]),
        tips_status: String(data[i][5]),
        last_synced_at: String(data[i][6]),
        error_message: String(data[i][7]),
      };
    }
  }
  return null;
}

/**
 * @returns {Array<Object>}
 */
function getAllTipsLinks_() {
  var ss = getManagementSpreadsheet();
  if (!ss) {
    return [];
  }
  var sheet = ss.getSheetByName(SHEET_NAMES.TIPS_LINKS);
  if (!sheet || sheet.getLastRow() < 2) {
    return [];
  }
  var lastRow = sheet.getLastRow();
  var data = sheet.getRange(2, 1, lastRow, 8).getValues();
  var list = [];
  for (var i = 0; i < data.length; i++) {
    list.push({
      tips_id: String(data[i][0]),
      product_id: String(data[i][1]),
      draft_id: String(data[i][2]),
      tips_draft_url: String(data[i][3]),
      tips_public_url: String(data[i][4]),
      tips_status: String(data[i][5]),
      last_synced_at: String(data[i][6]),
      error_message: String(data[i][7]),
    });
  }
  return list;
}

/**
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {string} productId
 * @returns {number}
 */
function findTipsLinkRow_(sheet, productId) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return 0;
  }
  var ids = sheet.getRange(2, 2, lastRow, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === productId) {
      return i + 2;
    }
  }
  return 0;
}
