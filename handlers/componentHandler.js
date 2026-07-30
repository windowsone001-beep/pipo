const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const logger = require('../utils/logger');

/**
 * Loads "component modules" — files that export { id: 'prefix', execute(interaction, client) }.
 * customId matching uses startsWith(id) so one handler can serve many dynamic ids,
 * e.g. id: 'ticket_claim_' matches 'ticket_claim_1082394...'.
 */
module.exports = (client) => {
  client.buttons = new Collection();
  client.selectMenus = new Collection();
  client.modals = new Collection();

  const componentsPath = path.join(__dirname, '..', 'handlers', 'components');
  if (!fs.existsSync(componentsPath)) return;

  const walk = (dir, collection) => {
    if (!fs.existsSync(dir)) return;
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
      const mod = require(path.join(dir, file));
      if (!mod?.id || !mod?.execute) continue;
      collection.set(mod.id, mod);
    }
  };

  walk(path.join(componentsPath, 'buttons'), client.buttons);
  walk(path.join(componentsPath, 'selectMenus'), client.selectMenus);
  walk(path.join(componentsPath, 'modals'), client.modals);

  logger.success(`Loaded ${client.buttons.size} button handlers, ${client.selectMenus.size} select menu handlers, ${client.modals.size} modal handlers.`);
};

function resolve(collection, customId) {
  if (collection.has(customId)) return collection.get(customId);
  for (const [id, handler] of collection) {
    if (customId.startsWith(id)) return handler;
  }
  return null;
}

module.exports.resolve = resolve;
