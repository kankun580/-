/**
 * スマホ Web アプリ API（google.script.run 用）
 */

/**
 * @returns {Array<Object>}
 */
function getReviewWaitingProducts() {
  var products = getProductsByStatus('レビュー待ち');
  var list = [];
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    var draft = getLatestDraftByProductId(p.product_id);
    list.push({
      product_id: p.product_id,
      title: p.title,
      product_type: p.product_type,
      price_jpy: p.price_jpy,
      risk_level: p.risk_level,
      status: p.status,
      review_summary: draft ? getReviewSummaryForDraft_(draft.draft_id) : '',
      doc_url: draft ? draft.full_doc_url : '',
    });
  }
  return list;
}

/**
 * @param {string} draftId
 * @returns {string}
 */
function getReviewSummaryForDraft_(draftId) {
  var ss = getManagementSpreadsheet();
  if (!ss) {
    return '';
  }
  var sheet = ss.getSheetByName(SHEET_NAMES.REVIEWS);
  if (!sheet || sheet.getLastRow() < 2) {
    return '';
  }
  var lastRow = sheet.getLastRow();
  var data = sheet.getRange(2, 1, lastRow, 10).getValues();
  for (var i = data.length - 1; i >= 0; i--) {
    if (String(data[i][1]) === draftId) {
      return String(data[i][9]);
    }
  }
  return '';
}

/**
 * @param {string} productId
 * @returns {Object}
 */
function getProductDetailForWeb(productId) {
  var product = getProductById(productId);
  if (!product) {
    throw new Error('商品が見つかりません');
  }
  var draft = getLatestDraftByProductId(productId);
  var reviewSummary = '';
  if (draft) {
    reviewSummary = getReviewSummaryForDraft_(draft.draft_id);
  }
  return {
    product: product,
    draft: draft,
    review_summary: reviewSummary,
    free_preview: '（Docsで全文を確認してください）',
    paid_preview: '（Docsで全文を確認してください）',
  };
}

/**
 * @param {string} productId
 * @returns {Object}
 */
function approveProduct(productId) {
  updateProductStatus(productId, '承認済み');
  updateDraftField(productId, 'approved_by_user', '承認');
  return { ok: true, message: '承認しました' };
}

/**
 * @param {string} productId
 * @param {string} comment
 * @returns {Object}
 */
function requestRevision(productId, comment) {
  updateProductStatus(productId, '修正待ち');
  updateDraftField(productId, 'approved_by_user', '修正');
  updateDraftField(productId, 'approval_comment', comment || '');
  return { ok: true, message: '修正依頼を記録しました' };
}

/**
 * @param {string} productId
 * @returns {Object}
 */
function holdProduct(productId) {
  updateProductStatus(productId, '保留');
  updateDraftField(productId, 'approved_by_user', '保留');
  return { ok: true, message: '保留にしました' };
}

/**
 * @param {string} productId
 * @returns {Object}
 */
function stopProduct(productId) {
  updateProductStatus(productId, '停止');
  updateDraftField(productId, 'approved_by_user', '停止');
  return { ok: true, message: '停止にしました' };
}
