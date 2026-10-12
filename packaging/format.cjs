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

module.exports = { chunkLines, sourceLines };
