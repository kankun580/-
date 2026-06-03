/**
 * AI 下書き生成
 */

/**
 * 生成待ち商品から下書きを作成（トリガー or 手動）
 * @returns {Object}
 */
function generateDrafts() {
  var maxDaily = parseInt(getConfigValue(CONFIG_KEYS.MAX_DAILY_GENERATION) || '1', 10);
  if (countGeneratedToday_() >= maxDaily) {
    return { ok: false, message: '本日の生成上限に達しています（' + maxDaily + '件）' };
  }

  var targets = getProductsByStatus('未着手');
  if (!targets.length) {
    targets = getProductsByStatus('生成待ち');
  }
  if (!targets.length) {
    return { ok: true, message: '生成対象の商品がありません', generated: 0 };
  }

  var product = targets[0];
  var result = generateDraftForProduct_(product);
  return { ok: true, generated: 1, product_id: product.product_id, result: result };
}

/**
 * 指定商品1件を生成（Web からも呼べる）
 * @param {string} productId
 * @returns {Object}
 */
function generateDraftForProductId(productId) {
  var product = getProductById(productId);
  if (!product) {
    throw new Error('商品が見つかりません');
  }
  return generateDraftForProduct_(product);
}

/**
 * @param {Object} product
 * @returns {Object}
 */
function generateDraftForProduct_(product) {
  var productId = product.product_id;
  updateProductStatus(productId, '生成中');

  try {
    var model = getDefaultGeminiModel_();
    var prompt = buildContentGenerationPrompt_(product);
    var reply = callGemini(prompt, {
      model: model,
      processType: 'generateDraft',
    });
    var parsed = parseGeminiJson_(reply.text);

    var doc = createDraftDocument(parsed.title || product.title, {
      title: parsed.title,
      subtitle: parsed.subtitle,
      free_part: parsed.free_part,
      paid_part: parsed.paid_part,
      cta: parsed.cta,
      disclaimer: parsed.disclaimer || buildDefaultDisclaimer_(product.risk_level),
      review_summary: parsed.review_summary,
    });

    var draftId = generateId_('DFT');
    appendDraft({
      draft_id: draftId,
      product_id: productId,
      free_doc_url: doc.fullUrl,
      paid_doc_url: doc.fullUrl,
      full_doc_url: doc.fullUrl,
      cta_text: parsed.cta || '',
      generation_model: model,
      generation_status: '完了',
      approved_by_user: '未確認',
    });

    appendReview({
      review_id: generateId_('REV'),
      draft_id: draftId,
      legal_risk: parsed.legal_risk || '',
      ad_risk: '',
      fabrication_risk: '',
      anxiety_risk: '',
      value_score: parsed.value_score || '',
      readability_score: '',
      recommendation: parsed.recommendation || 'hold',
      review_summary: parsed.review_summary || '',
    });

    updateProductStatus(productId, 'レビュー待ち');
    sendReviewNotificationEmail_(product, doc.fullUrl, parsed.review_summary);

    return {
      draft_id: draftId,
      doc_url: doc.fullUrl,
      review_summary: parsed.review_summary,
    };
  } catch (e) {
    updateProductStatus(productId, '生成失敗');
    writeErrorLog('generateDraftForProduct_', e.message, {
      productId: productId,
      stackTrace: e.stack || '',
    });
    throw e;
  }
}

/**
 * @param {string} riskLevel
 * @returns {string}
 */
function buildDefaultDisclaimer_(riskLevel) {
  if (riskLevel === 'high' || riskLevel === '中' || riskLevel === 'medium') {
    return (
      '本コンテンツは一般的な情報提供を目的としたものであり、法律相談ではありません。' +
      '個別の問題は専門家へご相談ください。'
    );
  }
  return '本コンテンツは収益を保証するものではありません。結果は個人差があります。';
}
