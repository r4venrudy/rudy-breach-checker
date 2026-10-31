const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadConfig } = require('./config.cjs');

test('an explicitly selected RUDY_CONFIG cannot silently disappear behind environment credentials', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rudy-selected-'));
  try {
    const missing=path.join(dir,'missing.json');
    assert.throws(()=>loadConfig({token:'DISCORD_TOKEN'},{env:{RUDY_CONFIG:missing,DISCORD_TOKEN:'dummy-env'}}),/RUDY_CONFIG/);
    assert.throws(()=>loadConfig({token:'DISCORD_TOKEN'},{env:{RUDY_CONFIG:dir,DISCORD_TOKEN:'dummy-env'}}),/regular file/);
    const explicit=path.join(dir,'explicit.json');fs.writeFileSync(explicit,JSON.stringify({token:'dummy-file'}));
    assert.equal(loadConfig({token:'DISCORD_TOKEN'},{env:{RUDY_CONFIG:missing},filename:explicit}).token,'dummy-file');
    assert.equal(loadConfig({token:'DISCORD_TOKEN'},{env:{DISCORD_TOKEN:'dummy-env'},filename:missing}).token,'dummy-env');
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
