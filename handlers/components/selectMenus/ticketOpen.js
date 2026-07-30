const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embeds = require('../../../utils/embeds');
const GuildConfig = require('../../../models/GuildConfig');
const Ticket = require('../../../models/Ticket');
const { nextSeq } = require('../../../models/Counter');
const config = require('../../../config/config');

module.exports = {
  id: 'ticket_open_',
  async execute(interaction) {
    const panelId = interaction.customId.replace('ticket_open_', '');
    const categoryId = interaction.values[0];
    if (categoryId === 'placeholder') {
      return interaction.reply({ embeds: [embeds.error('This panel has no ticket categories configured yet.')], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const cfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
    const panel = cfg?.tickets.panels.find(p => p.panelId === panelId);
    const category = panel?.categories.find(c => c.id === categoryId);
    if (!panel || !category) return interaction.editReply({ embeds: [embeds.error('That ticket category no longer exists.')] });

    // Prevent duplicate open tickets of the same category for this user, and cap total open tickets to prevent abuse.
    const existing = await Ticket.findOne({ guildId: interaction.guild.id, openerId: interaction.user.id, status: 'open', categoryId });
    if (existing) {
      return interaction.editReply({ embeds: [embeds.error(`You already have an open ticket: <#${existing.channelId}>`)] });
    }
    const openCount = await Ticket.countDocuments({ guildId: interaction.guild.id, openerId: interaction.user.id, status: 'open' });
    if (openCount >= 5) {
      return interaction.editReply({ embeds: [embeds.error('You have too many open tickets already. Please close one before opening another.')] });
    }

    const ticketNumber = await nextSeq(`tickets:${interaction.guild.id}`);
    const overwrites = [
      { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
      { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
    ];
    for (const roleId of [...(cfg.tickets.supportRoles || []), ...(category.pingRoles || [])]) {
      overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
    }

    // The configured Discord category might have since been deleted or changed type — fall back
    // to creating the ticket with no parent rather than letting channels.create() throw.
    let parent = category.categoryChannelId || undefined;
    if (parent) {
      const parentChannel = interaction.guild.channels.cache.get(parent);
      if (!parentChannel || parentChannel.type !== ChannelType.GuildCategory) parent = undefined;
    }

    let channel;
    try {
      channel = await interaction.guild.channels.create({
        name: `ticket-${ticketNumber}`,
        type: ChannelType.GuildText,
        parent,
        permissionOverwrites: overwrites
      });
    } catch (err) {
      return interaction.editReply({ embeds: [embeds.error("I couldn't create your ticket channel — I may be missing Manage Channels permission, or this server hit Discord's channel limit.")] });
    }

    await Ticket.create({
      guildId: interaction.guild.id,
      channelId: channel.id,
      ticketNumber,
      categoryId,
      openerId: interaction.user.id
    });

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`${category.emoji || '🎫'} ${category.label} — Ticket #${ticketNumber}`)
      .setDescription(category.welcomeMessage)
      .addFields({ name: 'Opened by', value: `${interaction.user}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ticket_claim_${channel.id}`).setLabel('Claim').setEmoji('🙋').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`ticket_close_${channel.id}`).setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`ticket_adduser_${channel.id}`).setLabel('Add User').setEmoji('➕').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`ticket_removeuser_${channel.id}`).setLabel('Remove User').setEmoji('➖').setStyle(ButtonStyle.Secondary)
    );

    const pingText = (category.pingRoles || []).map(r => `<@&${r}>`).join(' ');
    await channel.send({ content: `${interaction.user} ${pingText}`.trim(), embeds: [embed], components: [row] });

    await interaction.editReply({ embeds: [embeds.success(`Your ticket has been created: ${channel}`)] });
  }
};
