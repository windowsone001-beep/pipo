const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  category: 'Administration',
  data: new SlashCommandBuilder()
    .setName('nickname')
    .setDescription("Change a member's nickname.")
    .addUserOption(o => o.setName('user').setDescription('The user').setRequired(true))
    .addStringOption(o => o.setName('nickname').setDescription('New nickname (leave empty to reset)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const nickname = interaction.options.getString('nickname') || null;
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) return interaction.reply({ embeds: [embeds.error('That user is not in this server.')], ephemeral: true });

    await member.setNickname(nickname, `Changed by ${interaction.user.tag}`);
    await interaction.reply({ embeds: [embeds.success(nickname ? `Nickname changed to **${nickname}**.` : 'Nickname reset.')] });
  }
};
