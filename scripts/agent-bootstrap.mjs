#!/usr/bin/env node
/**
 * Cloud Agent 用ワンショットブートストラップ（ローカルPC不要）
 * 1. Google 認証（シークレット or スマホ OAuth URL）
 * 2. Gemini 疎通
 * 3. clasp push + setupProject + testGeminiConnection
 */
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureGoogleAuth } from './google-auth-phone.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: opts.silent ? 'pipe' : 'inherit',
    env: process.env,
  });
  if (r.status !== 0) {
    throw new Error(`${cmd} failed: ${(r.stderr || r.stdout || '').slice(0, 500)}`);
  }
  return r.stdout || '';
}

async function main() {
  console.log('=== Agent Bootstrap（スマホ完結・PC不要）===\n');

  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY が未設定です。スマホの Cursor → Secrets に API キーを登録してください。' +
        '（https://aistudio.google.com/apikey ）'
    );
  }

  await ensureGoogleAuth();

  console.log('\n→ Gemini 疎通...');
  run('node', ['scripts/test-gemini-local.mjs']);

  console.log('\n→ リモートセットアップ...');
  run('node', ['scripts/remote-setup.mjs']);

  console.log('\n=== Bootstrap 完了 ===');
}

main().catch((e) => {
  console.error('\n[bootstrap]', e.message);
  process.exit(1);
});
