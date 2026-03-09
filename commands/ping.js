const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const config = require("../config.json");

module.exports = {
  data: (() => {
    const builder = new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Send a ping announcement to the current channel.")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addStringOption((opt) => {
        const choice = opt
          .setName("type")
          .setDescription("What type of ping do you want to send?")
          .setRequired(true);

        for (const key of Object.keys(config.PING_MESSAGES)) {
          choice.addChoices({ name: key, value: key });
        }

        return choice;
      });

    return builder;
  })(),

  async execute(interaction) {
    const type    = interaction.options.getString("type");
    const message = config.PING_MESSAGES[type];

    if (!message) {
      return interaction.reply({
        content:   `❌ No message configured for **${type}**. Add it to \`config.json\` under \`PING_MESSAGES\`.`,
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });
    await interaction.channel.send(message);
    await interaction.editReply({ content: `✅ **${type}** ping sent!` });
  },
};