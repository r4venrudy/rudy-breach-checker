const test = require('node:test');
const assert = require('node:assert');
const { createCooldown } = require('./cooldown.cjs');

test('a user waits out the cooldown, other users are not affected', () => {
  let t = 1000;
  const cd = createCooldown(10000, () => t);
  assert.strictEqual(cd.take('a'), 0);
  assert.strictEqual(cd.take('b'), 0);
  t += 4000;
  assert.strictEqual(cd.take('a'), 6000);
  t += 6000;
  assert.strictEqual(cd.take('a'), 0);
});
