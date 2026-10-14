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

const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');

// Prefer environment variables so secrets don't have to live in the source file.
const { loadConfig } = require('./packaging/config.cjs');
const { hashEmail } = require('./packaging/format.cjs');
const { createEmbed } = require('./packaging/embed.cjs');
const { checkLeak: checkLeakApi } = require('./packaging/api.cjs');
const { createCooldown, secondsFromEnv } = require('./packaging/cooldown.cjs');
const { DISCORD_TOKEN, CLIENT_ID, LEAKCHECK_API } = loadConfig({ DISCORD_TOKEN:'DISCORD_TOKEN', CLIENT_ID:'CLIENT_ID', LEAKCHECK_API:'LEAKCHECK_API' });
const apiUrl = new URL(LEAKCHECK_API);
if (!['https:', 'http:'].includes(apiUrl.protocol)) throw new Error('LEAKCHECK_API must be an HTTP(S) endpoint');
if (process.argv.includes('--check-config')) { console.log('Configuration and dependencies ready'); process.exit(0); }

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});


const checkLeak = query => checkLeakApi(apiUrl, query);

const commands = [
  new SlashCommandBuilder()
    .setName('mail')
    .setDescription('Search for leaks by email address')
    .addStringOption(o => o.setName('email').setDescription('Email').setRequired(true).setMaxLength(254)),
  new SlashCommandBuilder()
    .setName('hashmail')
    .setDescription('Search for leaks by hashed email (SHA256)')
    .addStringOption(o => o.setName('email').setDescription('Email').setRequired(true).setMaxLength(254)),
  new SlashCommandBuilder()
    .setName('usernamev2')
    .setDescription('Search for leaks by username')
    .addStringOption(o => o.setName('username').setDescription('Username').setRequired(true).setMaxLength(64))
];

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
}

client.once('ready', () => {
  console.log(`Bot aktif: ${client.user.tag}`);
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cooldown = createCooldown(secondsFromEnv(process.env.COOLDOWN_SECONDS, 10) * 1000);

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

  const wait = cooldown.take(interaction.user.id);
  if (wait > 0) {
    await interaction.reply({ content: `⏳ Please wait ${Math.ceil(wait / 1000)} s before the next lookup.`, ephemeral: true });
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
    // Without this the requester is left looking at "thinking..." until Discord gives up
    if (interaction.deferred) {
      await interaction.editReply({ content: '❌ The lookup failed, please try again.', embeds: [] }).catch(() => {});
    }
  }
});

registerCommands()
  .then(() => client.login(DISCORD_TOKEN))
  .catch(err => {
    console.error(`Startup failed: ${err.message}`);
    process.exit(1);
  });
