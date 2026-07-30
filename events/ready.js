const { ActivityType } = require('discord.js');
const config = require('../config/config');
const logger = require('../utils/logger');
const { rejoinPersistentVoice } = require('../utils/voice247');
const { startGiveawayLoop } = require('../utils/giveawayLoop');
const { startScheduledMessageLoop } = require('../utils/schedulerLoop');
const { writeBotGuilds } = require('../utils/botGuildsFile');
const { writeBotStatus } = require('../utils/botStatusFile');

module.exports = {
  name: 'clientReady', // 'ready' still works but is deprecated as of discord.js v14.16+ and logs a warning
  once: true,
  async execute(client) {
    logger.success(`Logged in as ${client.user.tag}`);

    const typeMap = {
      Playing: ActivityType.Playing,
      Watching: ActivityType.Watching,
      Listening: ActivityType.Listening,
      Competing: ActivityType.Competing
    };

    client.user.setPresence({
      activities: [{ name: config.bot.activity, type: typeMap[config.bot.activityType] ?? ActivityType.Playing }],
      status: 'online'
    });

    // Restore 24/7 voice connections & resume giveaway/scheduled-message timers after a restart.
    rejoinPersistentVoice(client).catch(err => logger.error('Voice 24/7 rejoin failed', err));
    startGiveawayLoop(client);
    startScheduledMessageLoop(client);

    // Keep the dashboard's guild picker in sync with what the bot is actually in.
    writeBotGuilds(client);
    setInterval(() => writeBotGuilds(client), 5 * 60_000);

    // Heartbeat file so the (separate) dashboard process can show real
    // latency/uptime/memory instead of guessing.
    writeBotStatus(client);
    setInterval(() => writeBotStatus(client), 30_000);

    // Self-heal: make sure every server the bot is ALREADY in also has every slash command
    // registered (guild-scoped, so it's instant). This matters if commands were previously
    // deployed only to a single dev GUILD_ID, or a server was joined before this bot version.
    const commandsData = [...client.commands.values()].map(c => c.data.toJSON());
    for (const [, guild] of client.guilds.cache) {
      guild.commands.set(commandsData).catch(err => logger.error(`Failed to sync commands to ${guild.name}`, err));
    }

    logger.info(`Serving ${client.guilds.cache.size} guild(s).`);
  }
};
