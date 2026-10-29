const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadConfig } = require('./config.cjs');
test('UTF-8 BOM configuration preserves Unicode tokens without file mutation', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rudy-bom-'));
  const filename = path.join(dir, 'config.json');
  const original = '\uFEFF' + JSON.stringify({ token: 'dummy-\u00e9', clientId: '12345678901234567' });
  try {
    fs.writeFileSync(filename, original, 'utf8');
    assert.deepEqual(loadConfig({ token:'DISCORD_TOKEN', clientId:'CLIENT_ID' }, {env:{},filename}), {token:'dummy-\u00e9',clientId:'12345678901234567'});
    assert.equal(fs.readFileSync(filename,'utf8'),original);
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
