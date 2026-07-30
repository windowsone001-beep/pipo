const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../../utils/embeds');
const Ticket = require('../../../models/Ticket');
const GuildConfig = require('../../../models/GuildConfig');
const { isStaff } = require('../../../utils/permissions');

module.exports = {
  id: 'ticket_claim_',
  async execute(interaction) {
    const channelId = interaction.customId.replace('ticket_claim_', '');
    const ticket = await Ticket.findOne({ channelId });
    if (!ticket) return interaction.reply({ embeds: [embeds.error('This ticket could not be found in the database.')], ephemeral: true });
    if (ticket.status === 'closed') return interaction.reply({ embeds: [embeds.warn('This ticket is closed. Reopen it first if you need to claim it.')], ephemeral: true });

    const cfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
    if (!isStaff(interaction.member, cfg?.tickets.supportRoles || []) && !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ embeds: [embeds.error('Only support staff can claim tickets.')], ephemeral: true });
    }

    if (ticket.claimedBy) {
      return interaction.reply({ embeds: [embeds.warn(`This ticket is already claimed by <@${ticket.claimedBy}>.`)], ephemeral: true });
    }

    ticket.claimedBy = interaction.user.id;
    await ticket.save();

    await interaction.reply({ embeds: [embeds.success(`🙋 ${interaction.user} has claimed this ticket.`)] });
    await interaction.channel.setTopic(`Claimed by ${interaction.user.tag}`).catch(() => {});
  }
};
