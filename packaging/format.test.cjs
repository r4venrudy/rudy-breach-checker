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
    ['1. Adobe', '2. LinkedIn (2016-05)', '3. Canva', '4. {"id":7}']
  );
});
