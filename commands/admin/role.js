const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const { logModAction } = require('../../utils/modLogger');

module.exports = {
  category: 'Administration',
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Add or remove a role from a member.')
    .addSubcommand(sc => sc.setName('add').setDescription('Add a role')
      .addUserOption(o => o.setName('user').setDescription('The user').setRequired(true))
      .addRoleOption(o => o.setName('role').setDescription('The role').setRequired(true)))
    .addSubcommand(sc => sc.setName('remove').setDescription('Remove a role')
      .addUserOption(o => o.setName('user').setDescription('The user').setRequired(true))
      .addRoleOption(o => o.setName('role').setDescription('The role').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) return interaction.reply({ embeds: [embeds.error('That user is not in this server.')], ephemeral: true });

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({ embeds: [embeds.error("I can't manage a role higher than or equal to my own highest role.")], ephemeral: true });
    }

    if (sub === 'add') {
      await member.roles.add(role);
      await logModAction(interaction.guild, { userId: user.id, moderatorId: interaction.user.id, action: 'role-add', reason: role.name });
      await interaction.reply({ embeds: [embeds.success(`Added **${role.name}** to **${user.tag}**.`)] });
    } else {
      await member.roles.remove(role);
      await logModAction(interaction.guild, { userId: user.id, moderatorId: interaction.user.id, action: 'role-remove', reason: role.name });
      await interaction.reply({ embeds: [embeds.success(`Removed **${role.name}** from **${user.tag}**.`)] });
    }
  }
};
