const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ms = require('ms');
const embeds = require('../../utils/embeds');
const Giveaway = require('../../models/Giveaway');
const config = require('../../config/config');

module.exports = {
  category: 'Giveaway',
  data: new SlashCommandBuilder()
    .setName('gstart')
    .setDescription('Start a giveaway.')
    .addStringOption(o => o.setName('duration').setDescription('e.g. 1h, 30m, 2d').setRequired(true))
    .addStringOption(o => o.setName('prize').setDescription('What are you giving away?').setRequired(true))
    .addIntegerOption(o => o.setName('winners').setDescription('Number of winners').setMinValue(1))
    .addChannelOption(o => o.setName('channel').setDescription('Channel to host the giveaway in'))
    .addRoleOption(o => o.setName('required_role').setDescription('Role required to enter'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents),
  async execute(interaction) {
    const durationStr = interaction.options.getString('duration');
    const durationMs = ms(durationStr);
    if (!durationMs) return interaction.reply({ embeds: [embeds.error('Invalid duration. Example: `1h`, `30m`, `2d`.')], ephemeral: true });

    const prize = interaction.options.getString('prize');
    const winnerCount = interaction.options.getInteger('winners') || 1;
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const requiredRole = interaction.options.getRole('required_role');
    const endsAt = new Date(Date.now() + durationMs);

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`🎉 ${prize}`)
      .setDescription(
        `Click the button below to enter!\n\n` +
        `**Winners:** ${winnerCount}\n` +
        `**Ends:** <t:${Math.floor(endsAt.getTime() / 1000)}:R>\n` +
        (requiredRole ? `**Required role:** <@&${requiredRole.id}>\n` : '') +
        `**Hosted by:** ${interaction.user}`
      )
      .setTimestamp(endsAt);

    const message = await channel.send({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('giveaway_enter').setLabel('🎉 Enter Giveaway').setStyle(ButtonStyle.Primary)
      )]
    });

    await Giveaway.create({
      guildId: interaction.guild.id,
      channelId: channel.id,
      messageId: message.id,
      hostId: interaction.user.id,
      prize,
      winnerCount,
      endsAt,
      requirements: { roles: requiredRole ? [requiredRole.id] : [] }
    });

    await interaction.reply({ embeds: [embeds.success(`Giveaway started in ${channel}!`)], ephemeral: true });
  }
};
