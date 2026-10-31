const fs = require('node:fs');
function readConfigFile(filename) {
  const fd = fs.openSync(filename, fs.constants.O_RDONLY | (fs.constants.O_NONBLOCK || 0));
  try {
    if (!fs.fstatSync(fd).isFile()) throw new Error('Configuration path must be a regular file');
    const buffer = Buffer.alloc(65537);
    let size = 0;
    while (size < buffer.length) {
      const count = fs.readSync(fd, buffer, size, buffer.length - size, null);
      if (!count) break;
      size += count;
    }
    if (size > 65536) throw new Error('Configuration file exceeds 64 KiB');
    const text = new TextDecoder('utf-8', {fatal:true}).decode(buffer.subarray(0,size));
    try { return JSON.parse(text.replace(/^\uFEFF/, '')); }
    catch { throw new Error('Configuration must contain valid JSON'); }
  } finally { fs.closeSync(fd); }
}
function loadConfig(spec, options = {}) {
  const env = options.env || process.env;
  const filename = options.filename || env.RUDY_CONFIG || 'config.json';
  if (!options.filename && env.RUDY_CONFIG && !fs.existsSync(filename)) throw new Error('RUDY_CONFIG must identify an existing regular file');
  const data = fs.existsSync(filename) ? readConfigFile(filename) : {};
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Configuration must be a JSON object');
  const result = {};
  for (const [key, variable] of Object.entries(spec)) result[key] = env[variable] || data[key] || '';
  for (const key of Object.keys(result)) if (typeof result[key] === 'string') result[key] = result[key].trim();
  const controls = Object.keys(result).filter(key => typeof result[key] === 'string' && /[\u0000-\u001F\u007F]/.test(result[key]));
  if (controls.length) throw new Error('Invalid control characters in configuration: ' + controls.map(key => spec[key]).join(', '));
  const malformed = Object.keys(result).filter(key => typeof result[key] === 'string' && /[\uD800-\uDFFF]/u.test(result[key]));
  if (malformed.length) throw new Error('Invalid Unicode in configuration: ' + malformed.map(key => spec[key]).join(', '));
  const missing = Object.keys(result).filter(key => typeof result[key] !== 'string' || !result[key].trim() || /^(YOUR_|DISCORD TOKEN|YOUR CLIENT)/i.test(result[key]));
  if (missing.length) throw new Error('Missing configuration: ' + missing.map(key => spec[key]).join(', '));
  const clientId = result.clientId || result.CLIENT_ID;
  if (clientId && (!/^\d{17,22}$/.test(clientId) || BigInt(clientId) > 18446744073709551615n)) throw new Error('CLIENT_ID must be a Discord application ID within the unsigned 64-bit range');
  return result;
}
module.exports = { loadConfig };
