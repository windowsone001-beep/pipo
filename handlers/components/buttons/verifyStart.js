const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const embeds = require('../../../utils/embeds');
const GuildConfig = require('../../../models/GuildConfig');

// In-memory captcha code store: userId -> code (expires in 5 min)
const pendingCaptchas = new Map();

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

module.exports = {
  id: 'verify_start',
  pendingCaptchas, // exported so the modal handler can read it
  async execute(interaction) {
    const cfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
    if (!cfg?.verification?.enabled) return interaction.reply({ embeds: [embeds.error('Verification is not set up on this server.')], ephemeral: true });

    const role = interaction.guild.roles.cache.get(cfg.verification.verifiedRole);
    if (!role) return interaction.reply({ embeds: [embeds.error('The verified role no longer exists — contact an admin.')], ephemeral: true });

    if (interaction.member.roles.cache.has(role.id)) {
      return interaction.reply({ embeds: [embeds.info('You are already verified.')], ephemeral: true });
    }

    if (cfg.verification.type === 'button') {
      await interaction.member.roles.add(role).catch(() => {});
      return interaction.reply({ embeds: [embeds.success('You have been verified! Welcome.')], ephemeral: true });
    }

    // Captcha flow
    const code = generateCode();
    pendingCaptchas.set(interaction.user.id, { code, expires: Date.now() + 5 * 60_000 });

    const modal = new ModalBuilder()
      .setCustomId('verify_captcha_modal')
      .setTitle('Verification Captcha')
      .addComponents(new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('captcha_input')
          .setLabel(`Type this code exactly: ${code}`)
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ));
    await interaction.showModal(modal);
  }
};
