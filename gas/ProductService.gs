/**
 * products / drafts / reviews シート操作
 */

var PRODUCT_COL = {
  ID: 1,
  TYPE: 2,
  TITLE: 3,
  TARGET: 4,
  PROBLEM: 5,
  PROMISE: 6,
  PRICE: 7,
  RISK: 8,
  STATUS: 9,
  CREATED: 10,
  UPDATED: 11,
};

/**
 * @param {string} status
 * @returns {Array<Object>}
 */
function getProductsByStatus(status) {
  var sheet = getProductsSheet_();
  if (!sheet || sheet.getLastRow() < 2) {
    return [];
  }
  var lastRow = sheet.getLastRow();
  var data = sheet.getRange(2, 1, lastRow, 11).getValues();
  var list = [];
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][PRODUCT_COL.STATUS - 1]) === status) {
      list.push(rowToProduct_(data[i]));
    }
  }
  return list;
}

/**
 * @param {string} productId
 * @returns {Object|null}
 */
function getProductById(productId) {
  var sheet = getProductsSheet_();
  if (!sheet || sheet.getLastRow() < 2) {
    return null;
  }
  var lastRow = sheet.getLastRow();
  var data = sheet.getRange(2, 1, lastRow, 11).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]) === productId) {
      return rowToProduct_(data[i]);
    }
  }
  return null;
}

/**
 * @param {string} productId
 * @param {string} newStatus
 * @param {string=} comment
 */
function updateProductStatus(productId, newStatus, comment) {
  var sheet = getProductsSheet_();
  var product = getProductById(productId);
  if (!product) {
    throw new Error('商品が見つかりません: ' + productId);
  }
  var row = findProductRow_(sheet, productId);
  var before = product.status;
  sheet.getRange(row, PRODUCT_COL.STATUS).setValue(newStatus);
  sheet.getRange(row, PRODUCT_COL.UPDATED).setValue(formatTimestamp_(new Date()));
  writeOperationLog('user', 'updateProductStatus', {
    productId: productId,
    beforeStatus: before,
    afterStatus: newStatus,
    comment: comment || '',
  });
}

/**
 * @param {Object} product
 */
function appendProduct(product) {
  var sheet = getProductsSheet_();
  var now = formatTimestamp_(new Date());
  sheet.appendRow([
    product.product_id,
    product.product_type,
    product.title,
    product.target_reader,
    product.problem,
    product.promise,
    product.price_jpy,
    product.risk_level,
    product.status || '未着手',
    product.created_at || now,
    product.updated_at || now,
  ]);
}

/**
 * @param {Object} draft
 */
function appendDraft(draft) {
  appendSheetRow(SHEET_NAMES.DRAFTS, [
    draft.draft_id,
    draft.product_id,
    draft.free_doc_url || '',
    draft.paid_doc_url || '',
    draft.full_doc_url || '',
    draft.cta_text || '',
    draft.generation_model || '',
    draft.generation_status || '',
    draft.approved_by_user || '未確認',
    draft.approval_comment || '',
  ]);
}

/**
 * @param {Object} review
 */
function appendReview(review) {
  appendSheetRow(SHEET_NAMES.REVIEWS, [
    review.review_id,
    review.draft_id,
    review.legal_risk || '',
    review.ad_risk || '',
    review.fabrication_risk || '',
    review.anxiety_risk || '',
    review.value_score || '',
    review.readability_score || '',
    review.recommendation || '',
    review.review_summary || '',
  ]);
}

/**
 * @param {string} productId
 * @returns {Object|null}
 */
function getLatestDraftByProductId(productId) {
  var ss = getManagementSpreadsheet();
  if (!ss) {
    return null;
  }
  var sheet = ss.getSheetByName(SHEET_NAMES.DRAFTS);
  if (!sheet || sheet.getLastRow() < 2) {
    return null;
  }
  var lastRow = sheet.getLastRow();
  var data = sheet.getRange(2, 1, lastRow, 10).getValues();
  var found = null;
  for (var i = data.length - 1; i >= 0; i--) {
    if (String(data[i][1]) === productId) {
      found = {
        draft_id: String(data[i][0]),
        product_id: String(data[i][1]),
        free_doc_url: String(data[i][2]),
        paid_doc_url: String(data[i][3]),
        full_doc_url: String(data[i][4]),
        cta_text: String(data[i][5]),
        generation_model: String(data[i][6]),
        approved_by_user: String(data[i][8]),
        approval_comment: String(data[i][9]),
      };
      break;
    }
  }
  return found;
}

/**
 * @param {string} productId
 * @param {string} field approved_by_user | approval_comment | generation_model
 * @param {string} value
 */
function updateDraftField(productId, field, value) {
  var ss = getManagementSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.DRAFTS);
  var lastRow = sheet.getLastRow();
  var colMap = {
    generation_model: 7,
    generation_status: 8,
    approved_by_user: 9,
    approval_comment: 10,
  };
  var col = colMap[field];
  if (!col) {
    throw new Error('不明なフィールド: ' + field);
  }
  for (var r = lastRow; r >= 2; r--) {
    if (String(sheet.getRange(r, 2).getValue()) === productId) {
      sheet.getRange(r, col).setValue(value);
      return;
    }
  }
}

/**
 * @returns {number}
 */
function countGeneratedToday_() {
  var sheet = getProductsSheet_();
  if (!sheet || sheet.getLastRow() < 2) {
    return 0;
  }
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  var lastRow = sheet.getLastRow();
  var updated = sheet.getRange(2, PRODUCT_COL.UPDATED, lastRow, 1).getValues();
  var statusCol = sheet.getRange(2, PRODUCT_COL.STATUS, lastRow, 1).getValues();
  var count = 0;
  for (var i = 0; i < updated.length; i++) {
    var u = String(updated[i][0]);
    if (u.indexOf(today) === 0 && String(statusCol[i][0]) !== '未着手') {
      count++;
    }
  }
  return count;
}

/**
 * @param {Array<*>} row
 * @returns {Object}
 */
function rowToProduct_(row) {
  return {
    product_id: String(row[0]),
    product_type: String(row[1]),
    title: String(row[2]),
    target_reader: String(row[3]),
    problem: String(row[4]),
    promise: String(row[5]),
    price_jpy: row[6],
    risk_level: String(row[7]),
    status: String(row[8]),
    created_at: String(row[9]),
    updated_at: String(row[10]),
  };
}

/**
 * @returns {GoogleAppsScript.Spreadsheet.Sheet|null}
 */
function getProductsSheet_() {
  var ss = getManagementSpreadsheet();
  return ss ? ss.getSheetByName(SHEET_NAMES.PRODUCTS) : null;
}

/**
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {string} productId
 * @returns {number}
 */
function findProductRow_(sheet, productId) {
  var lastRow = sheet.getLastRow();
  var ids = sheet.getRange(2, 1, lastRow, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === productId) {
      return i + 2;
    }
  }
  throw new Error('行が見つかりません: ' + productId);
}
