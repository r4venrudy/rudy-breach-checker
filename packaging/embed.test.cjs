const test = require('node:test');
const assert = require('node:assert');
const { createEmbed, COLORS } = require('./embed.cjs');

const NOW = new Date('2026-10-14T12:00:00Z');

test('error responses get an orange embed with only a description', () => {
  const e = createEmbed({ error: 'timeout' }, 'a@b.co', 'Email', NOW);
  assert.strictEqual(e.color, COLORS.error);
  assert.strictEqual(e.description, '❌ Error: timeout');
  assert.deepStrictEqual(e.fields, []);
});

test('a clean result is green with query, type and status', () => {
  const e = createEmbed({ found: false }, 'a@b.co', 'Email', NOW);
  assert.strictEqual(e.color, COLORS.clean);
  assert.deepStrictEqual(e.fields.map(f => f.name), ['Query', 'Type', 'Status']);
  assert.strictEqual(e.timestamp, '2026-10-14T12:00:00.000Z');
});

test('a hit lists sources and exposed fields', () => {
  const e = createEmbed({ found: true, sources: [{ name: 'Example', date: '2021-01' }], fields: ['email', 'password'] }, 'raven', 'Username', NOW);
  assert.strictEqual(e.color, COLORS.found);
  assert.deepStrictEqual(e.fields.slice(3), [
    { name: '📋 Breaches Found (1)', value: '1. Example (2021-01)' },
    { name: '📊 Exposed Data', value: '`email, password`' }
  ]);
});

test('very long source lists stay under the embed limit and say how much was cut', () => {
  const sources = Array.from({ length: 600 }, (_, i) => `breach-number-${i}`);
  const e = createEmbed({ found: true, sources }, 'x', 'Username', NOW);
  const total = e.fields.reduce((n, f) => n + f.name.length + f.value.length, 0);
  assert.ok(total < 6000);
  assert.match(e.footer.text, /more part\(s\) not shown/);
});
