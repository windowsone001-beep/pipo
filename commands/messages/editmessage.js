const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  category: 'Message Builder',
  data: new SlashCommandBuilder()
    .setName('editmessage')
    .setDescription('Edit a message the bot previously sent.')
    .addStringOption(o => o.setName('message_id').setDescription('Message ID to edit').setRequired(true))
    .addStringOption(o => o.setName('new_content').setDescription('New content').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Channel the message is in (defaults to here)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const message = await channel.messages.fetch(interaction.options.getString('message_id')).catch(() => null);
    if (!message || message.author.id !== interaction.client.user.id) {
      return interaction.reply({ embeds: [embeds.error('That message was not found, or was not sent by me.')], ephemeral: true });
    }
    await message.edit(interaction.options.getString('new_content'));
    await interaction.reply({ embeds: [embeds.success('Message updated.')], ephemeral: true });
  }
};
