const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../../utils/embeds');
const Ticket = require('../../../models/Ticket');
const { getGuildConfig } = require('../../../utils/getGuildConfig');
const { generateTranscript } = require('../../../utils/transcript');
const config = require('../../../config/config');

module.exports = {
  id: 'ticket_confirmclose_',
  async execute(interaction) {
    const channelId = interaction.customId.replace('ticket_confirmclose_', '');
    const ticket = await Ticket.findOne({ channelId });
    if (!ticket) return interaction.update({ embeds: [embeds.error('Ticket not found.')], components: [] });

    await interaction.update({ embeds: [embeds.info('🔒 Closing ticket and generating transcript...')], components: [] });

    // Generate & store the transcript before locking anyone out.
    const attachment = await generateTranscript(interaction.channel, ticket.ticketNumber).catch(() => null);

    ticket.status = 'closed';
    ticket.closedBy = interaction.user.id;
    ticket.closedAt = new Date();
    await ticket.save();

    // Revoke the opener's send access but keep view access so they can still read the resolved ticket.
    await interaction.channel.permissionOverwrites.edit(ticket.openerId, { SendMessages: false }).catch(() => {});
    for (const uid of ticket.addedUsers) {
      await interaction.channel.permissionOverwrites.edit(uid, { SendMessages: false }).catch(() => {});
    }

    const cfg = await getGuildConfig(interaction.guild.id);
    const logChannelId = cfg.tickets.transcriptChannel || cfg.ticketLogChannel;
    let deliveredToLog = false;

    if (logChannelId && attachment) {
      const logChannel = interaction.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        const sent = await logChannel.send({
          embeds: [new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle(`🎫 Ticket #${ticket.ticketNumber} Closed`)
            .addFields(
              { name: 'Opened by', value: `<@${ticket.openerId}>`, inline: true },
              { name: 'Closed by', value: `<@${interaction.user.id}>`, inline: true },
              { name: 'Claimed by', value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : 'Unclaimed', inline: true }
            )
            .setTimestamp()],
          files: [attachment]
        }).catch(() => null);
        deliveredToLog = !!sent;
      }
    }

    // No log channel configured, the channel was misconfigured, or delivery failed — don't let the
    // transcript vanish. Fall back to attaching it directly in the ticket channel (which stays
    // readable until someone explicitly hits Delete) and DMing the person who opened it.
    let deliveredToChannel = false;
    if (!deliveredToLog && attachment) {
      const sent = await interaction.channel.send({ files: [attachment] }).catch(() => null);
      deliveredToChannel = !!sent;
    }
    if (attachment) {
      const opener = await interaction.client.users.fetch(ticket.openerId).catch(() => null);
      if (opener) await opener.send({ content: `Here's the transcript for your ticket in **${interaction.guild.name}**:`, files: [attachment] }).catch(() => {});
    }

    let transcriptNote;
    if (!attachment) transcriptNote = ' *(transcript generation failed — check the bot has View Channel and Read Message History here)*';
    else if (deliveredToLog) transcriptNote = ' A transcript has been logged.';
    else if (deliveredToChannel) transcriptNote = ' A transcript has been attached above (no log channel is configured — set one with `/ticket-setup transcript-channel`).';
    else transcriptNote = ' *(the transcript could not be delivered anywhere — check bot permissions)*';

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ticket_reopen_${channelId}`).setLabel('Reopen').setEmoji('🔓').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`ticket_delete_${channelId}`).setLabel('Delete').setEmoji('🗑️').setStyle(ButtonStyle.Danger)
    );

    await interaction.channel.send({
      embeds: [embeds.info(`This ticket was closed by ${interaction.user}.${transcriptNote}`, '🔒 Ticket Closed')],
      components: [row]
    });
  }
};
