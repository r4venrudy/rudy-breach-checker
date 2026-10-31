const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadConfig } = require('./config.cjs');

test('unpaired UTF-16 surrogates cannot become replacement-byte credentials', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rudy-unicode-'));const filename=path.join(dir,'config.json');
  try {
    for (const value of ['dummy-\ud800','dummy-\udfff','dummy-\udfff\ud800']) {
      assert.throws(()=>loadConfig({token:'DISCORD_TOKEN'},{env:{DISCORD_TOKEN:value},filename}),/Unicode/);
      fs.writeFileSync(filename,JSON.stringify({token:value}));
      assert.throws(()=>loadConfig({token:'DISCORD_TOKEN'},{env:{},filename}),/Unicode/);
    }
    const value='dummy-\u00e9-\ud83d\ude00';fs.writeFileSync(filename,JSON.stringify({token:value}));
    assert.equal(loadConfig({token:'DISCORD_TOKEN'},{env:{},filename}).token,value);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
