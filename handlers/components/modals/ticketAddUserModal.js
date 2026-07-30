const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../../utils/embeds');
const Ticket = require('../../../models/Ticket');

function extractId(input) {
  const match = input.match(/\d{17,20}/);
  return match ? match[0] : null;
}

module.exports = {
  id: 'ticket_adduser_modal_',
  async execute(interaction) {
    const channelId = interaction.customId.replace('ticket_adduser_modal_', '');
    const raw = interaction.fields.getTextInputValue('user_id');
    const userId = extractId(raw);
    if (!userId) return interaction.reply({ embeds: [embeds.error('Could not parse a valid user ID.')], ephemeral: true });

    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!member) return interaction.reply({ embeds: [embeds.error('That user could not be found in this server.')], ephemeral: true });

    await interaction.channel.permissionOverwrites.edit(userId, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    });

    await Ticket.updateOne({ channelId }, { $addToSet: { addedUsers: userId } });
    await interaction.reply({ embeds: [embeds.success(`${member} has been added to this ticket.`)] });
  }
};
