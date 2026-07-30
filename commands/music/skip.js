const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const { getDisTube } = require('../../utils/musicClient');

module.exports = {
  category: 'Music',
  data: new SlashCommandBuilder().setName('skip').setDescription('Skip the current song.'),
  async execute(interaction) {
    const queue = getDisTube().getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [embeds.error('Nothing is playing.')], ephemeral: true });
    try {
      await queue.skip();
      await interaction.reply({ embeds: [embeds.success('⏭️ Skipped.')] });
    } catch {
      await interaction.reply({ embeds: [embeds.error('No more songs in the queue to skip to.')], ephemeral: true });
    }
  }
};
