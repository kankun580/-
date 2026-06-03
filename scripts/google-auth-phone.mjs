#!/usr/bin/env node
/**
 * スマホのみで Google 認証（clasp 用）を完了する。
 * - CLASPRC_JSON があれば ~/.clasprc.json に書き込む
 * - CLASP_OAUTH_CALLBACK_URL があればトークン交換（スマホブラウザでコピーしたリダイレクトURL）
 * - どちらもなければ認証URLを生成して artifacts に保存
 */
import { OAuth2Client } from 'google-auth-library';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CLASPRC_PATH = join(homedir(), '.clasprc.json');
const ARTIFACTS_DIR = '/opt/cursor/artifacts';

const CLIENT_ID = '1072944905499-vm2v2i5dvn0a0d2o4ca36i1vge8cvbn0.apps.googleusercontent.com';
const CLIENT_SECRET = 'v6V3fKV_zWU7iw1DrpO1rknX';

const CLASP_SCOPES = [
  'https://www.googleapis.com/auth/script.deployments',
  'https://www.googleapis.com/auth/script.projects',
  'https://www.googleapis.com/auth/script.webapp.deploy',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/service.management',
  'https://www.googleapis.com/auth/logging.read',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/cloud-platform',
];

function getRedirectUri() {
  const port = process.env.CLASP_REDIRECT_PORT || '8888';
  return `http://localhost:${port}`;
}

function parseCallbackUrl(url) {
  const parsed = new URL(url, 'http://localhost/');
  const code = parsed.searchParams.get('code');
  const error = parsed.searchParams.get('error');
  if (error) throw new Error('OAuth error: ' + error);
  if (!code) throw new Error('URL に code がありません。ログイン後のアドレスバー全文をコピーしてください。');
  return code;
}

function writeClasprc(tokens) {
  const store = {
    tokens: {
      default: {
        type: 'authorized_user',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: tokens.refresh_token,
        access_token: tokens.access_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type || 'Bearer',
      },
    },
  };
  writeFileSync(CLASPRC_PATH, JSON.stringify(store, null, 2), { mode: 0o600 });
  return CLASPRC_PATH;
}

export function hasGoogleAuth() {
  if (process.env.CLASPRC_JSON) return true;
  if (process.env.CLASP_OAUTH_CALLBACK_URL) return true;
  return existsSync(CLASPRC_PATH);
}

export async function ensureGoogleAuth() {
  if (process.env.CLASPRC_JSON) {
    writeFileSync(CLASPRC_PATH, process.env.CLASPRC_JSON, { mode: 0o600 });
    console.log('✓ CLASPRC_JSON を適用しました');
    return CLASPRC_PATH;
  }

  if (existsSync(CLASPRC_PATH)) {
    console.log('✓ 既存の Google 認証を使用します');
    return CLASPRC_PATH;
  }

  const callback = process.env.CLASP_OAUTH_CALLBACK_URL;
  if (callback) {
    const redirectUri = getRedirectUri();
    const client = new OAuth2Client({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, redirectUri });
    const code = parseCallbackUrl(callback);
    const { tokens } = await client.getToken({ code, redirect_uri: redirectUri });
    const path = writeClasprc(tokens);
    console.log('✓ スマホ OAuth コールバックから認証を完了しました');
    return path;
  }

  const redirectUri = getRedirectUri();
  const client = new OAuth2Client({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, redirectUri });
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: CLASP_SCOPES,
    redirect_uri: redirectUri,
    prompt: 'consent',
  });

  try {
    mkdirSync(ARTIFACTS_DIR, { recursive: true });
    const artifactPath = join(ARTIFACTS_DIR, 'google-oauth-url.txt');
    writeFileSync(
      artifactPath,
      authUrl + '\n\nスマホのブラウザで開き、ログイン後に表示される URL（localhost 始まり）を\n' +
        'Cursor Secret「CLASP_OAUTH_CALLBACK_URL」に登録するか、チャットに貼って再実行してください。\n',
      'utf8'
    );
    console.log('認証URLを保存:', artifactPath);
  } catch {
    /* artifacts 不可時はログのみ */
  }

  console.log('\n--- スマホで Google 認証（初回のみ）---\n');
  console.log(authUrl);
  console.log('\n-------------------------------------\n');

  throw new Error(
    'Google 認証が未設定です。スマホで上記URLを開き、表示されたURLを CLASP_OAUTH_CALLBACK_URL に登録後、Agent を再実行してください。'
  );
}

if (process.argv[1]?.endsWith('google-auth-phone.mjs')) {
  ensureGoogleAuth().then((p) => console.log('OK:', p)).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
