const { writeBotGuilds } = require('../utils/botGuildsFile');
const logger = require('../utils/logger');
const embeds = require('../utils/embeds');

module.exports = {
  name: 'guildCreate',
  async execute(guild, client) {
    writeBotGuilds(client);

    // Instantly register every slash command in THIS server specifically. Guild-scoped
    // command registration is immediate, unlike global commands which can take up to an
    // hour to propagate — this is what makes the bot "just work" the moment it's added.
    try {
      const commandsData = [...client.commands.values()].map(c => c.data.toJSON());
      await guild.commands.set(commandsData);
      logger.success(`Auto-deployed ${commandsData.length} commands to new server: ${guild.name} (${guild.id})`);
    } catch (err) {
      logger.error(`Failed to auto-deploy commands to new server ${guild.name}`, err);
    }

    // Friendly heads-up in the system channel, if the bot can post there.
    const channel = guild.systemChannel;
    if (channel?.permissionsFor(guild.members.me)?.has('SendMessages')) {
      channel.send({
        embeds: [embeds.success(
          "Thanks for adding me! All my slash commands are ready to use right now — type `/` to see them.\nRun `/help` for a full list, or `/config` to set up logging, welcome messages, and security.",
          '👋 Vaylex is online!'
        )]
      }).catch(() => {});
    }
  }
};
