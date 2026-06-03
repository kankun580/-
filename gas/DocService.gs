/**
 * Google Docs 下書き保存
 */

/**
 * @param {string} title
 * @param {Object} content
 * @returns {{ fullUrl: string, fullId: string }}
 */
function createDraftDocument(title, content) {
  var folderId = getConfigValue(CONFIG_KEYS.DRAFTS_FOLDER_ID);
  var doc = DocumentApp.create(title);
  var body = doc.getBody();
  body.appendParagraph(content.title || title).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  if (content.subtitle) {
    body.appendParagraph(content.subtitle);
  }
  body.appendParagraph('--- 無料部分 ---').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(content.free_part || '');
  body.appendParagraph('--- 有料部分 ---').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(content.paid_part || '');
  if (content.cta) {
    body.appendParagraph('--- CTA ---').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(content.cta);
  }
  if (content.disclaimer) {
    body.appendParagraph('--- 注意書き ---').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(content.disclaimer);
  }
  body.appendParagraph('--- AIセルフレビュー ---').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(content.review_summary || '');
  doc.saveAndClose();

  var file = DriveApp.getFileById(doc.getId());
  if (folderId) {
    DriveApp.getFolderById(folderId).addFile(file);
    try {
      DriveApp.getRootFolder().removeFile(file);
    } catch (e) {
      /* 既に移動済み */
    }
  }
  return { fullUrl: doc.getUrl(), fullId: doc.getId() };
}

/**
 * Docs URL からファイル ID を取得
 * @param {string} url
 * @returns {string}
 */
function getDocIdFromUrl_(url) {
  var match = String(url).match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) {
    throw new Error('Docs URL が不正です');
  }
  return match[1];
}

/**
 * ドキュメント全文を取得
 * @param {string} docId
 * @returns {string}
 */
function readDraftDocumentText(docId) {
  var doc = DocumentApp.openById(docId);
  return doc.getBody().getText();
}

/**
 * 本文から無料・有料プレビューを抽出（最新バージョン優先）
 * @param {string} text
 * @param {number=} maxLen
 * @returns {{ free_preview: string, paid_preview: string }}
 */
function extractPreviewFromDocText_(text, maxLen) {
  maxLen = maxLen || 400;
  var body = String(text);
  var versionParts = body.split(/--- v\d+ 修正版 ---/);
  if (versionParts.length > 1) {
    body = versionParts[versionParts.length - 1];
  }
  return {
    free_preview: truncatePreview_(extractSection_(body, '--- 無料部分 ---', '--- 有料部分 ---'), maxLen),
    paid_preview: truncatePreview_(extractSection_(body, '--- 有料部分 ---', '--- CTA ---'), maxLen),
  };
}

/**
 * @param {string} body
 * @param {string} startMarker
 * @param {string} endMarker
 * @returns {string}
 */
function extractSection_(body, startMarker, endMarker) {
  var start = body.indexOf(startMarker);
  if (start < 0) {
    return '';
  }
  start += startMarker.length;
  var end = body.indexOf(endMarker, start);
  var section = end < 0 ? body.substring(start) : body.substring(start, end);
  return section.trim();
}

/**
 * @param {string} text
 * @param {number} maxLen
 * @returns {string}
 */
function truncatePreview_(text, maxLen) {
  var s = String(text || '').trim();
  if (s.length <= maxLen) {
    return s || '（なし）';
  }
  return s.substring(0, maxLen) + '…';
}

/**
 * 既存 Doc に修正版を追記（差分仕様 推奨A）
 * @param {string} docId
 * @param {number} versionNum
 * @param {Object} content
 */
function appendRevisionToDocument(docId, versionNum, content) {
  var doc = DocumentApp.openById(docId);
  var body = doc.getBody();
  body.appendParagraph('--- v' + versionNum + ' 修正版 ---').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(content.title || '').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  if (content.subtitle) {
    body.appendParagraph(content.subtitle);
  }
  body.appendParagraph('--- 無料部分 ---').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(content.free_part || '');
  body.appendParagraph('--- 有料部分 ---').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(content.paid_part || '');
  if (content.cta) {
    body.appendParagraph('--- CTA ---').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(content.cta);
  }
  if (content.disclaimer) {
    body.appendParagraph('--- 注意書き ---').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(content.disclaimer);
  }
  body.appendParagraph('--- AIセルフレビュー v' + versionNum + ' ---').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(content.review_summary || '');
  doc.saveAndClose();
}

/**
 * ドキュメント内の修正版数を数える
 * @param {string} text
 * @returns {number}
 */
function countRevisionVersionsInDoc_(text) {
  var matches = String(text).match(/--- v\d+ 修正版 ---/g);
  return matches ? matches.length : 0;
}

/**
 * Docs 本文から記事セクションを抽出（最新バージョン）
 * @param {string} text
 * @returns {Object}
 */
function extractArticleSectionsFromDocText_(text) {
  var body = String(text);
  var versionParts = body.split(/--- v\d+ 修正版 ---/);
  if (versionParts.length > 1) {
    body = versionParts[versionParts.length - 1];
  }
  return {
    free_part: extractSection_(body, '--- 無料部分 ---', '--- 有料部分 ---'),
    paid_part: extractSection_(body, '--- 有料部分 ---', '--- CTA ---'),
    cta: extractSection_(body, '--- CTA ---', '--- 注意書き ---'),
    disclaimer: extractSection_(body, '--- 注意書き ---', '--- AIセルフレビュー'),
  };
}

/**
 * 商品の最新 Docs から Tips 連携用の全文を取得
 * @param {string} docId
 * @returns {Object}
 */
function readArticleSectionsFromDoc(docId) {
  var text = readDraftDocumentText(docId);
  return extractArticleSectionsFromDocText_(text);
}
