const logger = require('../utils/logger');
const embeds = require('../utils/embeds');
const { resolve } = require('../handlers/componentHandler');
const { recordCommand } = require('../utils/commandStats');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        logger.command(`${interaction.user.tag} used /${interaction.commandName} in ${interaction.guild?.name ?? 'DM'}`);
        await command.execute(interaction, client);
        recordCommand(interaction.commandName, interaction.guildId); // fire-and-forget, never blocks the reply
        return;
      }

      if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.autocomplete) await command.autocomplete(interaction, client);
        return;
      }

      if (interaction.isButton()) {
        const handler = resolve(client.buttons, interaction.customId);
        if (handler) await handler.execute(interaction, client);
        return;
      }

      if (interaction.isStringSelectMenu() || interaction.isRoleSelectMenu() || interaction.isChannelSelectMenu() || interaction.isUserSelectMenu()) {
        const handler = resolve(client.selectMenus, interaction.customId);
        if (handler) await handler.execute(interaction, client);
        return;
      }

      if (interaction.isModalSubmit()) {
        const handler = resolve(client.modals, interaction.customId);
        if (handler) await handler.execute(interaction, client);
        return;
      }
    } catch (err) {
      logger.error(`Interaction error (${interaction.type})`, err);
      const payload = { embeds: [embeds.error('Something went wrong while processing that. The error has been logged.')], ephemeral: true };
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(payload);
        } else {
          await interaction.reply(payload);
        }
      } catch {
        // interaction likely expired, nothing more we can do
      }
    }
  }
};
