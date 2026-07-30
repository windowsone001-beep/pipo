const embeds = require('../../../utils/embeds');

module.exports = {
  id: 'selfrole_btn_',
  async execute(interaction) {
    const roleId = interaction.customId.replace('selfrole_btn_', '');
    const role = interaction.guild.roles.cache.get(roleId);
    if (!role) return interaction.reply({ embeds: [embeds.error('That role no longer exists.')], ephemeral: true });

    if (interaction.member.roles.cache.has(roleId)) {
      await interaction.member.roles.remove(role).catch(() => {});
      return interaction.reply({ embeds: [embeds.info(`Removed **${role.name}**.`)], ephemeral: true });
    }
    await interaction.member.roles.add(role).catch(() => {});
    await interaction.reply({ embeds: [embeds.success(`Added **${role.name}**.`)], ephemeral: true });
  }
};
