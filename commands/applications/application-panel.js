const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embeds = require('../../utils/embeds');
const GuildConfig = require('../../models/GuildConfig');
const { invalidate } = require('../../utils/getGuildConfig');
const generateId = () => Math.random().toString(36).slice(2, 10);

module.exports = {
  category: 'Applications',
  data: new SlashCommandBuilder()
    .setName('application-panel')
    .setDescription('Create and manage staff application panels.')
    .addSubcommand(sc => sc.setName('create').setDescription('Create a new application panel.')
      .addStringOption(o => o.setName('name').setDescription('Application name, e.g. "Moderator"').setRequired(true))
      .addChannelOption(o => o.setName('channel').setDescription('Channel to post the panel in').setRequired(true))
      .addStringOption(o => o.setName('questions').setDescription('Questions separated by | (pipe)').setRequired(true))
      .addChannelOption(o => o.setName('log_channel').setDescription('Where submissions are sent for review').setRequired(true))
      .addRoleOption(o => o.setName('reviewer_role').setDescription('Role allowed to accept/reject applications')))
    .addSubcommand(sc => sc.setName('close').setDescription('Stop accepting new submissions for a panel.')
      .addStringOption(o => o.setName('panel_id').setDescription('Panel ID').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    let cfg = await GuildConfig.findOne({ guildId: interaction.guild.id }) || await GuildConfig.create({ guildId: interaction.guild.id });

    if (sub === 'create') {
      const name = interaction.options.getString('name');
      const channel = interaction.options.getChannel('channel');
      const questions = interaction.options.getString('questions').split('|').map(q => q.trim()).filter(Boolean).slice(0, 5); // modal max 5 fields
      const logChannel = interaction.options.getChannel('log_channel');
      const reviewerRole = interaction.options.getRole('reviewer_role');
      const panelId = generateId();

      cfg.applications.push({
        panelId, name, channelId: channel.id, logChannel: logChannel.id, resultChannel: logChannel.id,
        questions, open: true, reviewerRoles: reviewerRole ? [reviewerRole.id] : []
      });
      await cfg.save();
      invalidate(interaction.guild.id);

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`📋 ${name} Applications`)
        .setDescription(`Click below to apply for **${name}**.\n\nThis application has ${questions.length} question(s).`)
        .setFooter({ text: `Panel ID: ${panelId}` });

      await channel.send({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`app_apply_${panelId}`).setLabel('Apply Now').setEmoji('📝').setStyle(ButtonStyle.Primary)
        )]
      });

      await interaction.reply({ embeds: [embeds.success(`Application panel **${name}** created in ${channel}.\n**Panel ID:** \`${panelId}\``)], ephemeral: true });
    }

    if (sub === 'close') {
      const panelId = interaction.options.getString('panel_id');
      const panel = cfg.applications.find(p => p.panelId === panelId);
      if (!panel) return interaction.reply({ embeds: [embeds.error('Panel not found.')], ephemeral: true });
      panel.open = false;
      await cfg.save();
      invalidate(interaction.guild.id);
      await interaction.reply({ embeds: [embeds.success(`Panel **${panel.name}** is now closed to new applicants.`)] });
    }
  }
};
