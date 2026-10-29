const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadConfig } = require('./config.cjs');
test('non-object JSON configuration is rejected even with complete environment credentials', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rudy-shape-')), filename=path.join(dir,'config.json');
  try {
    for (const value of [null,[],false,42,'dummy-secret']) {
      fs.writeFileSync(filename,JSON.stringify(value));
      assert.throws(()=>loadConfig({token:'DISCORD_TOKEN'},{env:{DISCORD_TOKEN:'dummy-env'},filename}),/Configuration must be a JSON object/);
    }
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
