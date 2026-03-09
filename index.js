const { Client, GatewayIntentBits, Collection, Events, REST, Routes } = require("discord.js");
const fs   = require("fs");
const path = require("path");
const config = require("./config.json");

async function deployCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, "commands");
  for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"))) {
    const command = require(path.join(commandsPath, file));
    if ("data" in command) commands.push(command.data.toJSON());
  }

  const rest = new REST().setToken(config.TOKEN);
  try {
    await rest.put(
      Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
      { body: commands }
    );
    console.log("✅ Commands deployed!");
  } catch (err) {
    console.error("❌ Failed to deploy commands:", err);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"))) {
  const command = require(path.join(commandsPath, file));
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    console.log(`✅ Loaded command: /${command.data.name}`);
  }
}

const eventsPath = path.join(__dirname, "events");
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"))) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  console.log(`✅ Loaded event: ${event.name}`);
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`❌ Unknown command: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`❌ Error in /${interaction.commandName}:`, err);
    const msg = { content: "❌ An error occurred while running this command.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

client.once(Events.ClientReady, (c) => {
  console.log(`\n🤖 Logged in as ${c.user.tag}`);
});

deployCommands().then(() => client.login(config.TOKEN));