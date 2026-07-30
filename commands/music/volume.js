const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const { getDisTube } = require('../../utils/musicClient');

module.exports = {
  category: 'Music',
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set the playback volume.')
    .addIntegerOption(o => o.setName('percent').setDescription('Volume 0-150').setRequired(true).setMinValue(0).setMaxValue(150)),
  async execute(interaction) {
    const queue = getDisTube().getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [embeds.error('Nothing is playing.')], ephemeral: true });
    queue.setVolume(interaction.options.getInteger('percent'));
    await interaction.reply({ embeds: [embeds.success(`🔊 Volume set to ${interaction.options.getInteger('percent')}%.`)] });
  }
};
