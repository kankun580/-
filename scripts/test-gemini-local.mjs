#!/usr/bin/env node
/**
 * GAS 外で Gemini API 疎通を確認（GEMINI_API_KEY 環境変数が必要）
 */
const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL_DEFAULT || 'gemini-2.0-flash';

if (!apiKey) {
  console.error('GEMINI_API_KEY が未設定です。');
  process.exit(1);
}

const url =
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` +
  encodeURIComponent(apiKey);

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: 'Reply with exactly: OK' }] }],
  }),
});

const body = await res.json();
if (!res.ok) {
  console.error('Gemini API error:', res.status, body.error?.message || body);
  process.exit(1);
}

const text =
  body.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
const ok = text.includes('OK');
console.log(JSON.stringify({ ok, model, sampleText: text.slice(0, 200) }, null, 2));
process.exit(ok ? 0 : 1);
