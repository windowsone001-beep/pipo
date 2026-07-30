const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  category: 'Utility',
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription("Show a user's avatar.")
    .addUserOption(o => o.setName('user').setDescription('The user').setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const embed = embeds.baseEmbed().setTitle(`${user.tag}'s Avatar`).setImage(user.displayAvatarURL({ size: 1024 }));
    await interaction.reply({ embeds: [embed] });
  }
};
