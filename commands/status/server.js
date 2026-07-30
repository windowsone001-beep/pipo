const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const GuildConfig = require('../../models/GuildConfig');
const { invalidate } = require('../../utils/getGuildConfig');

module.exports = {
  category: 'Status',
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('Configure the Minecraft server shown by /status.')
    .addSubcommand(sc => sc.setName('set').setDescription('Set your Minecraft server IP and port.')
      .addStringOption(o => o.setName('ip').setDescription('Server IP or domain, e.g. play.myserver.net').setRequired(true))
      .addIntegerOption(o => o.setName('port').setDescription('Server port (default 25565)').setMinValue(1).setMaxValue(65535)))
    .addSubcommand(sc => sc.setName('remove').setDescription('Stop showing a Minecraft server in /status.'))
    .addSubcommand(sc => sc.setName('view').setDescription('Show the currently configured Minecraft server.'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    let cfg = await GuildConfig.findOne({ guildId: interaction.guild.id }) || await GuildConfig.create({ guildId: interaction.guild.id });

    if (sub === 'set') {
      const ip = interaction.options.getString('ip').trim().replace(/^https?:\/\//, '');
      const port = interaction.options.getInteger('port') || 25565;

      if (!/^[a-zA-Z0-9.-]+$/.test(ip)) {
        return interaction.reply({ embeds: [embeds.error('That doesn\'t look like a valid IP/domain. Example: `play.myserver.net` or `192.168.1.1`.')], ephemeral: true });
      }

      cfg.minecraft = { ip, port };
      await cfg.save();
      invalidate(interaction.guild.id);

      await interaction.reply({ embeds: [embeds.success(`Minecraft server set to **${ip}:${port}**. It'll now show up in \`/status\`.`)] });
    }

    if (sub === 'remove') {
      cfg.minecraft = { ip: null, port: 25565 };
      await cfg.save();
      invalidate(interaction.guild.id);
      await interaction.reply({ embeds: [embeds.success('Minecraft server removed from `/status`.')] });
    }

    if (sub === 'view') {
      if (!cfg.minecraft?.ip) {
        return interaction.reply({ embeds: [embeds.info('No Minecraft server configured yet. Set one with `/server set`.')], ephemeral: true });
      }
      await interaction.reply({ embeds: [embeds.info(`**${cfg.minecraft.ip}:${cfg.minecraft.port}**`, '🎮 Configured Minecraft Server')] });
    }
  }
};
