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
