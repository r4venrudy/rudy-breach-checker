const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadConfig } = require('./config.cjs');
test('read local configuration with a byte limit and strict UTF-8', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rudy-bounds-')),filename=path.join(dir,'config.json');
  const read=()=>loadConfig({token:'DISCORD_TOKEN'},{env:{},filename});
  try {
    const body=JSON.stringify({token:'dummy'});
    fs.writeFileSync(filename,body+' '.repeat(65536-Buffer.byteLength(body)));
    assert.equal(read().token,'dummy');
    fs.appendFileSync(filename,' ');
    assert.throws(read,/exceeds 64 KiB/);
    fs.writeFileSync(filename,JSON.stringify({token:'\u00e9'.repeat(32768)}));
    assert.throws(read,/exceeds 64 KiB/);
    fs.writeFileSync(filename,Buffer.from([0x7b,0x22,0x78,0x22,0x3a,0x22,0xff,0x22,0x7d]));
    assert.throws(read,/encoded data|UTF-8/i);
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
