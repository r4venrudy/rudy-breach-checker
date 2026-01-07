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

const DISCORD_TOKEN = 'DISCORD BOT TOKEN HERE';
const CLIENT_ID = 'CLIENT ID HERE';
const LEAKCHECK_API = 'LEAKCHECK API URL';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

function hashEmail(email) {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

async function checkLeak(query) {
  try {
    const url = `${LEAKCHECK_API}?check=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) return { error: `API returned status ${response.status}` };
    return await response.json();
  } catch (e) {
    return { error: e.message };
  }
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
    let breachList = '';

    if (Array.isArray(data.sources)) {
      breachList = data.sources.map((s, i) => {
        if (typeof s === 'object' && s.name) {
          return `${i + 1}. ${s.name}${s.date ? ` (${s.date})` : ''}`;
        }
        return `${i + 1}. ${s}`;
      }).join('\n');
    } else if (typeof data.sources === 'object' && data.sources.name) {
      breachList = `1. ${data.sources.name}${data.sources.date ? ` (${data.sources.date})` : ''}`;
    } else {
      breachList = data.sources;
    }

    if (breachList.length > 1024) {
      const arr = Array.isArray(data.sources) ? data.sources : [data.sources];
      const mid = Math.ceil(arr.length / 2);

      const p1 = arr.slice(0, mid).map((b, i) =>
        typeof b === 'object' && b.name
          ? `${i + 1}. ${b.name}${b.date ? ` (${b.date})` : ''}`
          : `${i + 1}. ${b}`
      ).join('\n');

      const p2 = arr.slice(mid).map((b, i) =>
        typeof b === 'object' && b.name
          ? `${mid + i + 1}. ${b.name}${b.date ? ` (${b.date})` : ''}`
          : `${mid + i + 1}. ${b}`
      ).join('\n');

      embed.addFields(
        { name: '📋 Breaches Found (Part 1)', value: p1 || 'None' },
        { name: '📋 Breaches Found (Part 2)', value: p2 || 'None' }
      );
    } else {
      embed.addFields({
        name: `📋 Breaches Found (${Array.isArray(data.sources) ? data.sources.length : 1})`,
        value: breachList
      });
    }
  }

  if (data.found && data.fields) {
    embed.addFields({
      name: '📊 Exposed Data',
      value: `\`${Array.isArray(data.fields) ? data.fields.join(', ') : data.fields}\``
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

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  await interaction.deferReply();

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
