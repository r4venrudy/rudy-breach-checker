const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadConfig } = require('./config.cjs');

test('control bytes inside credential values fail before a client is started', () => {
  const filename=path.join(os.tmpdir(),'absent-rudy-config-'+process.pid+'.json');
  for (const code of [...Array(32).keys(),127]) {
    const value='dummy-left'+String.fromCharCode(code)+'right';
    assert.throws(()=>loadConfig({token:'DISCORD_TOKEN'},{env:{DISCORD_TOKEN:value},filename}), error=>/control characters/.test(error.message)&&!error.message.includes('dummy-left'));
  }
  assert.equal(loadConfig({token:'DISCORD_TOKEN'},{env:{DISCORD_TOKEN:' \tdummy-normal\n'},filename}).token,'dummy-normal');
});
