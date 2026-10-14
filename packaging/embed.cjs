// Builds the result embed as a plain Discord API object (discord.js accepts these directly),
// so the layout can be tested without a Discord client.
const { chunkLines, sourceLines, codeSpan, fitParts } = require('./format.cjs');

const COLORS = { error: 0xffa500, found: 0xff0000, clean: 0x00ff00 };

function createEmbed(data, query, type, now = new Date()) {
  const embed = {
    title: '🔍 Rudy Breach Checker',
    color: data.error ? COLORS.error : data.found ? COLORS.found : COLORS.clean,
    timestamp: now.toISOString(),
    fields: []
  };

  if (data.error) {
    embed.description = `❌ Error: ${data.error}`;
    return embed;
  }

  embed.fields.push(
    { name: 'Query', value: codeSpan(query), inline: true },
    { name: 'Type', value: type, inline: true },
    { name: 'Status', value: data.found ? '✅ Found in Breaches' : '❌ Not Found', inline: true }
  );

  if (data.found && data.sources) {
    const arr = Array.isArray(data.sources) ? data.sources : [data.sources];
    const { shown, hidden } = fitParts(chunkLines(sourceLines(arr), 1024));
    shown.forEach((value, i) => {
      embed.fields.push({
        name: shown.length === 1 ? `📋 Breaches Found (${arr.length})` : `📋 Breaches Found (Part ${i + 1})`,
        value
      });
    });
    if (hidden) embed.footer = { text: `${hidden} more part(s) not shown` };
  }

  if (data.found && data.fields) {
    embed.fields.push({
      name: '📊 Exposed Data',
      value: codeSpan(String(Array.isArray(data.fields) ? data.fields.join(', ') : data.fields).slice(0, 1000))
    });
  }

  return embed;
}

module.exports = { createEmbed, COLORS };
