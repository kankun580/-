#!/usr/bin/env node
/** Web アプリを正しい entryPoint でデプロイし URL を表示 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { google } from 'googleapis';

const scriptId = JSON.parse(readFileSync(join(process.cwd(), '.clasp.json'), 'utf8')).scriptId;
const c = JSON.parse(readFileSync(join(homedir(), '.clasprc.json'), 'utf8')).tokens.default;
const auth = new google.auth.OAuth2(c.client_id, c.client_secret);
auth.setCredentials({ refresh_token: c.refresh_token });

const script = google.script({ version: 'v1', auth });

const versionRes = await script.projects.versions.create({
  scriptId,
  requestBody: { description: 'Web app fix ' + new Date().toISOString() },
});
const versionNumber = versionRes.data.versionNumber;

// clasp deploy が manifest の webapp 設定を反映する（推奨）
import { spawnSync } from 'node:child_process';
const clasp = spawnSync('npx', ['clasp', 'deploy', '--description', 'Tips AI Web App'], {
  cwd: process.cwd(),
  encoding: 'utf8',
});
console.log(clasp.stdout || clasp.stderr);
const m = (clasp.stdout || '').match(/AKfycb[\w-]+/);
if (!m) process.exit(clasp.status || 1);
const deploymentId = m[0];
const getRes = await script.projects.deployments.get({ scriptId, deploymentId });
const url = getRes.data.entryPoints?.[0]?.webApp?.url;
console.log(JSON.stringify({ deploymentId, url, setupUrl: url + '?page=setup' }, null, 2));
