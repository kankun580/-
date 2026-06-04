/**
 * スマホ Web アプリ API（google.script.run 用）
 */

/**
 * Gemini 疎通テスト（権限付与の再認証にも使う）
 * @returns {Object}
 */
function runGeminiTestFromWeb() {
  return testGeminiConnection();
}

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
  if (lastRow < 2) {
    return '';
  }
  var numRows = lastRow - 1;
  var data = sheet.getRange(2, 1, numRows, 10).getValues();
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
function getRevisionWaitingProducts() {
  var products = getProductsByStatus('修正待ち');
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
      approval_comment: draft ? draft.approval_comment : '',
      doc_url: draft ? draft.full_doc_url : '',
    });
  }
  return list;
}

function getProductDetailForWeb(productId) {
  var product = getProductById(productId);
  if (!product) {
    throw new Error('商品が見つかりません');
  }
  var draft = getLatestDraftByProductId(productId);
  var reviewSummary = '';
  var freePreview = '';
  var paidPreview = '';
  if (draft) {
    reviewSummary = getReviewSummaryForDraft_(draft.draft_id);
    if (draft.full_doc_url) {
      try {
        var docId = getDocIdFromUrl_(draft.full_doc_url);
        var previews = extractPreviewFromDocText_(readDraftDocumentText(docId));
        freePreview = previews.free_preview;
        paidPreview = previews.paid_preview;
      } catch (e) {
        freePreview = '（プレビュー取得エラー）';
        paidPreview = '';
      }
    }
  }
  var tipsLink = null;
  try {
    tipsLink = getTipsLinkByProductId_(productId);
  } catch (e) {
    tipsLink = null;
  }
  return {
    product: product,
    draft: draft,
    tips_link: tipsLink,
    review_summary: reviewSummary,
    free_preview: freePreview || '（Docsで全文を確認してください）',
    paid_preview: paidPreview || '（Docsで全文を確認してください）',
  };
}

/**
 * @param {string} productId
 * @returns {Object}
 */
function approveProduct(productId) {
  updateDraftField(productId, 'approved_by_user', '承認');
  queueProductForTipsHandoff_(productId);
  return {
    ok: true,
    message: '承認しました。Tips連携画面で下書きURLを登録するか、Cursor Agent に Tips MCP 作成を依頼してください',
  };
}

/**
 * @param {string} productId
 * @returns {Object}
 */
function getTipsDraftPayloadForWeb(productId) {
  return buildTipsDraftPayload(productId);
}

/**
 * @param {string} productId
 * @param {string} tipsDraftUrl
 * @param {string=} tipsId
 * @returns {Object}
 */
function saveTipsDraftUrlFromWeb(productId, tipsDraftUrl, tipsId) {
  return recordTipsDraftLink(productId, tipsDraftUrl, tipsId || '');
}

/**
 * @param {string} productId
 * @returns {Object}
 */
function exportTipsHandoffFromWeb(productId) {
  return exportTipsHandoffJson(productId);
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
  return {
    ok: true,
    message: '修正依頼を記録しました。修正待ち一覧から「AI再生成」を実行してください',
  };
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
