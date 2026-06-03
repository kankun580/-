/**
 * インストール後の自動セットアップ（GAS 内で完結）
 */

/**
 * 定期トリガーで未セットアップなら setupProject を実行
 * clasp push 後に bootstrapAll または本関数を1回実行するか、トリガー登録で自動化
 */
function ensureProjectSetup() {
  try {
    var props = PropertiesService.getScriptProperties();
    if (props.getProperty(CONFIG_KEYS.SETUP_COMPLETED_AT)) {
      return { skipped: true, reason: 'already_setup' };
    }
    if (!props.getProperty(SCRIPT_PROPERTY_KEYS.GEMINI_API_KEY)) {
      return { skipped: true, reason: 'gemini_key_missing' };
    }
    return setupProject();
  } catch (e) {
    writeErrorLog('ensureProjectSetup', e.message, { stackTrace: e.stack || '' });
    throw e;
  }
}

/**
 * 時間ベーストリガーを登録（重複しない）
 */
function installAutomationTriggers() {
  var handlers = ['ensureProjectSetup'];
  var existing = ScriptApp.getProjectTriggers().map(function (t) {
    return t.getHandlerFunction();
  });
  var created = [];
  handlers.forEach(function (name) {
    if (existing.indexOf(name) === -1) {
      ScriptApp.newTrigger(name).timeBased().everyHours(6).create();
      created.push(name);
    }
  });
  writeOperationLog('system', 'installAutomationTriggers', {
    comment: 'created: ' + created.join(', '),
  });
  return { created: created };
}
