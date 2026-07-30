const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');
const embeds = require('../../utils/embeds');
const ScheduledMessage = require('../../models/ScheduledMessage');

module.exports = {
  category: 'Message Builder',
  data: new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Schedule a message to be sent later.')
    .addStringOption(o => o.setName('message').setDescription('The message content').setRequired(true))
    .addStringOption(o => o.setName('delay').setDescription('When to send it, e.g. 10m, 1h, 2d').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Channel to send to (defaults to here)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const delayMs = ms(interaction.options.getString('delay'));
    if (!delayMs) return interaction.reply({ embeds: [embeds.error('Invalid delay. Example: `10m`, `1h`, `2d`.')], ephemeral: true });

    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const sendAt = new Date(Date.now() + delayMs);

    await ScheduledMessage.create({
      guildId: interaction.guild.id,
      channelId: channel.id,
      authorId: interaction.user.id,
      content: interaction.options.getString('message'),
      sendAt
    });

    await interaction.reply({ embeds: [embeds.success(`Message scheduled for <t:${Math.floor(sendAt.getTime() / 1000)}:F> in ${channel}.`)], ephemeral: true });
  }
};
