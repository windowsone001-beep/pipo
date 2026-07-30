const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  category: 'Message Builder',
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Send a plain message as the bot.')
    .addStringOption(o => o.setName('message').setDescription('The message content').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Channel to send to (defaults to here)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    await channel.send(interaction.options.getString('message'));
    await interaction.reply({ embeds: [embeds.success(`Message sent to ${channel}.`)], ephemeral: true });
  }
};
