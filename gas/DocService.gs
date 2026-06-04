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
  var u = String(url || '').trim();
  var match = u.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return match[1];
  }
  match = u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) {
    return match[1];
  }
  throw new Error('Docs URL が不正です: ' + u.substring(0, 80));
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
 * マーカー行か（全角ハイフン・空白のゆらぎを吸収）
 * @param {string} line
 * @param {string} keyword
 * @returns {boolean}
 */
function isDocSectionMarker_(line, keyword) {
  var norm = String(line || '')
    .replace(/\s/g, '')
    .replace(/[‐‑‒–—－]/g, '-');
  return norm.indexOf('---') >= 0 && norm.indexOf(keyword) >= 0;
}

/**
 * セクション終了マーカーか
 * @param {string} line
 * @returns {boolean}
 */
function isDocSectionEndMarker_(line) {
  var norm = String(line || '').replace(/\s/g, '');
  return (
    isDocSectionMarker_(line, '有料部分') ||
    isDocSectionMarker_(line, 'CTA') ||
    isDocSectionMarker_(line, '注意書き') ||
    isDocSectionMarker_(line, 'AIセルフレビュー') ||
    norm.indexOf('修正版') >= 0
  );
}

/**
 * Document 構造からプレビュー取得（getText より安定）
 * @param {string} docId
 * @param {number=} maxLen
 * @returns {{ free_preview: string, paid_preview: string }}
 */
function getDocPreviewsFromDocument_(docId, maxLen) {
  maxLen = maxLen || 400;
  var doc = DocumentApp.openById(docId);
  var paragraphs = doc.getBody().getParagraphs();
  var freeLines = [];
  var paidLines = [];
  var section = '';
  var inRevision = false;

  for (var i = 0; i < paragraphs.length; i++) {
    var line = paragraphs[i].getText();
    var trimmed = String(line).trim();
    if (!trimmed) {
      continue;
    }
    if (/---\s*v\d+\s*修正版\s*---/.test(trimmed)) {
      inRevision = true;
      freeLines = [];
      paidLines = [];
      section = '';
      continue;
    }
    if (isDocSectionMarker_(trimmed, '無料部分')) {
      section = 'free';
      continue;
    }
    if (isDocSectionMarker_(trimmed, '有料部分')) {
      section = 'paid';
      continue;
    }
    if (section && isDocSectionEndMarker_(trimmed) && !isDocSectionMarker_(trimmed, '有料部分')) {
      section = '';
      continue;
    }
    if (section === 'free') {
      freeLines.push(trimmed);
    } else if (section === 'paid') {
      paidLines.push(trimmed);
    }
  }

  if (!freeLines.length && !paidLines.length) {
    var fromText = extractPreviewFromDocText_(doc.getBody().getText(), maxLen);
    if (fromText.free_preview !== '（なし）' || fromText.paid_preview !== '（なし）') {
      return fromText;
    }
  }

  return {
    free_preview: truncatePreview_(freeLines.join('\n'), maxLen),
    paid_preview: truncatePreview_(paidLines.join('\n'), maxLen),
  };
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
