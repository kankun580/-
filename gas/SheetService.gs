/**
 * スプレッドシート（裏側DB）操作
 */

/**
 * 管理用スプレッドシートを取得（未作成なら null）
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet|null}
 */
function getManagementSpreadsheet() {
  var id = getConfigValue(CONFIG_KEYS.SPREADSHEET_ID);
  if (!id) {
    return null;
  }
  try {
    return SpreadsheetApp.openById(id);
  } catch (e) {
    return null;
  }
}

/**
 * config 値を取得（シート優先、なければ Script Properties の同名キー）
 * @param {string} key
 * @returns {string}
 */
function getConfigValue(key) {
  var ss = getManagementSpreadsheet();
  if (ss) {
    var fromSheet = getConfigValueFromSheet_(ss, key);
    if (fromSheet !== '') {
      return fromSheet;
    }
  }
  return PropertiesService.getScriptProperties().getProperty(key) || '';
}

/**
 * config 値を設定（既存キーは上書きしないモードあり）
 * @param {string} key
 * @param {string} value
 * @param {string} description
 * @param {boolean=} overwrite
 */
function setConfigValue(key, value, description, overwrite) {
  var ss = getManagementSpreadsheet();
  if (!ss) {
    throw new Error('管理用スプレッドシートが未作成です。setupProject() を実行してください。');
  }
  setConfigValueOnSheet_(ss, key, value, description || '', overwrite !== false);
}

/**
 * 新規管理用スプレッドシートを作成
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function createManagementSpreadsheet() {
  var ss = SpreadsheetApp.create(PROJECT.NAME + '_DB');
  var defaultSheet = ss.getSheets()[0];
  defaultSheet.setName(SHEET_NAMES.CONFIG);
  return ss;
}

/**
 * 全シートを作成しヘッダーを設定
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 */
function createRequiredSheets(ss) {
  Object.keys(SHEET_HEADERS).forEach(function (name) {
    ensureSheetWithHeaders_(ss, name, SHEET_HEADERS[name]);
  });
}

/**
 * ヘッダー行のみ初期化（データ行は触らない）
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 */
function initializeHeaders(ss) {
  Object.keys(SHEET_HEADERS).forEach(function (name) {
    var sheet = ensureSheetWithHeaders_(ss, name, SHEET_HEADERS[name]);
    var headers = SHEET_HEADERS[name];
    var existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    var needsHeader = existing.join('') === '' || existing[0] !== headers[0];
    if (needsHeader) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }
  });
}

/**
 * デフォルト config 行を投入（既存キーはスキップ）
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 */
function initializeConfig(ss) {
  var sheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  if (!sheet) {
    sheet = ensureSheetWithHeaders_(ss, SHEET_NAMES.CONFIG, SHEET_HEADERS[SHEET_NAMES.CONFIG]);
  }
  DEFAULT_CONFIG_ROWS.forEach(function (row) {
    if (getConfigValueFromSheet_(ss, row[0]) === '') {
      sheet.appendRow(row);
    }
  });
}

/**
 * シートに1行追加
 * @param {string} sheetName
 * @param {Array<*>} row
 */
function appendSheetRow(sheetName, row) {
  var ss = getManagementSpreadsheet();
  if (!ss) {
    throw new Error('スプレッドシート未初期化');
  }
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('シートが存在しません: ' + sheetName);
  }
  sheet.appendRow(row);
}

/**
 * config シートのキー→値マップ（1行目ヘッダー想定）
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @param {string} key
 * @returns {string}
 */
function getConfigValueFromSheet_(ss, key) {
  var sheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  if (!sheet) {
    return '';
  }
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return '';
  }
  var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]) === key) {
      return String(data[i][1] || '');
    }
  }
  return '';
}

/**
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @param {string} key
 * @param {string} value
 * @param {string} description
 * @param {boolean} overwrite
 */
function setConfigValueOnSheet_(ss, key, value, description, overwrite) {
  var sheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  if (!sheet) {
    throw new Error('config シートがありません');
  }
  var lastRow = sheet.getLastRow();
  var foundRow = -1;
  if (lastRow >= 2) {
    var keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < keys.length; i++) {
      if (String(keys[i][0]) === key) {
        foundRow = i + 2;
        break;
      }
    }
  }
  if (foundRow > 0) {
    if (overwrite) {
      sheet.getRange(foundRow, 2).setValue(value);
      if (description) {
        sheet.getRange(foundRow, 3).setValue(description);
      }
    }
    return;
  }
  sheet.appendRow([key, value, description]);
}

/**
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @param {string} name
 * @param {Array<string>} headers
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function ensureSheetWithHeaders_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}
