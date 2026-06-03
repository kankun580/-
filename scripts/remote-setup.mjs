#!/usr/bin/env node
/**
 * clasp push → bootstrapGeminiKey → setupProject → testGeminiConnection
 *
 * 必要な環境変数（Cursor Cloud Agent の Secrets 推奨）:
 *   GEMINI_API_KEY  — Gemini API キー
 *   CLASPRC_JSON    — ローカルで clasp login 後の ~/.clasprc.json の中身
 *   CLASP_SCRIPT_ID — 既存 GAS プロジェクト ID（省略時は create）
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const CLASP = join(ROOT, 'node_modules', '.bin', 'clasp');

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: opts.silent ? 'pipe' : 'inherit',
    env: { ...process.env, ...opts.env },
  });
  if (r.status !== 0) {
    const err = (r.stderr || r.stdout || '').trim();
    throw new Error(`${cmd} ${args.join(' ')} failed (${r.status}): ${err}`);
  }
  return r.stdout || '';
}

function ensureClaspAuth() {
  const clasprcPath = join(homedir(), '.clasprc.json');
  if (process.env.CLASPRC_JSON) {
    writeFileSync(clasprcPath, process.env.CLASPRC_JSON, { mode: 0o600 });
    console.log('✓ CLASPRC_JSON から ~/.clasprc.json を作成しました');
    return;
  }
  if (existsSync(clasprcPath)) {
    console.log('✓ 既存の ~/.clasprc.json を使用します');
    return;
  }
  throw new Error(
    'clasp 未ログインです。\n' +
      '  1) ローカルで clasp login 後、~/.clasprc.json を CLASPRC_JSON シークレットに登録\n' +
      '  2) または Cloud Agent で clasp login を完了させる'
  );
}

function ensureClaspProject() {
  const claspJson = join(ROOT, '.clasp.json');
  if (existsSync(claspJson)) {
    console.log('✓ .clasp.json あり');
    return JSON.parse(readFileSync(claspJson, 'utf8')).scriptId;
  }
  const scriptId = process.env.CLASP_SCRIPT_ID;
  if (scriptId) {
    writeFileSync(
      claspJson,
      JSON.stringify({ scriptId, rootDir: 'gas', fileExtension: 'gs' }, null, 2) + '\n'
    );
    console.log('✓ CLASP_SCRIPT_ID から .clasp.json を作成しました');
    return scriptId;
  }
  console.log('→ 新規 GAS プロジェクトを作成します...');
  run(CLASP, ['create', '--type', 'standalone', '--title', 'Tips AI Auto Sales', '--rootDir', 'gas']);
  return JSON.parse(readFileSync(claspJson, 'utf8')).scriptId;
}

function claspRun(functionName, params = []) {
  const args = ['run', functionName];
  if (params.length) {
    args.push('--params', JSON.stringify(params));
  }
  const out = run(CLASP, args, { silent: true });
  return { raw: out.trim() };
}

async function main() {
  console.log('=== Tips AI リモートセットアップ ===\n');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY が未設定です（Cursor Secrets に登録してください）');
  }

  // ローカル疎通（GAS 前）
  console.log('→ Gemini API ローカル疎通テスト...');
  const local = spawnSync('node', [join(ROOT, 'scripts', 'test-gemini-local.mjs')], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'inherit',
    env: process.env,
  });
  if (local.status !== 0) {
    throw new Error('Gemini ローカル疎通に失敗しました');
  }

  ensureClaspAuth();
  const scriptId = ensureClaspProject();
  console.log('Script ID:', scriptId);

  console.log('→ clasp push...');
  run(CLASP, ['push', '-f']);

  console.log('→ bootstrapGeminiKey...');
  console.log(claspRun('bootstrapGeminiKey', [apiKey, true]));

  console.log('→ setupProject...');
  console.log(JSON.stringify(claspRun('setupProject'), null, 2));

  console.log('→ testGeminiConnection...');
  console.log(JSON.stringify(claspRun('testGeminiConnection'), null, 2));

  console.log('\n=== セットアップ完了 ===');
}

main().catch((e) => {
  console.error('\n[エラー]', e.message);
  process.exit(1);
});
