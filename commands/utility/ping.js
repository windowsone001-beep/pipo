const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  category: 'Utility',
  data: new SlashCommandBuilder().setName('ping').setDescription('Check the bot\'s latency.'),
  async execute(interaction) {
    const sent = await interaction.reply({ embeds: [embeds.info('Pinging...')], fetchReply: true });
    const roundTrip = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply({
      embeds: [embeds.info(`🏓 **Roundtrip:** ${roundTrip}ms\n💓 **WebSocket:** ${interaction.client.ws.ping}ms`, 'Pong!')]
    });
  }
};
