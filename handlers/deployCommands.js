/**
 * Run with: npm run deploy
 * Registers all slash commands found in /commands to Discord.
 * Deploys to GUILD_ID instantly if set (recommended for dev), otherwise globally (takes up to 1hr to propagate).
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('../config/config');
const logger = require('../utils/logger');

const commands = [];
const commandsPath = path.join(__dirname, '..', 'commands');

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (entry.name.endsWith('.js')) {
      const command = require(fullPath);
      if (command?.data) commands.push(command.data.toJSON());
    }
  }
};
walk(commandsPath);

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    logger.info(`Deploying ${commands.length} slash commands...`);

    const route = config.guildId
      ? Routes.applicationGuildCommands(config.clientId, config.guildId)
      : Routes.applicationCommands(config.clientId);

    await rest.put(route, { body: commands });

    logger.success(
      config.guildId
        ? `Deployed instantly to guild ${config.guildId}.`
        : 'Deployed globally (may take up to 1 hour to appear).'
    );
  } catch (err) {
    logger.error('Failed to deploy commands', err);
  }
})();
