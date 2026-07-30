const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const GuildConfig = require('../../models/GuildConfig');
const { invalidate } = require('../../utils/getGuildConfig');

module.exports = {
  category: 'Self Roles',
  data: new SlashCommandBuilder()
    .setName('selfrole')
    .setDescription('Create button or select-menu self-role panels.')
    .addSubcommand(sc => sc.setName('buttons').setDescription('Create a button-based self-role panel.')
      .addStringOption(o => o.setName('title').setDescription('Panel title').setRequired(true))
      .addStringOption(o => o.setName('roles').setDescription('Roles as @role:Label pairs separated by | e.g. @Role1:Gamer|@Role2:Artist').setRequired(true)))
    .addSubcommand(sc => sc.setName('menu').setDescription('Create a select-menu self-role panel.')
      .addStringOption(o => o.setName('title').setDescription('Panel title').setRequired(true))
      .addStringOption(o => o.setName('roles').setDescription('Roles as @role:Label pairs separated by | e.g. @Role1:Gamer|@Role2:Artist').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const title = interaction.options.getString('title');
    const rawRoles = interaction.options.getString('roles').split('|').map(s => s.trim()).filter(Boolean);

    const roles = [];
    for (const entry of rawRoles) {
      const [mention, ...labelParts] = entry.split(':');
      const roleId = mention.replace(/[<@&>]/g, '');
      const role = interaction.guild.roles.cache.get(roleId);
      if (!role) continue;
      roles.push({ roleId: role.id, label: labelParts.join(':') || role.name, emoji: null });
    }
    if (!roles.length) return interaction.reply({ embeds: [embeds.error('No valid roles were parsed. Format: `@Role:Label|@Role2:Label2`')], ephemeral: true });
    if (roles.length > 25) return interaction.reply({ embeds: [embeds.error('Max 25 roles per panel.')], ephemeral: true });

    const embed = new EmbedBuilder().setColor('#5865F2').setTitle(title).setDescription(
      sub === 'buttons' ? 'Click a button below to toggle a role.' : 'Select roles from the menu below to toggle them.'
    );

    let components, message;
    if (sub === 'buttons') {
      const rows = [];
      for (let i = 0; i < roles.length; i += 5) {
        rows.push(new ActionRowBuilder().addComponents(
          roles.slice(i, i + 5).map(r => new ButtonBuilder().setCustomId(`selfrole_btn_${r.roleId}`).setLabel(r.label).setStyle(ButtonStyle.Secondary))
        ));
      }
      components = rows;
    } else {
      components = [new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('selfrole_menu')
          .setPlaceholder('Select roles...')
          .setMinValues(0)
          .setMaxValues(roles.length)
          .addOptions(roles.map(r => ({ label: r.label, value: r.roleId })))
      )];
    }

    message = await interaction.channel.send({ embeds: [embed], components });

    let cfg = await GuildConfig.findOne({ guildId: interaction.guild.id }) || await GuildConfig.create({ guildId: interaction.guild.id });
    cfg.selfRoles.push({ messageId: message.id, channelId: interaction.channel.id, type: sub === 'buttons' ? 'button' : 'selectmenu', roles });
    await cfg.save();
    invalidate(interaction.guild.id);

    await interaction.reply({ embeds: [embeds.success('Self-role panel created.')], ephemeral: true });
  }
};
