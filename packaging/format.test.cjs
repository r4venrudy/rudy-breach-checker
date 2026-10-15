const test = require('node:test');
const assert = require('node:assert');
const { chunkLines } = require('./format.cjs');

test('packs lines into fields under the limit without losing any', () => {
  const lines = Array.from({ length: 300 }, (_, i) => `${i + 1}. Breach ${i} (2020-01-01)`);
  const chunks = chunkLines(lines, 1024);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every(c => c.length <= 1024));
  assert.deepStrictEqual(chunks.join('\n').split('\n'), lines);
});

test('truncates a single over-long line', () => {
  const [chunk] = chunkLines(['x'.repeat(2000)], 1024);
  assert.strictEqual(chunk.length, 1024);
  assert.ok(chunk.endsWith('…'));
});

test('empty input gives no chunks', () => {
  assert.deepStrictEqual(chunkLines([], 1024), []);
});

const { sourceLines } = require('./format.cjs');

test('sourceLines numbers strings and named objects', () => {
  assert.deepStrictEqual(
    sourceLines(['Adobe', { name: 'LinkedIn', date: '2016-05' }, { name: 'Canva' }, { id: 7 }]),
    ['1. LinkedIn (2016-05)', '2. Adobe', '3. Canva', '4. {"id":7}']
  );
});

const { hashEmail } = require('./format.cjs');

test('hashEmail normalizes before hashing', () => {
  const expected = '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b';
  assert.strictEqual(hashEmail('test@example.com'), expected);
  assert.strictEqual(hashEmail('  Test@Example.COM '), expected);
});

const { codeSpan } = require('./format.cjs');

test('codeSpan keeps backticks in user input from breaking the formatting', () => {
  assert.strictEqual(codeSpan('raven'), '`raven`');
  assert.strictEqual(codeSpan('ra`ven'), '`` ra`ven ``');
  assert.ok(!codeSpan('a``b').slice(3, -3).includes('``'));
});

const { fitParts } = require('./format.cjs');

test('fitParts stops before the embed budget and counts what was left out', () => {
  const parts = ['a'.repeat(1000), 'b'.repeat(1000), 'c'.repeat(1000), 'd'.repeat(1000), 'e'.repeat(1000)];
  const { shown, hidden } = fitParts(parts);
  assert.strictEqual(shown.length, 4);
  assert.strictEqual(hidden, 1);
  assert.deepStrictEqual(fitParts([]), { shown: [], hidden: 0 });
});

test('hashQuery passes a ready SHA-256 through and hashes addresses', () => {
  const { hashQuery, hashEmail, isSha256 } = require('./format.cjs');
  const h = hashEmail('a@b.co');
  assert.equal(hashQuery(h.toUpperCase()), h);
  assert.equal(hashQuery(' A@B.co '), h);
  assert.ok(isSha256(h));
  assert.ok(!isSha256('a@b.co'));
});

test('sourceLines lists the newest breach first', () => {
  const { sourceLines } = require('./format.cjs');
  assert.deepEqual(sourceLines([{ name: 'Old', date: '2016-10' }, 'NoDate', { name: 'New', date: '2023-05' }]),
    ['1. New (2023-05)', '2. Old (2016-10)', '3. NoDate']);
});
