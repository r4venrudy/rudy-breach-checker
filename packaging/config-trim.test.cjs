const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadConfig } = require('./config.cjs');
test('normalize surrounding credential whitespace before validation and return', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rudy-trim-')),filename=path.join(dir,'config.json');
  try {
    fs.writeFileSync(filename,JSON.stringify({token:' file-dummy ',clientId:' 12345678901234567\n'}));
    const spec={token:'DISCORD_TOKEN',clientId:'CLIENT_ID'};
    assert.deepEqual(loadConfig(spec,{env:{DISCORD_TOKEN:' \tdummy-env\n'},filename}),{token:'dummy-env',clientId:'12345678901234567'});
    assert.equal(loadConfig(spec,{env:{},filename}).token,'file-dummy');
    assert.throws(()=>loadConfig(spec,{env:{DISCORD_TOKEN:'  YOUR_TOKEN  '},filename}),/Missing configuration/);
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
