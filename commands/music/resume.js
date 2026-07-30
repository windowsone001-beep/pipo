const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const { getDisTube } = require('../../utils/musicClient');

module.exports = {
  category: 'Music',
  data: new SlashCommandBuilder().setName('resume').setDescription('Resume the current song.'),
  async execute(interaction) {
    const queue = getDisTube().getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [embeds.error('Nothing is playing.')], ephemeral: true });
    queue.resume();
    await interaction.reply({ embeds: [embeds.success('▶️ Resumed.')] });
  }
};
