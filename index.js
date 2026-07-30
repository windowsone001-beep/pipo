require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./config/config');
const logger = require('./utils/logger');
const { connect } = require('./utils/jsondb');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences, // needed for online/offline counts in /status and /serverinfo
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember, Partials.User]
});

// ---- Load handlers ----
require('./handlers/commandHandler')(client);
require('./handlers/eventHandler')(client);
require('./handlers/componentHandler')(client);
require('./utils/musicClient').initDisTube(client);

// ---- Global error safety nets ----
process.on('unhandledRejection', (err) => logger.error('Unhandled promise rejection', err));
process.on('uncaughtException', (err) => logger.error('Uncaught exception', err));

// ---- Connect to MongoDB, then log in ----
// Connecting here (rather than lazily on first query) means a bad
// MONGODB_URI fails loudly at startup instead of surfacing as a confusing
// error the first time someone runs a command.
connect()
  .then(() => {
    logger.success('Connected to MongoDB.');
    return client.login(config.token);
  })
  .catch((err) => {
    if (err.message?.includes('MONGODB_URI')) {
      logger.error('Failed to connect to MongoDB. Check MONGODB_URI in .env', err);
    } else {
      logger.error('Failed to log in to Discord. Check DISCORD_TOKEN in .env', err);
    }
    process.exit(1);
  });

module.exports = client;
