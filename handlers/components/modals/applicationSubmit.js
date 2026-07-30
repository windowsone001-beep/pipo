const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embeds = require('../../../utils/embeds');
const GuildConfig = require('../../../models/GuildConfig');
const Application = require('../../../models/Application');
const config = require('../../../config/config');

module.exports = {
  id: 'app_submit_',
  async execute(interaction) {
    const panelId = interaction.customId.replace('app_submit_', '');
    const cfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
    const panel = cfg?.applications.find(p => p.panelId === panelId);
    if (!panel) return interaction.reply({ embeds: [embeds.error('This application panel no longer exists.')], ephemeral: true });

    const answers = panel.questions.map((q, i) => ({ question: q, answer: interaction.fields.getTextInputValue(`q${i}`) }));
    const application = await Application.create({ guildId: interaction.guild.id, panelId, userId: interaction.user.id, answers });

    const logChannel = interaction.guild.channels.cache.get(panel.logChannel);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setColor(config.colors.info)
        .setTitle(`📝 New ${panel.name} Application`)
        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
        .setFooter({ text: `Application ID: ${application._id}` })
        .setTimestamp();

      answers.forEach(a => embed.addFields({ name: a.question, value: a.answer.slice(0, 1024) }));

      await logChannel.send({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`app_accept_${application._id}`).setLabel('Accept').setEmoji('✅').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`app_reject_${application._id}`).setLabel('Reject').setEmoji('❌').setStyle(ButtonStyle.Danger)
        )]
      });
    }

    await interaction.reply({ embeds: [embeds.success('Your application has been submitted! You will be DMed the result.')], ephemeral: true });
  }
};
