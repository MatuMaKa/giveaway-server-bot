const { Events, EmbedBuilder } = require("discord.js");
const config = require("../config.json");
const { parsePlaceholders, formatDate, formatTime } = require("../utils/helpers");

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,

  async execute(member) {
    const cfg = config.WELCOME;

    if (!cfg.channel_id) return;

    const channel = member.guild.channels.cache.get(cfg.channel_id);
    if (!channel) {
      console.warn(`⚠️  Welcome channel (${cfg.channel_id}) not found in guild: ${member.guild.name}`);
      return;
    }

    const now = new Date();
    const placeholders = {
      user: `<@${member.id}>`,
      username: member.user.username,
      memberCount: member.guild.memberCount,
      serverName: member.guild.name,
      date: formatDate(now),
      time: formatTime(now),
    };

    const embedCfg = cfg.embed;

    let thumbnailURL = null;
    if (embedCfg.thumbnail === "member_avatar") {
      thumbnailURL = member.user.displayAvatarURL({ size: 256 });
    } else if (embedCfg.thumbnail === "server_icon") {
      thumbnailURL = member.guild.iconURL({ size: 256 });
    } else if (typeof embedCfg.thumbnail === "string" && embedCfg.thumbnail.startsWith("http")) {
      thumbnailURL = embedCfg.thumbnail;
    }

    const embed = new EmbedBuilder()
      .setColor(embedCfg.color ?? "#5865F2")
      .setTimestamp();

    if (embedCfg.title) {
      embed.setTitle(parsePlaceholders(embedCfg.title, placeholders));
    }

    if (embedCfg.description) {
      embed.setDescription(parsePlaceholders(embedCfg.description, placeholders));
    }

    if (embedCfg.footer_text) {
      embed.setFooter({
        text:    parsePlaceholders(embedCfg.footer_text, placeholders),
        iconURL: embedCfg.footer_icon ?? undefined,
      });
    }

    if (thumbnailURL) {
      embed.setThumbnail(thumbnailURL);
    }

    if (embedCfg.image) {
      embed.setImage(embedCfg.image);
    }

    if (Array.isArray(embedCfg.fields) && embedCfg.fields.length > 0) {
      embed.addFields(
        embedCfg.fields.filter(Boolean).map((f) => ({
          name: parsePlaceholders(f.name,  placeholders),
          value: parsePlaceholders(f.value, placeholders),
          inline: f.inline ?? false,
        }))
      );
    }

    const payload = { embeds: [embed] };
    if (cfg.message) {
      payload.content = parsePlaceholders(cfg.message, placeholders);
    }

    await channel.send(payload);
  },
};