const embeds = require('../../../utils/embeds');
const Ticket = require('../../../models/Ticket');
const { isStaff } = require('../../../utils/permissions');
const { getGuildConfig } = require('../../../utils/getGuildConfig');
const { generateTranscript } = require('../../../utils/transcript');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  id: 'ticket_delete_',
  async execute(interaction) {
    const cfg = await getGuildConfig(interaction.guild.id);
    if (!isStaff(interaction.member, cfg.tickets.supportRoles) && !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ embeds: [embeds.error('Only support staff can delete tickets.')], ephemeral: true });
    }

    const channelId = interaction.customId.replace('ticket_delete_', '');
    const ticket = await Ticket.findOne({ channelId });

    // Safety net: this button should only ever appear after closing (which already makes a
    // transcript), but if it's somehow reached on a still-open ticket, don't lose the conversation.
    if (ticket && ticket.status === 'open') {
      const logChannelId = cfg.tickets.transcriptChannel || cfg.ticketLogChannel;
      const attachment = await generateTranscript(interaction.channel, ticket.ticketNumber).catch(() => null);
      if (attachment) {
        const logChannel = logChannelId ? interaction.guild.channels.cache.get(logChannelId) : null;
        const target = logChannel || interaction.channel;
        await target.send({ content: `Transcript for ticket #${ticket.ticketNumber} (deleted while still open):`, files: [attachment] }).catch(() => {});
      }
    }

    await interaction.reply({ embeds: [embeds.warn('Deleting this channel in 5 seconds...')] });

    await Ticket.deleteOne({ channelId });

    setTimeout(() => {
      interaction.channel.delete('Ticket deleted by staff').catch(() => {});
    }, 5000);
  }
};
