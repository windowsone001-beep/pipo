const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const { getDisTube } = require('../../utils/musicClient');

module.exports = {
  category: 'Music',
  data: new SlashCommandBuilder().setName('queue').setDescription('Show the current song queue.'),
  async execute(interaction) {
    const queue = getDisTube().getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [embeds.error('Nothing is playing.')], ephemeral: true });

    const list = queue.songs.slice(0, 15).map((s, i) => `${i === 0 ? '▶️' : `${i}.`} **${s.name}** — ${s.formattedDuration} (requested by ${s.user})`).join('\n');
    await interaction.reply({ embeds: [embeds.info(list, `🎵 Queue (${queue.songs.length} songs)`)] });
  }
};
