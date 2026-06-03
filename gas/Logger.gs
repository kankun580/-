/**
 * error_log / operation_log / api_usage_log への記録
 */

/**
 * @param {string} processName
 * @param {string} errorMessage
 * @param {Object=} options
 * @param {string=} options.productId
 * @param {string=} options.stackTrace
 */
function writeErrorLog(processName, errorMessage, options) {
  options = options || {};
  var row = [
    generateId_('ERR'),
    formatTimestamp_(new Date()),
    processName,
    options.productId || '',
    errorMessage,
    options.stackTrace || '',
    'FALSE',
    '',
  ];
  try {
    appendSheetRow(SHEET_NAMES.ERROR_LOG, row);
  } catch (e) {
    console.error('writeErrorLog failed: ' + e.message);
  }
}

/**
 * @param {string} actor
 * @param {string} action
 * @param {Object=} options
 */
function writeOperationLog(actor, action, options) {
  options = options || {};
  var row = [
    generateId_('OP'),
    formatTimestamp_(new Date()),
    actor,
    action,
    options.productId || '',
    options.beforeStatus || '',
    options.afterStatus || '',
    options.comment || '',
  ];
  try {
    appendSheetRow(SHEET_NAMES.OPERATION_LOG, row);
  } catch (e) {
    console.error('writeOperationLog failed: ' + e.message);
  }
}

/**
 * @param {Object} entry
 */
function writeApiUsageLog(entry) {
  var row = [
    entry.logId || generateId_('API'),
    entry.timestamp || formatTimestamp_(new Date()),
    entry.processType || '',
    entry.model || '',
    entry.inputChars || 0,
    entry.outputChars || 0,
    entry.estimatedTokens || 0,
    entry.estimatedCostJpy || 0,
    entry.status || 'success',
    entry.errorMessage || '',
  ];
  try {
    appendSheetRow(SHEET_NAMES.API_USAGE_LOG, row);
  } catch (e) {
    console.error('writeApiUsageLog failed: ' + e.message);
  }
}

/**
 * @param {string} prefix
 * @returns {string}
 */
function generateId_(prefix) {
  var ts = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd-HHmmss');
  var rand = Math.floor(Math.random() * 1000);
  return prefix + '-' + ts + '-' + rand;
}

/**
 * @param {Date} date
 * @returns {string}
 */
function formatTimestamp_(date) {
  return Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
}
