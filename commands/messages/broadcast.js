const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const config = require('../../config/config');

// Simple per-guild cooldown to prevent broadcast spam / accidental double-sends.
const cooldowns = new Map();
const COOLDOWN_MS = 10 * 60_000; // 10 minutes

module.exports = {
  category: 'Broadcast',
  data: new SlashCommandBuilder()
    .setName('broadcast')
    .setDescription('Send a DM to every member of this server. Use with care.')
    .addStringOption(o => o.setName('message').setDescription('The message to send').setRequired(true))
    .addRoleOption(o => o.setName('only_role').setDescription('Only DM members with this role'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const lastUsed = cooldowns.get(interaction.guild.id);
    if (lastUsed && Date.now() - lastUsed < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastUsed)) / 60000);
      return interaction.reply({ embeds: [embeds.error(`Broadcast is on cooldown. Try again in ${remaining} minute(s).`)], ephemeral: true });
    }
    cooldowns.set(interaction.guild.id, Date.now());

    const message = interaction.options.getString('message');
    const onlyRole = interaction.options.getRole('only_role');

    await interaction.reply({ embeds: [embeds.info('Starting broadcast... this may take a while for large servers.')], ephemeral: true });

    await interaction.guild.members.fetch();
    let targets = interaction.guild.members.cache.filter(m => !m.user.bot);
    if (onlyRole) targets = targets.filter(m => m.roles.cache.has(onlyRole.id));

    let sent = 0, failed = 0;
    const failedUsers = [];
    const total = targets.size;

    for (const [, member] of targets) {
      try {
        await member.send({
          embeds: [new EmbedBuilder().setColor(config.colors.primary).setTitle(`📢 Announcement from ${interaction.guild.name}`).setDescription(message).setTimestamp()]
        });
        sent++;
      } catch {
        failed++;
        failedUsers.push(member.user.tag);
      }

      // Update progress every 25 sends and rate-limit ourselves to respect Discord's DM limits.
      if ((sent + failed) % 25 === 0) {
        await interaction.editReply({ embeds: [embeds.info(`Progress: ${sent + failed}/${total} (✅ ${sent} sent, ❌ ${failed} failed)`)] }).catch(() => {});
      }
      await new Promise(r => setTimeout(r, 300)); // gentle pacing to avoid Discord rate limits
    }

    await interaction.editReply({
      embeds: [embeds.success(`Broadcast complete.\n✅ **Sent:** ${sent}\n❌ **Failed:** ${failed}${failed ? ' (DMs closed or blocked)' : ''}`)]
    });

    if (failedUsers.length) {
      const cfg = await require('../../utils/getGuildConfig').getGuildConfig(interaction.guild.id);
      const logChannel = cfg.modLogChannel ? interaction.guild.channels.cache.get(cfg.modLogChannel) : null;
      if (logChannel) {
        logChannel.send({
          embeds: [embeds.warn(`Failed to DM ${failedUsers.length} user(s) during broadcast:\n${failedUsers.slice(0, 30).join(', ')}${failedUsers.length > 30 ? '...' : ''}`, '📢 Broadcast — Failed DMs')]
        }).catch(() => {});
      }
    }
  }
};
