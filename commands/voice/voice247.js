const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const GuildConfig = require('../../models/GuildConfig');
const { invalidate } = require('../../utils/getGuildConfig');
const { join, connections } = require('../../utils/voice247');

module.exports = {
  category: 'Voice',
  data: new SlashCommandBuilder()
    .setName('voice247')
    .setDescription('Keep the bot connected to a voice channel 24/7.')
    .addSubcommand(sc => sc.setName('join').setDescription('Join and stay in a voice channel')
      .addChannelOption(o => o.setName('channel').setDescription('Voice channel').setRequired(true)))
    .addSubcommand(sc => sc.setName('leave').setDescription('Leave and disable 24/7 voice'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    let cfg = await GuildConfig.findOne({ guildId: interaction.guild.id }) || await GuildConfig.create({ guildId: interaction.guild.id });

    if (sub === 'join') {
      const channel = interaction.options.getChannel('channel');
      await join(interaction.guild, channel.id);
      cfg.voice247 = { enabled: true, channelId: channel.id };
      await cfg.save();
      invalidate(interaction.guild.id);
      return interaction.reply({ embeds: [embeds.success(`Joined ${channel} and will stay connected 24/7, auto-reconnecting if disconnected.`)] });
    }

    if (sub === 'leave') {
      const connection = connections.get(interaction.guild.id);
      if (connection) connection.destroy();
      connections.delete(interaction.guild.id);
      cfg.voice247 = { enabled: false, channelId: null };
      await cfg.save();
      invalidate(interaction.guild.id);
      return interaction.reply({ embeds: [embeds.success('Left the voice channel and disabled 24/7 mode.')] });
    }
  }
};
