const embeds = require('../../../utils/embeds');
const Giveaway = require('../../../models/Giveaway');

module.exports = {
  id: 'giveaway_enter',
  async execute(interaction) {
    const giveaway = await Giveaway.findOne({ messageId: interaction.message.id });
    if (!giveaway) return interaction.reply({ embeds: [embeds.error('This giveaway could not be found.')], ephemeral: true });
    if (giveaway.ended) return interaction.reply({ embeds: [embeds.warn('This giveaway has already ended.')], ephemeral: true });
    if (giveaway.paused) return interaction.reply({ embeds: [embeds.warn('This giveaway is currently paused.')], ephemeral: true });

    // ---- Requirement checks ----
    if (giveaway.requirements?.roles?.length) {
      const hasRole = giveaway.requirements.roles.some(r => interaction.member.roles.cache.has(r));
      if (!hasRole) {
        return interaction.reply({
          embeds: [embeds.error(`You need the following role(s) to enter: ${giveaway.requirements.roles.map(r => `<@&${r}>`).join(', ')}`)],
          ephemeral: true
        });
      }
    }
    // Level requirement hook: if you have a leveling system, check it here before allowing entry.
    // if (giveaway.requirements.minLevel > 0) { ... }

    if (giveaway.entries.includes(interaction.user.id)) {
      giveaway.entries = giveaway.entries.filter(id => id !== interaction.user.id);
      await giveaway.save();
      return interaction.reply({ embeds: [embeds.info('You have left the giveaway.')], ephemeral: true });
    }

    giveaway.entries.push(interaction.user.id);
    await giveaway.save();
    await interaction.reply({ embeds: [embeds.success(`You're entered! Good luck 🎉 (${giveaway.entries.length} total entries)`)], ephemeral: true });
  }
};
