const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const { getDisTube } = require('../../utils/musicClient');

module.exports = {
  category: 'Music',
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Set the loop mode.')
    .addStringOption(o => o.setName('mode').setDescription('Loop mode').setRequired(true).addChoices(
      { name: 'Off', value: '0' }, { name: 'Song', value: '1' }, { name: 'Queue', value: '2' }
    )),
  async execute(interaction) {
    const queue = getDisTube().getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [embeds.error('Nothing is playing.')], ephemeral: true });
    const mode = parseInt(interaction.options.getString('mode'), 10);
    queue.setRepeatMode(mode);
    const label = mode === 0 ? 'Off' : mode === 1 ? 'Song' : 'Queue';
    await interaction.reply({ embeds: [embeds.success(`🔁 Loop mode set to **${label}**.`)] });
  }
};
