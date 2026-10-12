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

module.exports = { chunkLines };
