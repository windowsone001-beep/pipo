const embeds = require('../../../utils/embeds');
const GuildConfig = require('../../../models/GuildConfig');

module.exports = {
  id: 'selfrole_menu',
  async execute(interaction) {
    const cfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
    const panel = cfg?.selfRoles.find(p => p.messageId === interaction.message.id);
    if (!panel) return interaction.reply({ embeds: [embeds.error('This panel is no longer configured.')], ephemeral: true });

    const allRoleIds = panel.roles.map(r => r.roleId);
    const selected = interaction.values; // roles the user wants active
    const toAdd = selected.filter(r => !interaction.member.roles.cache.has(r));
    const toRemove = allRoleIds.filter(r => !selected.includes(r) && interaction.member.roles.cache.has(r));

    for (const r of toAdd) await interaction.member.roles.add(r).catch(() => {});
    for (const r of toRemove) await interaction.member.roles.remove(r).catch(() => {});

    await interaction.reply({ embeds: [embeds.success('Your roles have been updated.')], ephemeral: true });
  }
};
