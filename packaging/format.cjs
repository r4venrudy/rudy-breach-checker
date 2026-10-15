const crypto = require('node:crypto');

// SHA-256 of the trimmed, lowercased address (what /hashmail sends instead of the email)
function hashEmail(email) {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

const SHA256_RE = /^[a-f0-9]{64}$/i;

// /hashmail accepts either an address or a SHA-256 the user already computed
function isSha256(text) {
  return SHA256_RE.test(String(text).trim());
}

function hashQuery(input) {
  return isSha256(input) ? input.trim().toLowerCase() : hashEmail(input);
}

// Packs lines into Discord embed field values (max 1024 characters each).
function chunkLines(lines, limit) {
  const chunks = [];
  let cur = '';
  for (let line of lines) {
    if (line.length > limit) line = line.slice(0, limit - 1) + '…';
    if (cur && cur.length + line.length + 1 > limit) {
      chunks.push(cur);
      cur = '';
    }
    cur += (cur ? '\n' : '') + line;
  }
  if (cur) chunks.push(cur);
  return chunks;
}

// Providers return sources as strings or { name, date } objects; number them for display,
// newest breach first when dates are given ("2023-05" and "2019" sort as text), undated ones last.
function sourceLines(sources) {
  const dated = s => (typeof s === 'object' && s && typeof s.date === 'string' ? s.date : '');
  return [...sources].sort((a, b) => dated(b).localeCompare(dated(a))).map((s, i) =>
    typeof s === 'object' && s && s.name
      ? `${i + 1}. ${s.name}${s.date ? ` (${s.date})` : ''}`
      : `${i + 1}. ${typeof s === 'object' ? JSON.stringify(s) : s}`
  );
}

// Inline code that survives backticks in user input: Discord accepts ``x`y`` like CommonMark
function codeSpan(text) {
  const t = String(text);
  return t.includes('`') ? `\`\` ${t.replace(/``+/g, m => m.split('').join('\u200b'))} \`\`` : `\`${t}\``;
}

// Discord rejects embeds over 6000 characters in total, so keep field values only up to `budget`
// characters (leaving room for the title, the other fields and the footer).
function fitParts(parts, budget = 4500) {
  const shown = [];
  let used = 0;
  for (const part of parts) {
    if (used + part.length > budget) break;
    shown.push(part);
    used += part.length;
  }
  return { shown, hidden: parts.length - shown.length };
}

module.exports = { chunkLines, sourceLines, hashEmail, hashQuery, isSha256, codeSpan, fitParts };
