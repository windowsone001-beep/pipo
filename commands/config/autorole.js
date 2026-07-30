const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const GuildConfig = require('../../models/GuildConfig');
const { invalidate } = require('../../utils/getGuildConfig');

module.exports = {
  category: 'Auto Role',
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Configure roles automatically given on join.')
    .addSubcommand(sc => sc.setName('add').setDescription('Add an auto role for humans')
      .addRoleOption(o => o.setName('role').setDescription('The role').setRequired(true)))
    .addSubcommand(sc => sc.setName('add-bot').setDescription('Add an auto role for bots')
      .addRoleOption(o => o.setName('role').setDescription('The role').setRequired(true)))
    .addSubcommand(sc => sc.setName('remove').setDescription('Remove an auto role')
      .addRoleOption(o => o.setName('role').setDescription('The role').setRequired(true)))
    .addSubcommand(sc => sc.setName('list').setDescription('List current auto roles'))
    .addSubcommand(sc => sc.setName('toggle').setDescription('Enable or disable auto role')
      .addBooleanOption(o => o.setName('enabled').setDescription('On or off').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    let cfg = await GuildConfig.findOne({ guildId: interaction.guild.id }) || await GuildConfig.create({ guildId: interaction.guild.id });

    if (sub === 'add' || sub === 'add-bot') {
      const role = interaction.options.getRole('role');
      if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({ embeds: [embeds.error("I can't assign a role higher than or equal to my own highest role.")], ephemeral: true });
      }
      const list = sub === 'add' ? cfg.autoRole.roles : cfg.autoRole.botRoles;
      if (!list.includes(role.id)) list.push(role.id);
      cfg.autoRole.enabled = true;
      await cfg.save();
      invalidate(interaction.guild.id);
      return interaction.reply({ embeds: [embeds.success(`**${role.name}** will now be given automatically to ${sub === 'add' ? 'new members' : 'new bots'}.`)] });
    }

    if (sub === 'remove') {
      const role = interaction.options.getRole('role');
      cfg.autoRole.roles = cfg.autoRole.roles.filter(r => r !== role.id);
      cfg.autoRole.botRoles = cfg.autoRole.botRoles.filter(r => r !== role.id);
      await cfg.save();
      invalidate(interaction.guild.id);
      return interaction.reply({ embeds: [embeds.success(`**${role.name}** removed from auto roles.`)] });
    }

    if (sub === 'list') {
      const humans = cfg.autoRole.roles.map(r => `<@&${r}>`).join(', ') || 'None';
      const bots = cfg.autoRole.botRoles.map(r => `<@&${r}>`).join(', ') || 'None';
      return interaction.reply({ embeds: [embeds.info(`**Status:** ${cfg.autoRole.enabled ? 'Enabled' : 'Disabled'}\n**Human roles:** ${humans}\n**Bot roles:** ${bots}`, '🤖 Auto Role Settings')] });
    }

    if (sub === 'toggle') {
      cfg.autoRole.enabled = interaction.options.getBoolean('enabled');
      await cfg.save();
      invalidate(interaction.guild.id);
      return interaction.reply({ embeds: [embeds.success(`Auto role is now **${cfg.autoRole.enabled ? 'enabled' : 'disabled'}**.`)] });
    }
  }
};
