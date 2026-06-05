/**
 * Gemini API クライアント
 * @see docs/diff_spec_gemini_mcp.md §3
 */

/**
 * Gemini API を呼び出す
 * @param {string} prompt
 * @param {Object=} options
 * @param {string=} options.model
 * @param {string=} options.processType
 * @returns {{ text: string, raw: Object }}
 */
function callGemini(prompt, options) {
  options = options || {};
  var apiKey = getGeminiApiKey_();
  var model = options.model || getDefaultGeminiModel_();
  var url = GEMINI_API_BASE + model + ':generateContent?key=' + encodeURIComponent(apiKey);

  var payload = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  var inputChars = prompt.length;
  var responseText = '';
  var status = 'success';
  var errorMessage = '';

  try {
    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    var code = response.getResponseCode();
    var body = response.getContentText();
    var json = JSON.parse(body);

    if (code !== 200) {
      status = 'error';
      errorMessage = (json.error && json.error.message) ? json.error.message : body;
      throw new Error('Gemini API error (' + code + '): ' + errorMessage);
    }

    responseText = extractTextFromGeminiResponse_(json);
    if (!responseText) {
      status = 'error';
      errorMessage = '空のレスポンス';
      throw new Error(errorMessage);
    }

    logGeminiUsage_({
      processType: options.processType || 'callGemini',
      model: model,
      inputChars: inputChars,
      outputChars: responseText.length,
      status: status,
      errorMessage: '',
    });

    return { text: responseText, raw: json };
  } catch (e) {
    status = 'error';
    errorMessage = e.message;
    logGeminiUsage_({
      processType: options.processType || 'callGemini',
      model: model,
      inputChars: inputChars,
      outputChars: 0,
      status: status,
      errorMessage: errorMessage,
    });
    writeErrorLog('callGemini', errorMessage, { stackTrace: e.stack || '' });
    throw e;
  }
}

/**
 * 疎通テスト（GASエディタから実行）
 * @returns {Object}
 */
function testGeminiConnection() {
  var result = {
    ok: false,
    model: '',
    message: '',
    sampleText: '',
  };

  try {
    var model = getDefaultGeminiModel_();
    result.model = model;
    var reply = callGemini('Reply with exactly: OK', {
      model: model,
      processType: 'testGeminiConnection',
    });
    result.ok = reply.text.indexOf('OK') !== -1;
    result.sampleText = reply.text.substring(0, 200);
    result.message = result.ok ? 'Gemini API 疎通成功' : '応答は取得できましたが OK を確認できませんでした';
    writeOperationLog('system', 'testGeminiConnection', {
      comment: result.message,
    });
    return result;
  } catch (e) {
    result.message = e.message;
    return result;
  }
}

/**
 * @returns {string}
 */
function getGeminiApiKey_() {
  var key = PropertiesService.getScriptProperties().getProperty(SCRIPT_PROPERTY_KEYS.GEMINI_API_KEY);
  if (!key) {
    throw new Error(
      'GEMINI_API_KEY が未設定です。' +
        'GAS → プロジェクトの設定 → スクリプト プロパティ に設定してください。'
    );
  }
  return key;
}

/**
 * @returns {string}
 */
function getDefaultGeminiModel_() {
  var props = PropertiesService.getScriptProperties();
  return (
    props.getProperty(SCRIPT_PROPERTY_KEYS.GEMINI_MODEL_DEFAULT) ||
    getConfigValue(CONFIG_KEYS.GEMINI_MODEL_DEFAULT) ||
    'gemini-2.5-flash'
  );
}

/**
 * @param {Object} json
 * @returns {string}
 */
function extractTextFromGeminiResponse_(json) {
  if (!json.candidates || !json.candidates.length) {
    return '';
  }
  var parts = json.candidates[0].content && json.candidates[0].content.parts;
  if (!parts || !parts.length) {
    return '';
  }
  return parts.map(function (p) {
    return p.text || '';
  }).join('');
}

/**
 * @param {Object} entry
 */
function logGeminiUsage_(entry) {
  var estimatedTokens = Math.ceil((entry.inputChars + entry.outputChars) / 4);
  var estimatedCostJpy = estimateGeminiCostJpy_(entry.model, estimatedTokens);
  writeApiUsageLog({
    processType: entry.processType,
    model: entry.model,
    inputChars: entry.inputChars,
    outputChars: entry.outputChars,
    estimatedTokens: estimatedTokens,
    estimatedCostJpy: estimatedCostJpy,
    status: entry.status,
    errorMessage: entry.errorMessage,
  });
}

/**
 * 概算（円）— モデルごとに将来調整
 * @param {string} model
 * @param {number} tokens
 * @returns {number}
 */
function estimateGeminiCostJpy_(model, tokens) {
  // 初期は概算のみ。Flash 系を極小コストとして記録
  var ratePer1k = 0.05;
  if (model.indexOf('lite') !== -1) {
    ratePer1k = 0.02;
  }
  return Math.round((tokens / 1000) * ratePer1k * 100) / 100;
}
