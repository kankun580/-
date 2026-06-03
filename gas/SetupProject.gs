/**
 * 初回セットアップ: Drive / Sheets / config / サンプル / トリガー
 * @see docs/diff_spec_gemini_mcp.md §7
 */

/**
 * メインセットアップ（GASエディタまたは clasp push 後に1回実行）
 * @param {Object=} options
 * @param {boolean=} options.force - true の場合、config の ID を除き再初期化
 * @returns {Object}
 */
function setupProject(options) {
  options = options || {};
  var result = {
    mode: 'create',
    spreadsheetId: '',
    spreadsheetUrl: '',
    rootFolderId: '',
    folderIds: {},
    message: '',
  };

  try {
    var existingSsId = PropertiesService.getScriptProperties().getProperty(CONFIG_KEYS.SPREADSHEET_ID);
    if (existingSsId && !options.force) {
      result.mode = 'reuse';
      var existingSs = SpreadsheetApp.openById(existingSsId);
      result.spreadsheetId = existingSsId;
      result.spreadsheetUrl = existingSs.getUrl();
      syncConfigFromSpreadsheet_(existingSs, result);
      writeOperationLog('system', 'setupProject_reuse', { comment: '既存プロジェクトを再利用' });
      result.message = '既存設定を再利用しました。新規作成は options.force=true で実行してください。';
      return result;
    }

    var folders = createProjectFolders();
    result.rootFolderId = folders.rootFolderId;
    result.folderIds = folders.folderIds;

    var ss = createManagementSpreadsheet();
    result.spreadsheetId = ss.getId();
    result.spreadsheetUrl = ss.getUrl();

    createRequiredSheets(ss);
    initializeHeaders(ss);
    initializeConfig(ss);

    setConfigValueOnSheet_(ss, CONFIG_KEYS.SPREADSHEET_ID, ss.getId(), '管理用スプレッドシートID', true);
    setConfigValueOnSheet_(ss, CONFIG_KEYS.PROJECT_ROOT_FOLDER_ID, folders.rootFolderId, 'ルートフォルダID', true);
    setConfigValueOnSheet_(ss, CONFIG_KEYS.DRAFTS_FOLDER_ID, folders.folderIds.drafts, '下書きフォルダ', true);
    setConfigValueOnSheet_(ss, CONFIG_KEYS.MATERIALS_FOLDER_ID, folders.folderIds.materials, '素材フォルダ', true);
    setConfigValueOnSheet_(ss, CONFIG_KEYS.REPORTS_FOLDER_ID, folders.folderIds.reports, 'レポートフォルダ', true);
    setConfigValueOnSheet_(ss, CONFIG_KEYS.EXPORTS_FOLDER_ID, folders.folderIds.exports, 'エクスポートフォルダ', true);
    setConfigValueOnSheet_(ss, CONFIG_KEYS.TEMPLATES_FOLDER_ID, folders.folderIds.templates, 'テンプレートフォルダ', true);
    setConfigValueOnSheet_(ss, CONFIG_KEYS.SETUP_COMPLETED_AT, formatTimestamp_(new Date()), 'セットアップ完了日時', true);
    setConfigValueOnSheet_(ss, CONFIG_KEYS.SETUP_VERSION, PROJECT.SETUP_VERSION, 'セットアップバージョン', true);

    PropertiesService.getScriptProperties().setProperty(CONFIG_KEYS.SPREADSHEET_ID, ss.getId());

    moveSpreadsheetToFolder_(ss.getId(), folders.rootFolderId);
    createSampleRows(ss);
    createTimeTriggers();
    sendSetupCompleteEmail(ss.getUrl());

    writeOperationLog('system', 'setupProject_complete', {
      comment: '初回セットアップ完了',
    });

    result.message = 'セットアップが完了しました。';
    return result;
  } catch (e) {
    writeErrorLog('setupProject', e.message, { stackTrace: e.stack || '' });
    throw e;
  }
}

/**
 * Drive 専用フォルダツリーを作成（既存あれば再利用）
 * @returns {{ rootFolderId: string, folderIds: Object.<string, string> }}
 */
function createProjectFolders() {
  var root = findOrCreateFolder_(DriveApp.getRootFolder(), PROJECT.ROOT_FOLDER_NAME);
  var folderIds = {};
  PROJECT.SUB_FOLDERS.forEach(function (name) {
    folderIds[name] = findOrCreateFolder_(root, name).getId();
  });
  return {
    rootFolderId: root.getId(),
    folderIds: folderIds,
  };
}

/**
 * サンプル商品1件を products に追加
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 */
function createSampleRows(ss) {
  var sheet = ss.getSheetByName(SHEET_NAMES.PRODUCTS);
  if (!sheet || sheet.getLastRow() > 1) {
    return;
  }
  var now = formatTimestamp_(new Date());
  var productId = generateId_('PRD');
  sheet.appendRow([
    productId,
    '手順書',
    'スマホだけでTips商品の下書きを作る手順書',
    '副業初心者・スマホ中心の人',
    '何から始めればいいかわからない',
    '今日から試せる最短ステップ',
    980,
    'low',
    '未着手',
    now,
    now,
  ]);
}

/**
 * 時間主導トリガーを作成（重複しない）
 */
function createTimeTriggers() {
  var handler = 'generateDrafts';
  var existing = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === handler;
  });
  if (!existing) {
    // 週3回: 月・水・金 9:00（初期は generateDrafts 未実装のためコメントアウト相当でスキップ可）
    // フェーズ1で generateDrafts 実装後に有効化する
    // ScriptApp.newTrigger(handler).timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY)...
  }
}

/**
 * セットアップ完了メール
 * @param {string} spreadsheetUrl
 */
function sendSetupCompleteEmail(spreadsheetUrl) {
  var email = Session.getActiveUser().getEmail();
  if (!email) {
    return;
  }
  var subject = '【セットアップ完了】Tips AI自動販売システム';
  var body =
    'setupProject() が完了しました。\n\n' +
    '管理スプレッドシート: ' + spreadsheetUrl + '\n\n' +
    '次のステップ:\n' +
    '1. Script Properties に GEMINI_API_KEY を設定\n' +
    '2. testGeminiConnection() を実行\n' +
    '3. config の REVIEW_EMAIL を設定\n';
  try {
    MailApp.sendEmail(email, subject, body);
  } catch (e) {
    writeErrorLog('sendSetupCompleteEmail', e.message, { stackTrace: e.stack || '' });
  }
}

/**
 * @param {GoogleAppsScript.Drive.Folder} parent
 * @param {string} name
 * @returns {GoogleAppsScript.Drive.Folder}
 */
function findOrCreateFolder_(parent, name) {
  var iter = parent.getFoldersByName(name);
  if (iter.hasNext()) {
    return iter.next();
  }
  return parent.createFolder(name);
}

/**
 * @param {string} spreadsheetId
 * @param {string} folderId
 */
function moveSpreadsheetToFolder_(spreadsheetId, folderId) {
  try {
    var file = DriveApp.getFileById(spreadsheetId);
    var folder = DriveApp.getFolderById(folderId);
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
  } catch (e) {
    writeErrorLog('moveSpreadsheetToFolder_', e.message, { stackTrace: e.stack || '' });
  }
}

/**
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @param {Object} result
 */
function syncConfigFromSpreadsheet_(ss, result) {
  result.rootFolderId = getConfigValueFromSheet_(ss, CONFIG_KEYS.PROJECT_ROOT_FOLDER_ID);
  result.folderIds = {
    drafts: getConfigValueFromSheet_(ss, CONFIG_KEYS.DRAFTS_FOLDER_ID),
    materials: getConfigValueFromSheet_(ss, CONFIG_KEYS.MATERIALS_FOLDER_ID),
    reports: getConfigValueFromSheet_(ss, CONFIG_KEYS.REPORTS_FOLDER_ID),
    exports: getConfigValueFromSheet_(ss, CONFIG_KEYS.EXPORTS_FOLDER_ID),
    templates: getConfigValueFromSheet_(ss, CONFIG_KEYS.TEMPLATES_FOLDER_ID),
  };
}
