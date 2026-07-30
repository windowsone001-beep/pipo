const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  category: 'Message Builder',
  data: new SlashCommandBuilder()
    .setName('deletemessage')
    .setDescription('Delete a specific message by ID.')
    .addStringOption(o => o.setName('message_id').setDescription('Message ID to delete').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Channel the message is in (defaults to here)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const message = await channel.messages.fetch(interaction.options.getString('message_id')).catch(() => null);
    if (!message) return interaction.reply({ embeds: [embeds.error('Message not found.')], ephemeral: true });
    await message.delete();
    await interaction.reply({ embeds: [embeds.success('Message deleted.')], ephemeral: true });
  }
};
