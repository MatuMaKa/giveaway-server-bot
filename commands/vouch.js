const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../config.json");
const { parsePlaceholders, formatDate, formatTime } = require("../utils/helpers");

const cooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vouch")
    .setDescription("Vouch for a user.")
    .addUserOption(opt =>
      opt.setName("user")
        .setDescription("User to vouch for")
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName("reason")
        .setDescription("Reason for the vouch")
        .setRequired(true)),

  async execute(interaction) {

    const cfg = config.VOUCHES;
    const userId = interaction.user.id;
    const member = interaction.member;
    
    const bypassRoles = cfg.cooldown_bypass_roles || [];

    const hasBypassRole = member.roles.cache.some(role =>
        bypassRoles.includes(role.id)
    );

    const cooldown = (cfg.cooldown_seconds || 0) * 1000;

    if (!hasBypassRole && cooldown > 0) {
      const now = Date.now();
      const lastUsed = cooldowns.get(userId);

      if (lastUsed && now < lastUsed + cooldown) {
        const remaining = Math.ceil((lastUsed + cooldown - now) / 1000);

        return interaction.reply({
          content: `⏳ You must wait **${remaining}s** before vouching again.`,
          ephemeral: true
        });
      }
    }

    const vouchee = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");

    if (!cfg.allow_self_vouch && vouchee.id === userId) {
      return interaction.reply({
        content: "❌ You cannot vouch yourself.",
        ephemeral: true
      });
    }

    if (!cfg.allow_bots && vouchee.bot) {
      return interaction.reply({
        content: "❌ You cannot vouch bots.",
        ephemeral: true
      });
    }

    const channel = interaction.guild.channels.cache.get(cfg.channel_id);

    if (!channel) {
      return interaction.reply({
        content: "❌ Vouch channel not configured.",
        ephemeral: true
      });
    }

    const now = new Date();

    const placeholders = {
      voucher: `<@${interaction.user.id}>`,
      vouchee: `<@${vouchee.id}>`,
      reason: reason,
      date: formatDate(now),
      time: formatTime(now)
    };

    const embedCfg = cfg.vouch_embed;

    const embed = new EmbedBuilder()
      .setTitle(parsePlaceholders(embedCfg.title, placeholders))
      .setDescription(parsePlaceholders(embedCfg.description, placeholders))
      .setColor(embedCfg.color || "#57F287")
      .setTimestamp();

    if (embedCfg.footer_text) {
      embed.setFooter({
        text: parsePlaceholders(embedCfg.footer_text, placeholders)
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
      content: "✅ Vouch submitted!",
      ephemeral: true
    });
    
    cooldowns.set(userId, now);
  }
};