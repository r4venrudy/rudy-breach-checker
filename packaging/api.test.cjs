const test = require('node:test');
const assert = require('node:assert');
const { checkLeak } = require('./api.cjs');

const API = 'https://breach.example/api';
const quiet = () => {};
const reply = (status, body) => async () => ({ ok: status < 400, status, json: async () => (typeof body === 'string' ? JSON.parse(body) : body) });

test('sends the query as ?check= and the optional key as a header', async () => {
  let seen;
  const fetchImpl = async (url, opts) => { seen = { url: String(url), headers: opts.headers }; return reply(200, { found: false })(); };
  const out = await checkLeak(API, 'a@b.co', { fetchImpl, env: { LEAKCHECK_API_KEY: 'k', LEAKCHECK_API_KEY_HEADER: 'Authorization' } });
  assert.deepStrictEqual(out, { found: false });
  assert.strictEqual(seen.url, 'https://breach.example/api?check=a%40b.co');
  assert.deepStrictEqual(seen.headers, { Authorization: 'k' });
});

test('HTTP errors and malformed bodies become error results', async () => {
  assert.deepStrictEqual(await checkLeak(API, 'x', { fetchImpl: reply(503, {}), env: {} }), { error: 'API returned status 503' });
  assert.match((await checkLeak(API, 'x', { fetchImpl: reply(200, '{"ok":true}'), env: {} })).error, /missing "found"/);
  assert.match((await checkLeak(API, 'x', { fetchImpl: reply(200, 'not json'), env: {} })).error, /missing "found"/);
});

test('network failures name their cause', async () => {
  const fetchImpl = async () => { const e = new TypeError('fetch failed'); e.cause = { code: 'ENOTFOUND' }; throw e; };
  assert.deepStrictEqual(await checkLeak(API, 'x', { fetchImpl, env: {}, log: quiet }), { error: 'Could not reach the breach API (ENOTFOUND)' });
});

test('timeouts get their own message', async () => {
  const fetchImpl = async () => { const e = new Error('timed out'); e.name = 'TimeoutError'; throw e; };
  assert.match((await checkLeak(API, 'x', { fetchImpl, env: {} })).error, /within 15 seconds/);
});

test('rate limit and rejected key get plain messages', async () => {
  assert.match((await checkLeak(API, 'x', { fetchImpl: reply(429, {}), env: {} })).error, /rate limit/);
  assert.match((await checkLeak(API, 'x', { fetchImpl: reply(401, {}), env: {} })).error, /LEAKCHECK_API_KEY/);
});
