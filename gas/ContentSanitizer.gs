/**
 * AI 生成文からマークダウン等の装飾を除去（Tips 向けプレーンテキスト）
 */

var ARTICLE_TEXT_FIELDS_ = ['title', 'subtitle', 'free_part', 'paid_part', 'cta', 'disclaimer', 'review_summary'];

/**
 * Gemini 応答オブジェクトの本文フィールドをサニタイズ
 * @param {Object} content
 * @returns {Object}
 */
function sanitizeGeneratedContent_(content) {
  if (!content) {
    return content;
  }
  var out = {};
  for (var key in content) {
    if (content.hasOwnProperty(key)) {
      out[key] = content[key];
    }
  }
  for (var i = 0; i < ARTICLE_TEXT_FIELDS_.length; i++) {
    var field = ARTICLE_TEXT_FIELDS_[i];
    if (out[field] != null && typeof out[field] === 'string') {
      out[field] = sanitizeArticleText_(out[field]);
    }
  }
  return out;
}

/**
 * @param {string} text
 * @returns {string}
 */
function sanitizeArticleText_(text) {
  var s = String(text || '');
  if (!s) {
    return '';
  }

  var i;
  for (i = 0; i < 8; i++) {
    var next = s.replace(/\*\*([^*]+)\*\*/g, '$1');
    if (next === s) {
      break;
    }
    s = next;
  }
  s = s.replace(/__([^_\n]+)__/g, '$1');
  for (i = 0; i < 4; i++) {
    var italic = s.replace(/\*([^*\n]+)\*/g, '$1');
    if (italic === s) {
      break;
    }
    s = italic;
  }
  s = s.replace(/`([^`\n]+)`/g, '$1');
  s = s.replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1');
  s = s.replace(/^#{1,6}\s+/gm, '');
  s = s.replace(/^[ \t]*[-*_]{3,}[ \t]*$/gm, '');
  s = s.replace(/\*\*/g, '');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

/**
 * プロンプト用：装飾禁止の共通ルール
 * @returns {string}
 */
function buildPlainTextStyleRules_() {
  return (
    '- マークダウン・装飾記法は禁止（**、*、__、#、`、[]() リンク形式など使わない）\n' +
    '- 強調は「」または【】のみ。見出しは【】や番号・改行で表現\n' +
    '- 箇条書きは「・」または「1. 2.」形式（行頭の - や * は使わない）\n'
  );
}
