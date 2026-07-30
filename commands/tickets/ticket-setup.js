const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const GuildConfig = require('../../models/GuildConfig');
const { invalidate } = require('../../utils/getGuildConfig');

module.exports = {
  category: 'Tickets',
  data: new SlashCommandBuilder()
    .setName('ticket-setup')
    .setDescription('Configure global ticket system settings.')
    .addSubcommand(sc => sc.setName('support-role').setDescription('Add a support role (can view & manage all tickets)')
      .addRoleOption(o => o.setName('role').setDescription('The role').setRequired(true)))
    .addSubcommand(sc => sc.setName('transcript-channel').setDescription('Set the channel where closed-ticket transcripts are logged')
      .addChannelOption(o => o.setName('channel').setDescription('Log channel').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    let cfg = await GuildConfig.findOne({ guildId: interaction.guild.id }) || await GuildConfig.create({ guildId: interaction.guild.id });

    if (sub === 'support-role') {
      const role = interaction.options.getRole('role');
      if (!cfg.tickets.supportRoles.includes(role.id)) cfg.tickets.supportRoles.push(role.id);
      await cfg.save();
      invalidate(interaction.guild.id);
      await interaction.reply({ embeds: [embeds.success(`**${role.name}** added as a support role.`)] });
    }

    if (sub === 'transcript-channel') {
      const channel = interaction.options.getChannel('channel');
      cfg.tickets.transcriptChannel = channel.id;
      await cfg.save();
      invalidate(interaction.guild.id);
      await interaction.reply({ embeds: [embeds.success(`Transcripts will now be logged in ${channel}.`)] });
    }
  }
};
