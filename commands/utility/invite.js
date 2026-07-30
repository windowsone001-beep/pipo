const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const embeds = require('../../utils/embeds');
const config = require('../../config/config');

module.exports = {
  category: 'Utility',
  data: new SlashCommandBuilder().setName('invite').setDescription('Get an invite link to add MineCore Manager to your server.'),
  async execute(interaction) {
    const link = `https://discord.com/api/oauth2/authorize?client_id=${config.clientId}&permissions=1099511627775&scope=bot%20applications.commands`;
    await interaction.reply({ embeds: [embeds.info(`[Click here to invite me](${link})`, '🔗 Invite MineCore Manager')] });
  }
};
