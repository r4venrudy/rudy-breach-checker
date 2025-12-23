const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const crypto = require('crypto');

// Configuration
const DISCORD_TOKEN = 'DISCORD BOT TOKEN HERE';
const CLIENT_ID = 'CLIENT ID HERE';
const LEAKCHECK_API = 'LEAKCHECK API URL';

// Create Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Hash email with SHA256
function hashEmail(email) {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

// Fetch data from LeakCheck API
async function checkLeak(query, type) {
  try {
    const url = `${LEAKCHECK_API}?check=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return { error: `API returned status ${response.status}` };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    return { error: error.message };
  }
}

// Format the response into a Discord embed
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

  // Display detailed breach information
  if (data.found && data.sources) {
    let breachList = '';
    
    if (Array.isArray(data.sources)) {
      breachList = data.sources.map((source, index) => {
        // Check if source is an object with name and date
        if (typeof source === 'object' && source.name) {
          const datePart = source.date ? ` (${source.date})` : '';
          return `${index + 1}. ${source.name}${datePart}`;
        }
        return `${index + 1}. ${source}`;
      }).join('\n');
    } else if (typeof data.sources === 'object' && data.sources.name) {
      const datePart = data.sources.date ? ` (${data.sources.date})` : '';
      breachList = `1. ${data.sources.name}${datePart}`;
    } else {
      breachList = data.sources;
    }
    
    // Split into multiple fields if too long
    if (breachList.length > 1024) {
      const breaches = Array.isArray(data.sources) ? data.sources : [data.sources];
      const midpoint = Math.ceil(breaches.length / 2);
      
      const part1 = breaches.slice(0, midpoint).map((b, i) => {
        if (typeof b === 'object' && b.name) {
          const datePart = b.date ? ` (${b.date})` : '';
          return `${i + 1}. ${b.name}${datePart}`;
        }
        return `${i + 1}. ${b}`;
      }).join('\n');
      
      const part2 = breaches.slice(midpoint).map((b, i) => {
        if (typeof b === 'object' && b.name) {
          const datePart = b.date ? ` (${b.date})` : '';
          return `${midpoint + i + 1}. ${b.name}${datePart}`;
        }
        return `${midpoint + i + 1}. ${b}`;
      }).join('\n');
      
      embed.addFields(
        { name: `📋 Breaches Found (Part 1)`, value: part1 || 'None' },
        { name: `📋 Breaches Found (Part 2)`, value: part2 || 'None' }
      );
    } else {
      embed.addFields({ name: `📋 Breaches Found (${Array.isArray(data.sources) ? data.sources.length : 1})`, value: breachList });
    }
  }

  if (data.found && data.fields) {
    const fields = Array.isArray(data.fields) ? data.fields.join(', ') : data.fields;
    embed.addFields({ name: '📊 Exposed Data', value: `\`${fields}\`` });
  }

  return embed;
}

// Command definitions
const commands = [
  new SlashCommandBuilder()
    .setName('mail')
    .setDescription('Search for leaks by email address')
    .addStringOption(option =>
      option.setName('email')
        .setDescription('Email address to search')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('hashmail')
    .setDescription('Search for leaks by hashed email (SHA256)')
    .addStringOption(option =>
      option.setName('email')
        .setDescription('Email address to hash and search')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('usernamev2')
    .setDescription('Search for leaks by username')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Username to search')
        .setRequired(true))
];

// Register slash commands
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Slash commands registered successfully!');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
}

// Bot ready event
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log('Bot is ready to use!');
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  await interaction.deferReply();

  try {
    let query, type, result;

    switch (interaction.commandName) {
      case 'mail':
        query = interaction.options.getString('email');
        type = 'Email';
        result = await checkLeak(query, type);
        break;

      case 'hashmail':
        const email = interaction.options.getString('email');
        query = hashEmail(email);
        type = 'Hashed Email';
        result = await checkLeak(query, type);
        break;

      case 'usernamev2':
        query = interaction.options.getString('username');
        type = 'Username';
        result = await checkLeak(query, type);
        break;

      default:
        await interaction.editReply('Unknown command');
        return;
    }

    const embed = createEmbed(result, query, type);
    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error handling command:', error);
    await interaction.editReply('❌ An error occurred while processing your request.');
  }
});

// Login and register commands
registerCommands().then(() => {
  client.login(DISCORD_TOKEN);
});