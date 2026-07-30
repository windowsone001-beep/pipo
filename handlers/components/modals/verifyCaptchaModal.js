const embeds = require('../../../utils/embeds');
const GuildConfig = require('../../../models/GuildConfig');
const { pendingCaptchas } = require('../buttons/verifyStart');

module.exports = {
  id: 'verify_captcha_modal',
  async execute(interaction) {
    const record = pendingCaptchas.get(interaction.user.id);
    if (!record || Date.now() > record.expires) {
      return interaction.reply({ embeds: [embeds.error('Your captcha expired. Please click Verify again.')], ephemeral: true });
    }

    const input = interaction.fields.getTextInputValue('captcha_input').trim().toUpperCase();
    if (input !== record.code) {
      return interaction.reply({ embeds: [embeds.error('Incorrect code. Please click Verify to try again.')], ephemeral: true });
    }

    pendingCaptchas.delete(interaction.user.id);
    const cfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
    const role = interaction.guild.roles.cache.get(cfg?.verification?.verifiedRole);
    if (!role) return interaction.reply({ embeds: [embeds.error('The verified role no longer exists — contact an admin.')], ephemeral: true });

    await interaction.member.roles.add(role).catch(() => {});
    await interaction.reply({ embeds: [embeds.success('Correct! You have been verified. Welcome.')], ephemeral: true });
  }
};
