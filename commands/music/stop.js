const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const { getDisTube } = require('../../utils/musicClient');

module.exports = {
  category: 'Music',
  data: new SlashCommandBuilder().setName('stop').setDescription('Stop music and clear the queue.'),
  async execute(interaction) {
    const queue = getDisTube().getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [embeds.error('Nothing is playing.')], ephemeral: true });
    queue.stop();
    await interaction.reply({ embeds: [embeds.success('⏹️ Stopped and cleared the queue.')] });
  }
};
