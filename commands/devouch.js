const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../config.json");
const { parsePlaceholders, formatDate, formatTime } = require("../utils/helpers");

const cooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("devouch")
    .setDescription("Remove a vouch from a user.")
    .addUserOption(opt =>
      opt
        .setName("user")
        .setDescription("User you want to devouch")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName("reason")
        .setDescription("Reason for the devouch")
        .setRequired(true)
    ),

  async execute(interaction) {

    const cfg = config.VOUCHES;
    const userId = interaction.user.id;

    const cooldown = (cfg.cooldown_seconds || 0) * 1000;
    const bypassRoles = cfg.cooldown_bypass_roles || [];
    const member = interaction.member;

    const hasBypassRole = member.roles.cache.some(role =>
      bypassRoles.includes(role.id)
    );

    if (!hasBypassRole && cooldown > 0) {

      const now = Date.now();
      const lastUsed = cooldowns.get(userId);

      if (lastUsed && now < lastUsed + cooldown) {

        const remaining = Math.ceil((lastUsed + cooldown - now) / 1000);

        return interaction.reply({
          content: `⏳ You must wait **${remaining}s** before devouching again.`,
          ephemeral: true
        });
      }
    }

    const vouchee = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");

    const channel = interaction.guild.channels.cache.get(cfg.channel_id);

    if (!channel) {
      return interaction.reply({
        content: "❌ Devouch channel not configured correctly.",
        ephemeral: true
      });
    }

    const now = new Date();

    const placeholders = {
      voucher: `<@${interaction.user.id}>`,
      vouchee: `<@${vouchee.id}>`,
      reason,
      date: formatDate(now),
      time: formatTime(now)
    };

    const embedCfg = cfg.devouch_embed;

    const embed = new EmbedBuilder()
      .setTitle(parsePlaceholders(embedCfg.title, placeholders))
      .setDescription(parsePlaceholders(embedCfg.description, placeholders))
      .setColor(embedCfg.color || "#ED4245")
      .setTimestamp();

    if (embedCfg.footer_text) {
      embed.setFooter({
        text: parsePlaceholders(embedCfg.footer_text, placeholders),
        iconURL: embedCfg.footer_icon ?? undefined
      });
    }

    if (embedCfg.thumbnail === "vouchee_avatar") {
      embed.setThumbnail(vouchee.displayAvatarURL());
    }

    await channel.send({ 
        content: `<@${vouchee.id}>`,
        embeds: [embed] 
    });

    await interaction.reply({
      content: `❌ Devouched **${vouchee.username}**.`,
      ephemeral: true
    });

    cooldowns.set(userId, now);
  }
};