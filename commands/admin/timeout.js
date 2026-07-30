const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');
const embeds = require('../../utils/embeds');
const { canModerate } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modLogger');

module.exports = {
  category: 'Administration',
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout (mute) a member for a duration.')
    .addUserOption(o => o.setName('user').setDescription('User to timeout').setRequired(true))
    .addStringOption(o => o.setName('duration').setDescription('e.g. 10m, 1h, 1d').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for the timeout'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) return interaction.reply({ embeds: [embeds.error('That user is not in this server.')], ephemeral: true });

    const check = canModerate(interaction.guild, interaction.member, member);
    if (!check.ok) return interaction.reply({ embeds: [embeds.error(check.reason)], ephemeral: true });

    const durationMs = ms(durationStr);
    if (!durationMs || durationMs > 28 * 24 * 60 * 60 * 1000) {
      return interaction.reply({ embeds: [embeds.error('Invalid duration. Max is 28 days. Example: `10m`, `1h`, `1d`.')], ephemeral: true });
    }

    await member.timeout(durationMs, reason);
    await logModAction(interaction.guild, { userId: user.id, moderatorId: interaction.user.id, action: 'timeout', reason, duration: durationStr });

    await interaction.reply({ embeds: [embeds.success(`**${user.tag}** has been timed out for **${durationStr}**.\n**Reason:** ${reason}`, '🔇 Member Timed Out')] });
  }
};
