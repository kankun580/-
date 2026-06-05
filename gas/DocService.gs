/**
 * Google Docs 下書き保存
 */

/**
 * @param {string} title
 * @param {Object} content
 * @returns {{ fullUrl: string, fullId: string }}
 */
function createDraftDocument(title, content) {
  content = sanitizeGeneratedContent_(content || {});
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
  var fullText = doc.getBody().getText();
  var fromText = extractPreviewFromDocText_(fullText, maxLen);
  var fromParagraphs = getDocPreviewsFromParagraphs_(doc, maxLen);
  return {
    free_preview: pickDocPreview_(fromText.free_preview, fromParagraphs.free_preview),
    paid_preview: pickDocPreview_(fromText.paid_preview, fromParagraphs.paid_preview),
  };
}

/**
 * 段落走査でプレビュー取得（getText と相互補完）
 * @param {GoogleAppsScript.Document.Document} doc
 * @param {number} maxLen
 * @returns {{ free_preview: string, paid_preview: string }}
 */
function getDocPreviewsFromParagraphs_(doc, maxLen) {
  var paragraphs = doc.getBody().getParagraphs();
  var freeLines = [];
  var paidLines = [];
  var section = '';

  for (var i = 0; i < paragraphs.length; i++) {
    var trimmed = String(paragraphs[i].getText()).trim();
    if (!trimmed) {
      continue;
    }
    if (/---\s*v\d+\s*修正版\s*---/.test(trimmed)) {
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
    if (section && isDocSectionEndMarker_(trimmed)) {
      section = '';
      continue;
    }
    if (section === 'free') {
      freeLines.push(trimmed);
    } else if (section === 'paid') {
      paidLines.push(trimmed);
    }
  }

  return {
    free_preview: truncatePreview_(freeLines.join('\n'), maxLen),
    paid_preview: truncatePreview_(paidLines.join('\n'), maxLen),
  };
}

/**
 * 2 つのプレビュー候補から有効な方を採用（空は「（なし）」）
 * @param {string} a
 * @param {string} b
 * @returns {string}
 */
function pickDocPreview_(a, b) {
  var empty = '（なし）';
  var aOk = a && a !== empty;
  var bOk = b && b !== empty;
  if (aOk && !bOk) {
    return a;
  }
  if (bOk && !aOk) {
    return b;
  }
  if (aOk && bOk) {
    return a.length >= b.length ? a : b;
  }
  return empty;
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
    paid_preview: truncatePreview_(
      extractSectionWithEnds_(body, '--- 有料部分 ---', [
        '--- CTA ---',
        '--- 注意書き ---',
        '--- AIセルフレビュー',
      ]),
      maxLen
    ),
  };
}

/**
 * @param {string} body
 * @param {string} startMarker
 * @param {string} endMarker
 * @returns {string}
 */
function extractSection_(body, startMarker, endMarker) {
  return extractSectionWithEnds_(body, startMarker, [endMarker]);
}

/**
 * 開始マーカーから、最初に現れる終了マーカーの手前までを抽出
 * @param {string} body
 * @param {string} startMarker
 * @param {string[]} endMarkers
 * @returns {string}
 */
function extractSectionWithEnds_(body, startMarker, endMarkers) {
  var start = body.indexOf(startMarker);
  if (start < 0) {
    return '';
  }
  start += startMarker.length;
  var end = body.length;
  for (var i = 0; i < endMarkers.length; i++) {
    var pos = body.indexOf(endMarkers[i], start);
    if (pos >= 0 && pos < end) {
      end = pos;
    }
  }
  return body.substring(start, end).trim();
}

/**
 * @param {string} text
 * @param {number} maxLen
 * @returns {string}
 */
function truncatePreview_(text, maxLen) {
  var s = sanitizeArticleText_(String(text || ''));
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
  content = sanitizeGeneratedContent_(content || {});
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
    paid_part: extractSectionWithEnds_(body, '--- 有料部分 ---', [
      '--- CTA ---',
      '--- 注意書き ---',
      '--- AIセルフレビュー',
    ]),
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
  ensureDraftDocumentSanitized_(docId);
  var text = readDraftDocumentText(docId);
  return sanitizeGeneratedContent_(extractArticleSectionsFromDocText_(text));
}

/**
 * セクション見出し行か（サニタイズ対象外）
 * @param {string} trimmed
 * @returns {boolean}
 */
function isDocStructuralHeading_(trimmed) {
  return (
    isDocSectionMarker_(trimmed, '無料部分') ||
    isDocSectionMarker_(trimmed, '有料部分') ||
    isDocSectionMarker_(trimmed, 'CTA') ||
    isDocSectionMarker_(trimmed, '注意書き') ||
    isDocSectionMarker_(trimmed, 'AIセルフレビュー') ||
    /---\s*v\d+\s*修正版\s*---/.test(trimmed)
  );
}

/**
 * 段落・リスト項目をプレーンテキストに差し替え（setText は太字等を残すため clear を使う）
 * @param {GoogleAppsScript.Document.Paragraph|GoogleAppsScript.Document.ListItem} element
 * @param {string} text
 */
function setDocElementPlainText_(element, text) {
  var value = String(text || '');
  if (typeof element.clear === 'function' && typeof element.appendText === 'function') {
    element.clear();
    if (value) {
      element.appendText(value);
    }
    return;
  }
  element.setText(value);
}

/**
 * 太字・斜体などインライン装飾を解除
 * @param {GoogleAppsScript.Document.Paragraph|GoogleAppsScript.Document.ListItem} element
 * @returns {boolean}
 */
function elementHasInlineFormatting_(textElement) {
  var len = textElement.getText().length;
  if (len < 1) {
    return false;
  }
  var offsets = [0];
  if (len > 2) {
    offsets.push(Math.floor(len / 2));
  }
  if (len > 1) {
    offsets.push(len - 1);
  }
  for (var i = 0; i < offsets.length; i++) {
    var o = offsets[i];
    if (textElement.isBold(o) || textElement.isItalic(o) || textElement.isUnderline(o)) {
      return true;
    }
  }
  return false;
}

/**
 * 太字・斜体などインライン装飾を解除
 * @param {GoogleAppsScript.Document.Paragraph|GoogleAppsScript.Document.ListItem} element
 * @returns {boolean}
 */
function clearDocElementFormatting_(element) {
  try {
    var t = element.editAsText();
    if (!t || !elementHasInlineFormatting_(t)) {
      return false;
    }
    var len = t.getText().length;
    t.setBold(0, len, false);
    t.setItalic(0, len, false);
    t.setUnderline(0, len, false);
    t.setStrikethrough(0, len, false);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * コンテナ内の段落・リスト・表を再帰的に走査
 * @param {GoogleAppsScript.Document.ContainerElement} container
 * @param {function} visitor
 */
function walkDocContainer_(container, visitor) {
  if (!container || typeof container.getNumChildren !== 'function') {
    return;
  }
  var n = container.getNumChildren();
  for (var i = 0; i < n; i++) {
    var child = container.getChild(i);
    var type = child.getType();
    if (type === DocumentApp.ElementType.PARAGRAPH) {
      visitor(child.asParagraph());
    } else if (type === DocumentApp.ElementType.LIST_ITEM) {
      visitor(child.asListItem());
      walkDocContainer_(child.asListItem(), visitor);
    } else if (type === DocumentApp.ElementType.TABLE) {
      var table = child.asTable();
      for (var r = 0; r < table.getNumRows(); r++) {
        var row = table.getRow(r);
        for (var c = 0; c < row.getNumCells(); c++) {
          walkDocContainer_(row.getCell(c), visitor);
        }
      }
    }
  }
}

/**
 * Google Docs 本文のマークダウン装飾を除去して保存（既存下書き用）
 * @param {string} docId
 * @returns {{ changed: boolean, updatedParagraphs: number, markdownRemaining: boolean }}
 */
function sanitizeDraftDocumentInPlace_(docId) {
  var doc = DocumentApp.openById(docId);
  var body = doc.getBody();
  var updated = 0;
  var formatCleared = 0;

  function trySanitizeElement_(element) {
    if (!element || typeof element.getText !== 'function') {
      return;
    }
    var raw = element.getText();
    var trimmed = String(raw).trim();
    if (!trimmed || isDocStructuralHeading_(trimmed)) {
      return;
    }
    var clean = sanitizeArticleText_(raw);
    if (clean !== raw) {
      setDocElementPlainText_(element, clean);
      updated++;
    }
    if (clearDocElementFormatting_(element)) {
      formatCleared++;
    }
  }

  walkDocContainer_(body, trySanitizeElement_);

  if (updated > 0 || formatCleared > 0) {
    doc.saveAndClose();
  }
  var remaining = hasMarkdownArtifacts_(readDraftDocumentText(docId));
  if (remaining) {
    writeErrorLog('sanitizeDraftDocumentInPlace_', 'Markdown may remain after sanitize', {
      docId: docId,
      updatedParagraphs: updated,
    });
  }
  return {
    changed: updated > 0,
    updatedParagraphs: updated,
    markdownRemaining: remaining,
  };
}

/**
 * Doc をサニタイズ（詳細未表示でも一覧表示時に実行可能）
 * @param {string} docId
 * @returns {boolean} 更新したか
 */
function ensureDraftDocumentSanitized_(docId) {
  return sanitizeDraftDocumentInPlace_(docId).changed;
}

/**
 * レビュー待ち商品の Docs を一括サニタイズ（一覧表示時）
 */
function sanitizeReviewWaitingDocs_() {
  var items = getReviewWaitingProducts();
  var count = 0;
  for (var i = 0; i < items.length; i++) {
    if (!items[i].doc_url) {
      continue;
    }
    try {
      var docId = getDocIdFromUrl_(items[i].doc_url);
      if (ensureDraftDocumentSanitized_(docId)) {
        count++;
      }
    } catch (e) {
      writeErrorLog('sanitizeReviewWaitingDocs_', e.message, { productId: items[i].product_id });
    }
  }
  return count;
}

/**
 * clasp / 管理用: 指定商品の Doc サニタイズ結果を返す
 * @param {string} productId
 * @returns {Object}
 */
function verifyProductDocSanitize_(productId) {
  var draft = getLatestDraftByProductId(productId);
  if (!draft || !draft.full_doc_url) {
    throw new Error('下書き Docs がありません');
  }
  var docId = getDocIdFromUrl_(draft.full_doc_url);
  var before = readDraftDocumentText(docId);
  var hadArtifacts = hasMarkdownArtifacts_(before);
  var result = sanitizeDraftDocumentInPlace_(docId);
  var after = readDraftDocumentText(docId);
  return {
    product_id: productId,
    doc_id: docId,
    had_artifacts_before: hadArtifacts,
    updated_paragraphs: result.updatedParagraphs,
    markdown_remaining: hasMarkdownArtifacts_(after),
    sample_before: before.substring(0, 200),
    sample_after: after.substring(0, 200),
  };
}
