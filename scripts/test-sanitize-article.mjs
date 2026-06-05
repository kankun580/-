/** sanitizeArticleText_ のロジック検証（GAS と同じ正規表現） */

function normalizeMarkdownChars_(text) {
  return String(text || '').replace(/\uFF0A/g, '*').replace(/\uFF3F/g, '_');
}

function sanitizeArticleText_(text) {
  var s = normalizeMarkdownChars_(String(text || ''));
  if (!s) return '';
  var i;
  for (i = 0; i < 8; i++) {
    var next = s.replace(/\*\*([^*]+)\*\*/g, '$1');
    if (next === s) break;
    s = next;
  }
  s = s.replace(/__([^_\n]+)__/g, '$1');
  for (i = 0; i < 4; i++) {
    var italic = s.replace(/\*([^*\n]+)\*/g, '$1');
    if (italic === s) break;
    s = italic;
  }
  s = s.replace(/`([^`\n]+)`/g, '$1');
  s = s.replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1');
  s = s.replace(/^#{1,6}\s+/gm, '');
  s = s.replace(/^[ \t]*[-*_]{3,}[ \t]*$/gm, '');
  s = s.replace(/^[ \t]*\*[ \t]+/gm, '・ ');
  s = s.replace(/^[ \t]*-[ \t]+/gm, '・ ');
  s = s.replace(/\*\*/g, '');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

function hasMarkdownArtifacts_(text) {
  var s = normalizeMarkdownChars_(String(text || ''));
  if (!s) return false;
  return (
    /\*\*/.test(s) ||
    /__[^_\n]+__/.test(s) ||
    /`[^`\n]+`/.test(s) ||
    /^#{1,6}\s/m.test(s) ||
    /\[[^\]]+\]\([^)]+\)/.test(s) ||
    /^[ \t]*\*[ \t]+\S/m.test(s) ||
    /^[ \t]*-[ \t]+\S/m.test(s)
  );
}

const samples = [
  '1. **あなたの「得意」を洗い出す**: 自分の過去の経験',
  '* 例: 効率的なタスク管理術',
  '2. **ターゲットの悩みを考える**: 洗い出した',
  '普通のテキストのみ',
  '1. ＊＊全角星＊＊のテスト',
];

const fullwidth = samples[samples.length - 1];
const fullwidthClean = sanitizeArticleText_(fullwidth);
if (hasMarkdownArtifacts_(fullwidthClean)) {
  console.log('FAIL fullwidth should be cleaned', fullwidthClean);
  process.exit(1);
}
console.log('OK fullwidth', fullwidthClean);

let failed = 0;
for (const raw of samples) {
  const clean = sanitizeArticleText_(raw);
  const remains = hasMarkdownArtifacts_(clean);
  const ok = !remains;
  if (!ok) failed++;
  console.log(ok ? 'OK' : 'FAIL', JSON.stringify({ raw: raw.slice(0, 50), clean: clean.slice(0, 50), remains }));
}
process.exit(failed > 0 ? 1 : 0);
