const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  category: 'Utility',
  data: new SlashCommandBuilder().setName('uptime').setDescription('Show how long the bot has been online.'),
  async execute(interaction) {
    const seconds = Math.floor(interaction.client.uptime / 1000);
    await interaction.reply({ embeds: [embeds.info(`I've been online since <t:${Math.floor((Date.now() - interaction.client.uptime) / 1000)}:R>.`, '⏱️ Uptime')] });
  }
};
