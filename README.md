# giveaway-server-bot
Staff updates, ping announcements, welcome system and more for your giveaway servers!

---

## 📁 File Structure

```
discord-bot/
├── config.json             (All the settings are located here)
├── index.js                (Main script)
├── package.json
├── commands/
│   ├── staffupdate.js
│   └── ping.js
├── events/
│   └── guildMemberAdd.js
└── utils/
    └── helpers.js
```

---

## 🚀 Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Edit `config.json`
Fill in the following fields:

| Field | Where to find it |
|---|---|
| `TOKEN` | [Discord Developer Portal](https://discord.com/developers) > Your App > Bot > Token |
| `CLIENT_ID` | Developer Portal > Your App > General Information > Application ID |
| `GUILD_ID` | Right-click your server in Discord > **Copy Server ID** (requires Developer Mode) |
| `WELCOME.channel_id` | Right-click the welcome channel > **Copy Channel ID** |

> **Enable Developer Mode:** Discord Settings > Advanced > Developer Mode ✅

### 3. Start the bot
```bash
npm run start
```

---

## ⚙️ Configuration Reference (`config.json`)

### STAFF_ROLES
An ordered array from **lowest > highest** rank. Each entry needs a `name` and the Discord role `id`.

```json
"STAFF_ROLES": [
  { "name": "Trial Moderator", "id": "123456789012345678" },
  { "name": "Moderator", "id": "234567890123456789" },
  { "name": "Administrator", "id": "345678901234567890" }
]
```

To get a role ID: Server Settings > Roles > right-click role > **Copy Role ID**.

---

### `/staffupdate` - How role auto-detection works

The `newrole` option is **optional**.

- **Left blank** - the bot looks at the member's current Discord roles, finds their position in `STAFF_ROLES` and automatically moves them one step up (promoted) or one step down (demoted).
- **Manually selected** - overrides auto-detection and uses the role you pick.

**Example (auto):**
> User has `Helper` > `/staffupdate @User promoted` > bot posts `Helper > Developer`

**Edge case handling:**
- No matching staff role found > error, asks you to select manually
- Already at top/bottom of list > error, blocks the action

---

### STAFF_UPDATE_EMBED Placeholders

| Placeholder | Value |
|---|---|
| `{user}` | Mention of the staff member |
| `{username}` | Plain username |
| `{action}` | `promoted` or `demoted` |
| `{previousRole}` | Role mention (e.g. `@Helper`) |
| `{newRole}` | Role mention (e.g. `@Developer`) |
| `{executor}` | Who ran the command |
| `{date}` | DD/MM/YYYY |
| `{time}` | HH:MM |

---

### PING_MESSAGES

Add or remove ping types freely. The slash command choices are built dynamically.

```json
"PING_MESSAGES": {
  "Giveaway": "🎉 Giveaway live! <@&ROLE_ID>",
  "Quickdrop": "⚡ Quickdrop now! <@&ROLE_ID>",
  "Event": "🎮 Event starting! @everyone"
}
```

---

### WELCOME Embed Placeholders

| Placeholder | Value |
|---|---|
| `{user}` | Mention of the new member |
| `{username}` | Plain username |
| `{memberCount}` | Total server member count |
| `{serverName}` | Server name |
| `{date}` | DD/MM/YYYY |
| `{time}` | HH:MM |

**Thumbnail options:**
| Value | Result |
|---|---|
| `"member_avatar"` | New member's avatar |
| `"server_icon"` | Your server's icon |
| `"https://..."` | Any direct image URL |
| `null` | No thumbnail |

---

## 🔒 Required Bot Permissions
- Send Messages
- Embed Links
- Mention Everyone *(for ping command)*

## 🛡️ Required Privileged Intents
Enable both in the [Developer Portal](https://discord.com/developers) > Your App > Bot:
- ✅ **Server Members Intent** - required for the welcome system
- ✅ **Message Content Intent** - recommended for future features

---

## 🛠️ Common Issues

| Problem | Fix |
|---|---|
| `Cannot find module 'discord.js'` | Run `npm install` |
| Commands not updating | Make sure `GUILD_ID` is set in `config.json` |
| Welcome message not sending | Check `WELCOME.channel_id` is correct and **Server Members Intent** is enabled |
| Bot can't find staff role on user | The user must actually have the Discord role assigned, the bot reads live role data |
