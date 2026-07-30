const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embeds = require('../../utils/embeds');
const GuildConfig = require('../../models/GuildConfig');
const { invalidate } = require('../../utils/getGuildConfig');

module.exports = {
  category: 'Verification',
  data: new SlashCommandBuilder()
    .setName('verification-setup')
    .setDescription('Set up the member verification system.')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to post the verification message').setRequired(true))
    .addRoleOption(o => o.setName('verified_role').setDescription('Role granted upon verifying').setRequired(true))
    .addStringOption(o => o.setName('type').setDescription('Verification method').addChoices(
      { name: 'Button (one click)', value: 'button' },
      { name: 'Captcha (type a code)', value: 'captcha' }
    ).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const role = interaction.options.getRole('verified_role');
    const type = interaction.options.getString('type');

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({ embeds: [embeds.error("I can't assign a role higher than or equal to my own highest role.")], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('✅ Verify Yourself')
      .setDescription(type === 'button'
        ? 'Click the button below to verify and gain access to the server.'
        : 'Click the button below — you will be asked to type a short code to verify you\'re human.');

    const message = await channel.send({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('verify_start').setLabel('Verify').setEmoji('✅').setStyle(ButtonStyle.Success)
      )]
    });

    let cfg = await GuildConfig.findOne({ guildId: interaction.guild.id }) || await GuildConfig.create({ guildId: interaction.guild.id });
    cfg.verification = { enabled: true, channel: channel.id, verifiedRole: role.id, type, messageId: message.id };
    await cfg.save();
    invalidate(interaction.guild.id);

    await interaction.reply({ embeds: [embeds.success(`Verification set up in ${channel} using **${type}** mode.`)], ephemeral: true });
  }
};
