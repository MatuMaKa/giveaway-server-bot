const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const config = require("../config.json");
const { parsePlaceholders, formatDate, formatTime } = require("../utils/helpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("staffupdate")
    .setDescription("Post a staff promotion or demotion announcement.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("The staff member being updated.")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("action")
        .setDescription("Was this person promoted, demoted, resigned, or reinstated?")
        .setRequired(true)
        .addChoices(
          { name: "Promoted", value: "promoted" },
          { name: "Demoted",  value: "demoted"  },
          { name: "Resigned", value: "resigned" },
          { name: "Reinstated", value: "reinstated" },
        )
    )
    .addStringOption((opt) => {
      const builder = opt
        .setName("newrole")
        .setDescription("The new role (optional — auto-detected from current roles if left blank).")
        .setRequired(false);

      for (const role of config.STAFF_ROLES) {
        builder.addChoices({ name: role.name, value: role.id });
      }
      return builder;
    }),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user");
    const action = interaction.options.getString("action");
    const newRoleId = interaction.options.getString("newrole");
    const cfg = config.STAFF_UPDATE_EMBED;
    const roles = config.STAFF_ROLES;

    let member;
    try {
      member = await interaction.guild.members.fetch(targetUser.id);
    } catch {
      return interaction.reply({
        content: "❌ Could not fetch that user from the server.",
        ephemeral: true,
      });
    }

    const botMember = await interaction.guild.members.fetchMe();
    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({
        content: "❌ I don't have the **Manage Roles** permission.",
        ephemeral: true,
      });
    }

    let resolvedNewRoleId;
    let previousRoleId;

    if (newRoleId) {
      resolvedNewRoleId = newRoleId;
      const newIndex = roles.findIndex((r) => r.id === newRoleId);

      if (action === "promoted") {
        previousRoleId = newIndex > 0 ? roles[newIndex - 1].id : roles[0].id;
      } else {
        previousRoleId = newIndex < roles.length - 1
          ? roles[newIndex + 1].id
          : roles[roles.length - 1].id;
      }
    } else {
      const currentIndex = roles.findIndex((r) => member.roles.cache.has(r.id));

      if (currentIndex === -1) {
        if (!newRoleId) {
          resolvedNewRoleId = roles[0].id;
          previousRoleId = null;
        } else {
          resolvedNewRoleId = newRoleId;
          previousRoleId = null;
        }
      }

      previousRoleId = roles[currentIndex].id;

      if (action === "promoted") {
        if (currentIndex >= roles.length - 1) {
          return interaction.reply({
            content: `❌ **${targetUser.username}** is already at the highest role (**${roles[currentIndex].name}**) and cannot be promoted further.`,
            ephemeral: true,
          });
        }
        resolvedNewRoleId = roles[currentIndex + 1].id;
      } else {
        if (currentIndex <= 0) {
          return interaction.reply({
            content: `❌ **${targetUser.username}** is already at the lowest role (**${roles[currentIndex].name}**) and cannot be demoted further.`,
            ephemeral: true,
          });
        }
        resolvedNewRoleId = roles[currentIndex - 1].id;
      }
    }

    try {
      if (member.roles.cache.has(previousRoleId)) {
        await member.roles.remove(previousRoleId);
      }
      await member.roles.add(resolvedNewRoleId);
    } catch (err) {
      console.error("❌ Failed to update roles:", err);
      return interaction.reply({
        content: "❌ Failed to update roles. Make sure my role is **above** all staff roles in the role list.",
        ephemeral: true,
      });
    }

    const now = new Date();
    const placeholders = {
      user: `<@${targetUser.id}>`,
      username: targetUser.username,
      action,
      previousRole: `<@&${previousRoleId}>`,
      newRole: `<@&${resolvedNewRoleId}>`,
      executor: `<@${interaction.user.id}>`,
      date: formatDate(now),
      time: formatTime(now),
    };

    let color;
    if (action === "promoted") color = cfg.color_promoted ?? "#57F287";
    else if (action === "demoted") color = cfg.color_demoted ?? "#ED4245";
    else if (action === "resigned") color = cfg.color_resigned ?? "#ED4245";
    else if (action === "reinstated") color = cfg.color_reinstated ?? "#57F287";
    else color = cfg.color_default ?? "#5865F2";

    let description;
    if (action === "promoted" || action === "demoted") {
      description = parsePlaceholders(cfg.default_description, placeholders);
    } else if (action === "resigned") {
      description = parsePlaceholders(cfg.resigned_description, placeholders);
    } else if (action === "reinstated") {
      description = parsePlaceholders(cfg.reinstated_description, placeholders);
    } else {
      description = parsePlaceholders("{user} has been **{action}** from {previousRole} to {newRole}!", placeholders);
    }

    const embed = new EmbedBuilder()
      .setTitle(parsePlaceholders(cfg.title, placeholders))
      .setDescription(description)
      .setColor(color)
      .setTimestamp();

    if (cfg.footer_text) {
      embed.setFooter({
        text: parsePlaceholders(cfg.footer_text, placeholders),
        iconURL: cfg.footer_icon ?? undefined,
      });
    }

    if (cfg.thumbnail) {
      embed.setThumbnail(cfg.thumbnail);
    }

    if (cfg.show_executor) {
      embed.addFields({
        name: cfg.executor_label ?? "Actioned by",
        value: `<@${interaction.user.id}>`,
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};