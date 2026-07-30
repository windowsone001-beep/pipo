const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const { getDisTube } = require('../../utils/musicClient');

module.exports = {
  category: 'Music',
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube (URL or search query).')
    .addStringOption(o => o.setName('query').setDescription('Song name or URL').setRequired(true)),
  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) return interaction.reply({ embeds: [embeds.error('You must be in a voice channel to play music.')], ephemeral: true });

    await interaction.deferReply();
    try {
      await getDisTube().play(voiceChannel, interaction.options.getString('query'), {
        member: interaction.member,
        textChannel: interaction.channel
      });
      await interaction.editReply({ embeds: [embeds.success('Request received!')] });
    } catch (err) {
      await interaction.editReply({ embeds: [embeds.error('Could not play that. Check the link/query and try again.')] });
    }
  }
};
