const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const GuildConfig = require('../../models/GuildConfig');
const { invalidate } = require('../../utils/getGuildConfig');

const LOG_FIELDS = {
  modlog: 'modLogChannel',
  ticketlog: 'ticketLogChannel',
  securitylog: 'securityLogChannel',
  giveawaylog: 'giveawayLogChannel',
  applicationlog: 'applicationLogChannel',
  messagelog: 'messageLogChannel',
  voicelog: 'voiceLogChannel',
  joinleavelog: 'joinLeaveLogChannel'
};

module.exports = {
  category: 'Configuration',
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure MineCore Manager for this server.')
    .addSubcommand(sc => sc.setName('set-log').setDescription('Set a logging channel')
      .addStringOption(o => o.setName('type').setDescription('Log type').setRequired(true).addChoices(
        ...Object.keys(LOG_FIELDS).map(k => ({ name: k, value: k }))
      ))
      .addChannelOption(o => o.setName('channel').setDescription('The channel').setRequired(true)))
    .addSubcommand(sc => sc.setName('welcome').setDescription('Configure the welcome message')
      .addChannelOption(o => o.setName('channel').setDescription('Welcome channel').setRequired(true))
      .addStringOption(o => o.setName('message').setDescription('Use {user} {mention} {server} {memberCount}').setRequired(true))
      .addBooleanOption(o => o.setName('dm').setDescription('Also DM the welcome message')))
    .addSubcommand(sc => sc.setName('goodbye').setDescription('Configure the goodbye message')
      .addChannelOption(o => o.setName('channel').setDescription('Goodbye channel').setRequired(true))
      .addStringOption(o => o.setName('message').setDescription('Use {user} {server} {memberCount}').setRequired(true)))
    .addSubcommand(sc => sc.setName('security').setDescription('Toggle a security module')
      .addStringOption(o => o.setName('module').setDescription('Security module').setRequired(true).addChoices(
        { name: 'Anti-Spam', value: 'antiSpam' }, { name: 'Anti-Link', value: 'antiLink' },
        { name: 'Anti-Invite', value: 'antiInvite' }, { name: 'Anti-Everyone', value: 'antiEveryone' },
        { name: 'Anti-Bot', value: 'antiBot' }, { name: 'Anti-Webhook', value: 'antiWebhook' },
        { name: 'Anti-Raid', value: 'antiRaid' }, { name: 'Anti-Channel Delete/Create', value: 'antiChannelDeleteCreate' },
        { name: 'Anti-Role Delete/Create', value: 'antiRoleDeleteCreate' }, { name: 'Anti-Server Update', value: 'antiServerUpdate' }
      ))
      .addBooleanOption(o => o.setName('enabled').setDescription('On or off').setRequired(true)))
    .addSubcommand(sc => sc.setName('security-whitelist').setDescription('Whitelist a user from all security auto-punishments')
      .addUserOption(o => o.setName('user').setDescription('User to whitelist').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    let cfg = await GuildConfig.findOne({ guildId: interaction.guild.id }) || await GuildConfig.create({ guildId: interaction.guild.id });

    if (sub === 'set-log') {
      const type = interaction.options.getString('type');
      const channel = interaction.options.getChannel('channel');
      cfg[LOG_FIELDS[type]] = channel.id;
      await cfg.save();
      invalidate(interaction.guild.id);
      return interaction.reply({ embeds: [embeds.success(`**${type}** will now log to ${channel}.`)] });
    }

    if (sub === 'welcome') {
      cfg.welcome.enabled = true;
      cfg.welcome.channel = interaction.options.getChannel('channel').id;
      cfg.welcome.message = interaction.options.getString('message');
      if (interaction.options.getBoolean('dm') !== null) cfg.welcome.dmEnabled = interaction.options.getBoolean('dm');
      await cfg.save();
      invalidate(interaction.guild.id);
      return interaction.reply({ embeds: [embeds.success('Welcome message configured.')] });
    }

    if (sub === 'goodbye') {
      cfg.goodbye.enabled = true;
      cfg.goodbye.channel = interaction.options.getChannel('channel').id;
      cfg.goodbye.message = interaction.options.getString('message');
      await cfg.save();
      invalidate(interaction.guild.id);
      return interaction.reply({ embeds: [embeds.success('Goodbye message configured.')] });
    }

    if (sub === 'security') {
      const mod = interaction.options.getString('module');
      const enabled = interaction.options.getBoolean('enabled');
      cfg.security[mod].enabled = enabled;
      await cfg.save();
      invalidate(interaction.guild.id);
      return interaction.reply({ embeds: [embeds.success(`**${mod}** is now **${enabled ? 'enabled' : 'disabled'}**.`)] });
    }

    if (sub === 'security-whitelist') {
      const user = interaction.options.getUser('user');
      if (!cfg.security.whitelistedUsers.includes(user.id)) cfg.security.whitelistedUsers.push(user.id);
      await cfg.save();
      invalidate(interaction.guild.id);
      return interaction.reply({ embeds: [embeds.success(`**${user.tag}** is now whitelisted from auto-security actions.`)] });
    }
  }
};
