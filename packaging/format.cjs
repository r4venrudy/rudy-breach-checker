const crypto = require('node:crypto');

// SHA-256 of the trimmed, lowercased address (what /hashmail sends instead of the email)
function hashEmail(email) {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
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

// Providers return sources as strings or { name, date } objects; number them for display.
function sourceLines(sources) {
  return sources.map((s, i) =>
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

module.exports = { chunkLines, sourceLines, hashEmail, codeSpan, fitParts };
