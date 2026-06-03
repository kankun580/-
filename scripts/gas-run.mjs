#!/usr/bin/env node
/** Apps Script API で関数を実行 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { google } from 'googleapis';

const scriptId = process.argv[2] || JSON.parse(readFileSync(join(process.cwd(), '.clasp.json'), 'utf8')).scriptId;
const functionName = process.argv[3] || 'getProjectStatus';
const params = process.argv[4] ? JSON.parse(process.argv[4]) : [];

const store = JSON.parse(readFileSync(join(homedir(), '.clasprc.json'), 'utf8'));
const creds = store.tokens.default;
const oauth2 = new google.auth.OAuth2(creds.client_id, creds.client_secret);
oauth2.setCredentials({
  refresh_token: creds.refresh_token,
  access_token: creds.access_token,
});

const script = google.script({ version: 'v1', auth: oauth2 });
const res = await script.scripts.run({
  scriptId,
  requestBody: { function: functionName, parameters: params, devMode: true },
});
if (res.data.error) {
  console.error(JSON.stringify(res.data.error, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(res.data.response?.result ?? res.data, null, 2));
