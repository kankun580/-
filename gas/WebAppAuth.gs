/**
 * OAuth 権限（スマホから再許可）
 */

/**
 * @returns {{ needsAuth: boolean, url: string, status: string }}
 */
function getAuthStatusForWeb() {
  var authInfo = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL);
  var status = authInfo.getAuthorizationStatus();
  var required = status === ScriptApp.AuthorizationStatus.REQUIRED;
  return {
    needsAuth: required,
    url: required ? authInfo.getAuthorizationUrl() : '',
    status: String(status),
  };
}
