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

// Prefer environment variables so secrets don't have to live in the source file.
const { loadConfig } = require('./packaging/config.cjs');
const { chunkLines, sourceLines, hashEmail } = require('./packaging/format.cjs');
const { DISCORD_TOKEN, CLIENT_ID, LEAKCHECK_API } = loadConfig({ DISCORD_TOKEN:'DISCORD_TOKEN', CLIENT_ID:'CLIENT_ID', LEAKCHECK_API:'LEAKCHECK_API' });
const apiUrl = new URL(LEAKCHECK_API);
if (!['https:', 'http:'].includes(apiUrl.protocol)) throw new Error('LEAKCHECK_API must be an HTTP(S) endpoint');
if (process.argv.includes('--check-config')) { console.log('Configuration and dependencies ready'); process.exit(0); }

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});


async function checkLeak(query) {
  try {
    const url = new URL(apiUrl);
    url.searchParams.set('check', query);
    // Optional provider API key, sent as a header so it never appears in URLs or logs
    const headers = process.env.LEAKCHECK_API_KEY
      ? { [process.env.LEAKCHECK_API_KEY_HEADER || 'X-API-Key']: process.env.LEAKCHECK_API_KEY }
      : {};
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!response.ok) return { error: `API returned status ${response.status}` };
    const data = await response.json().catch(() => null);
    // createEmbed relies on a boolean "found"; anything else means the provider speaks a different format
    if (!data || typeof data.found !== 'boolean') return { error: 'Unexpected response from the breach API (missing "found")' };
    return data;
  } catch (e) {
    if (e.name === 'TimeoutError') return { error: 'Breach API did not answer within 15 seconds' };
    return { error: e.message };
  }
}

function createEmbed(data, query, type) {
  const embed = new EmbedBuilder()
    .setColor(data.error ? '#ffa500' : data.found ? '#ff0000' : '#00ff00')
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
    const lines = sourceLines(arr);
    const parts = chunkLines(lines, 1024);
    // Discord rejects embeds over 6000 characters in total, so stop adding breach
    // fields at ~4500 characters to leave room for the title, other fields and footer.
    const shown = [];
    let used = 0;
    for (const part of parts) {
      if (used + part.length > 4500) break;
      shown.push(part);
      used += part.length;
    }
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

const COMMANDS = new Set(['mail', 'hashmail', 'usernamev2']);

async function handleCommand(interaction) {
  if (!interaction.isChatInputCommand()) return;
  if (!COMMANDS.has(interaction.commandName)) return;

  const email = interaction.options.getString('email');
  if (email !== null && !EMAIL_RE.test(email.trim())) {
    await interaction.reply({ content: '❌ That does not look like an email address.', ephemeral: true });
    return;
  }

  const username = interaction.options.getString('username');
  if (username !== null && !username.trim()) {
    await interaction.reply({ content: '❌ Username cannot be empty.', ephemeral: true });
    return;
  }

  // Breach results about a person's email are sensitive: show them only to the requester.
  await interaction.deferReply({ ephemeral: true });

  let query, type, result;

  if (interaction.commandName === 'mail') {
    query = interaction.options.getString('email').trim().toLowerCase();
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
    query = interaction.options.getString('username').trim();
    type = 'Username';
    result = await checkLeak(query);
  }

  const embed = createEmbed(result, query, type);
  await interaction.editReply({ embeds: [embed] });
}

client.on('interactionCreate', async interaction => {
  // An unhandled rejection (expired interaction, Discord outage) would crash the whole bot on Node 15+
  try {
    await handleCommand(interaction);
  } catch (err) {
    console.error(`/${interaction.commandName} failed:`, err);
  }
});

registerCommands()
  .then(() => client.login(DISCORD_TOKEN))
  .catch(err => {
    console.error(`Startup failed: ${err.message}`);
    process.exit(1);
  });
