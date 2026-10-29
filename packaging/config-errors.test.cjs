const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadConfig } = require('./config.cjs');
test('malformed configuration diagnostics never echo credential fragments', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rudy-errors-')),filename=path.join(dir,'config.json');
  try {
    for (const body of ['dummy-private-credential', '{"token":"dummy-private-credential",}']) {
      fs.writeFileSync(filename,body);
      assert.throws(()=>loadConfig({token:'DISCORD_TOKEN'},{env:{},filename}),error=>{
        assert.equal(error.message,'Configuration must contain valid JSON');
        assert.ok(!String(error.stack).includes('dummy-private-credential'));
        assert.equal(error.cause,undefined);
        return true;
      });
    }
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
