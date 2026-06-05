/**
 * Gemini 用プロンプト
 */

/**
 * @param {Object} product
 * @returns {string}
 */
function buildContentGenerationPrompt_(product) {
  return (
    'あなたはTipsで販売する実用コンテンツの編集者です。\n' +
    '以下のJSON形式のみで回答してください。マークダウンコードブロックは不要です。\n\n' +
    '{\n' +
    '  "title": "商品タイトル",\n' +
    '  "subtitle": "サブタイトル",\n' +
    '  "free_part": "無料部分の本文",\n' +
    '  "paid_part": "有料部分の本文",\n' +
    '  "cta": "CTA文",\n' +
    '  "disclaimer": "注意書き",\n' +
    '  "review_summary": "AIレビュー要約（3行以内）",\n' +
    '  "recommendation": "approve または revise または hold",\n' +
    '  "legal_risk": "低/中/高",\n' +
    '  "value_score": 1-5の数値\n' +
    '}\n\n' +
    '条件:\n' +
    '- 体験談を捏造しない\n' +
    '- 法律・労務の断定をしない\n' +
    '- 収益を保証しない\n' +
    '- スマホで読みやすい改行\n' +
    buildPlainTextStyleRules_() +
    '\n' +
    '商品情報:\n' +
    'カテゴリ/タイプ: ' +
    product.product_type +
    '\n' +
    'タイトル案: ' +
    product.title +
    '\n' +
    '想定読者: ' +
    product.target_reader +
    '\n' +
    '悩み: ' +
    product.problem +
    '\n' +
    '提供価値: ' +
    product.promise +
    '\n' +
    '価格: ' +
    product.price_jpy +
    '円\n' +
    'リスク: ' +
    product.risk_level
  );
}

/**
 * 修正依頼に基づく再生成プロンプト
 * @param {Object} product
 * @param {string} currentText
 * @param {string} revisionComment
 * @returns {string}
 */
function buildRevisionPrompt_(product, currentText, revisionComment) {
  var truncated =
    currentText.length > 12000 ? currentText.substring(0, 12000) + '\n…（以降省略）' : currentText;
  return (
    'あなたはTips販売用コンテンツの編集者です。\n' +
    '以下の既存原稿と修正コメントに従い、改善版を作成してください。\n' +
    'JSON形式のみで回答。マークダウンコードブロックは不要です。\n\n' +
    '{\n' +
    '  "title": "商品タイトル",\n' +
    '  "subtitle": "サブタイトル",\n' +
    '  "free_part": "無料部分の本文",\n' +
    '  "paid_part": "有料部分の本文",\n' +
    '  "cta": "CTA文",\n' +
    '  "disclaimer": "注意書き",\n' +
    '  "review_summary": "AIレビュー要約（3行以内）",\n' +
    '  "recommendation": "approve または revise または hold",\n' +
    '  "legal_risk": "低/中/高",\n' +
    '  "value_score": 1-5の数値\n' +
    '}\n\n' +
    '修正方針:\n' +
    '- 修正コメントを最優先する\n' +
    '- 体験談を捏造しない\n' +
    '- 法律・労務の断定をしない\n' +
    '- 収益を保証しない\n' +
    '- スマホで読みやすい改行\n' +
    buildPlainTextStyleRules_() +
    '\n' +
    '修正コメント:\n' +
    (revisionComment || '（コメントなし — 品質と読みやすさを改善）') +
    '\n\n' +
    '商品情報:\n' +
    'タイプ: ' +
    product.product_type +
    '\n' +
    'タイトル: ' +
    product.title +
    '\n' +
    '想定読者: ' +
    product.target_reader +
    '\n' +
    '悩み: ' +
    product.problem +
    '\n' +
    '提供価値: ' +
    product.promise +
    '\n' +
    '価格: ' +
    product.price_jpy +
    '円\n' +
    'リスク: ' +
    product.risk_level +
    '\n\n' +
    '既存原稿:\n' +
    truncated
  );
}

/**
 * @param {string} text
 * @returns {Object}
 */
function parseGeminiJson_(text) {
  var raw = String(text).trim();
  var match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    raw = match[0];
  }
  return JSON.parse(raw);
}
