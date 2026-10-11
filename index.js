const fs = require('fs');
const path = require('path');

const REQUIRED_FILE = path.join(__dirname, 'raven.png');

function ravenFail() {
  console.error('Kabul etmesende mahçupsun - r4ven.leet. Fotoğrafımı geri yükle');
  process.exit(1);
}

if (!fs.existsSync(REQUIRED_FILE)) {
  ravenFail();
}

try {
  const stat = fs.statSync(REQUIRED_FILE);
  if (!stat.isFile() || stat.size < 1024) {
    ravenFail();
  }
} catch {
  ravenFail();
}

const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const crypto = require('crypto');

// Prefer environment variables so secrets don't have to live in the source file.
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || 'DISCORD BOT TOKEN HERE';
const CLIENT_ID = process.env.CLIENT_ID || 'CLIENT ID HERE';
const LEAKCHECK_API = process.env.LEAKCHECK_API || 'LEAKCHECK API URL';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

function hashEmail(email) {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

async function checkLeak(query) {
  try {
    const url = `${LEAKCHECK_API}?check=${encodeURIComponent(query)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) return { error: `API returned status ${response.status}` };
    return await response.json();
  } catch (e) {
    if (e.name === 'TimeoutError') return { error: 'Breach API did not answer within 15 seconds' };
    return { error: e.message };
  }
}

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

function createEmbed(data, query, type) {
  const embed = new EmbedBuilder()
    .setColor(data.found ? '#ff0000' : '#00ff00')
    .setTitle('🔍 Rudy Breach Checker')
    .setTimestamp();

  if (data.error) {
    embed.setDescription(`❌ Error: ${data.error}`);
    return embed;
  }

  embed.addFields(
    { name: 'Query', value: `\`${query}\``, inline: true },
    { name: 'Type', value: type, inline: true },
    { name: 'Status', value: data.found ? '✅ Found in Breaches' : '❌ Not Found', inline: true }
  );

  if (data.found && data.sources) {
    const arr = Array.isArray(data.sources) ? data.sources : [data.sources];
    const lines = arr.map((s, i) =>
      typeof s === 'object' && s && s.name
        ? `${i + 1}. ${s.name}${s.date ? ` (${s.date})` : ''}`
        : `${i + 1}. ${s}`
    );
    const parts = chunkLines(lines, 1024);
    // An embed holds 25 fields; 3 are used above and 1 is kept for exposed data.
    const shown = parts.slice(0, 20);
    shown.forEach((value, i) => {
      embed.addFields({
        name: shown.length === 1 ? `📋 Breaches Found (${arr.length})` : `📋 Breaches Found (Part ${i + 1})`,
        value
      });
    });
    if (parts.length > shown.length) {
      embed.setFooter({ text: `${parts.length - shown.length} more part(s) not shown` });
    }
  }

  if (data.found && data.fields) {
    embed.addFields({
      name: '📊 Exposed Data',
      value: `\`${String(Array.isArray(data.fields) ? data.fields.join(', ') : data.fields).slice(0, 1000)}\``
    });
  }

  return embed;
}

const commands = [
  new SlashCommandBuilder()
    .setName('mail')
    .setDescription('Search for leaks by email address')
    .addStringOption(o => o.setName('email').setDescription('Email').setRequired(true)),
  new SlashCommandBuilder()
    .setName('hashmail')
    .setDescription('Search for leaks by hashed email (SHA256)')
    .addStringOption(o => o.setName('email').setDescription('Email').setRequired(true)),
  new SlashCommandBuilder()
    .setName('usernamev2')
    .setDescription('Search for leaks by username')
    .addStringOption(o => o.setName('username').setDescription('Username').setRequired(true))
];

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
}

client.once('ready', () => {
  console.log(`Bot aktif: ${client.user.tag}`);
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const email = interaction.options.getString('email');
  if (email !== null && !EMAIL_RE.test(email.trim())) {
    await interaction.reply({ content: '❌ That does not look like an email address.', ephemeral: true });
    return;
  }

  // Breach results about a person's email are sensitive: show them only to the requester.
  await interaction.deferReply({ ephemeral: true });

  let query, type, result;

  if (interaction.commandName === 'mail') {
    query = interaction.options.getString('email');
    type = 'Email';
    result = await checkLeak(query);
  }

  if (interaction.commandName === 'hashmail') {
    const email = interaction.options.getString('email');
    query = hashEmail(email);
    type = 'Hashed Email';
    result = await checkLeak(query);
  }

  if (interaction.commandName === 'usernamev2') {
    query = interaction.options.getString('username');
    type = 'Username';
    result = await checkLeak(query);
  }

  const embed = createEmbed(result, query, type);
  await interaction.editReply({ embeds: [embed] });
});

registerCommands().then(() => client.login(DISCORD_TOKEN));
