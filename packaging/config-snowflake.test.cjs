const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadConfig } = require('./config.cjs');

test('application IDs fit an unsigned 64-bit snowflake without Number rounding', () => {
  const filename=path.join(os.tmpdir(),'absent-rudy-config-'+process.pid+'.json');
  for (const value of ['18446744073709551616','99999999999999999999','9999999999999999999999'])
    assert.throws(()=>loadConfig({token:'DISCORD_TOKEN',clientId:'CLIENT_ID'},{env:{DISCORD_TOKEN:'dummy-token',CLIENT_ID:value},filename}),/CLIENT_ID/);
  const value='18446744073709551615';
  assert.equal(loadConfig({token:'DISCORD_TOKEN',clientId:'CLIENT_ID'},{env:{DISCORD_TOKEN:'dummy-token',CLIENT_ID:value},filename}).clientId,value);
});
