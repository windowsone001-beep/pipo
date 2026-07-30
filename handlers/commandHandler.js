const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const logger = require('../utils/logger');

module.exports = (client) => {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, '..', 'commands');

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.js')) {
        try {
          const command = require(fullPath);
          if (!command?.data || !command?.execute) {
            logger.warn(`Skipped invalid command file: ${fullPath}`);
            continue;
          }
          client.commands.set(command.data.name, command);
        } catch (err) {
          logger.error(`Failed to load command ${fullPath}`, err);
        }
      }
    }
  };

  walk(commandsPath);
  logger.success(`Loaded ${client.commands.size} slash commands.`);
};
