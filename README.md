# MineCore Manager

A modular, production-oriented Discord bot (discord.js v14) with a companion Express/EJS dashboard.
**Storage is real MongoDB** — both the bot and the dashboard read/write the same MongoDB database, so a database is now required (Atlas free tier works fine).

## ✅ What's fully implemented

- **Core**: command/event/component handlers, MongoDB models, slash command deploy script, global error handling
- **Administration**: ban, unban, kick, timeout, untimeout, mute, unmute, warn, unwarn, warnings, lock, unlock, purge, slowmode, nickname, role add/remove — all logged to `/config set-log modlog`
- **Tickets**: unlimited panels, unlimited categories per panel (with `list`/`remove-category`/`delete` management), claim/close/reopen/delete, add/remove user, HTML transcripts (with automatic fallback delivery — see below), ticket logs, per-user open-ticket cap
- **Auto Reply**: `/autoreply add|remove|list|toggle` — keyword-triggered automatic responses (contains or exact match, case-sensitive toggle, per-channel cooldown so it can't be spam-triggered)
- **Giveaways**: `/gstart`, `/gend`, `/greroll`, `/gpause`, `/gresume`, role requirements, giveaway logs, auto-end loop
- **Staff Applications**: unlimited panels, custom questions (modal-based, up to 5 per panel — a Discord modal limit), accept/reject buttons, DM results, application logs
- **Security**: anti-spam, anti-link, anti-invite, anti-everyone, anti-bot, anti-webhook, anti-raid (join flood), anti-nuke (channel/role create-delete threshold), anti-server-update, per-user whitelist, security logs
- **Auto Role**: separate human/bot role lists
- **Self Roles**: buttons, select menus, and reaction roles
- **Verification**: button mode and captcha mode (in-memory code, modal-based)
- **Embed Builder**: `/embed send` and `/embed edit` — title, description, color, footer, thumbnail, image, author, optional link button
- **Message Builder**: `/say`, `/schedule`, `/editmessage`, `/deletemessage`
- **Voice**: `/voice247 join|leave` — persistent voice connection with auto-reconnect on disconnect and on bot restart
- **Welcome/Goodbye**: channel + DM welcome, variable substitution (`{user}`, `{mention}`, `{server}`, `{memberCount}`), leave logs
- **Status**: `/status` shows Discord stats (members, online/offline, boosts, ping) + live Minecraft server status (via mcsrvstat.us) — each server's owner/admin sets their own IP/port with `/server set`, no shared env var needed anymore
- **Broadcast**: `/broadcast` DMs all members with a live progress indicator, per-guild cooldown, and failed-DM logging
- **Logging**: join/leave, message delete/edit, voice, role create/delete, channel create/delete, webhook updates, server updates, security actions, ticket events
- **Utility**: ping, userinfo, serverinfo, roleinfo, channelinfo, avatar, botinfo, invite, uptime, help
- **Music**: play, pause, resume, skip, stop, queue, volume, loop (DisTube + YouTube)
- **Dashboard**: Vaylex-branded purple/black/glass theme with Font Awesome icons throughout (no emoji), Discord OAuth2 login (users only see and manage servers where they have Manage Server permission; bot owners get a separate global admin overview). The home page is your **profile** (avatar, banner, real Discord badges, a working credits + 24h daily-reward system, and a real activity timeline pulled from your mod actions/tickets/applications) with your server list in the sidebar. Each server's settings are **separate real pages** (`/dashboard/:id/tickets`, `/dashboard/:id/security`, etc.) — not one long scrollable page — with live stat cards and Chart.js charts, plus honest "not built yet" states for features with no bot-side implementation (server-level economy, leveling, suggestions, music queue UI, premium). All backed by MongoDB, the same database the bot writes to. Runs together with the bot via a single `npm start`.
- **Translate Embed**: `/trembed text:... [title] [color] [channel]` — sends an embed with a "ترجمة • Translate" button; any member can click it to get an ephemeral Arabic translation of that embed (free, no API key — uses Google Translate's public web endpoint)

## 🎨 Dashboard redesign + real login (latest pass)

The dashboard was rebuilt from scratch on a premium purple/dark-gray/black glass design system (`dashboard/public/style.css`), with a real Discord OAuth2 login system replacing the old "no login, public URL" design:

- **Login**: `/auth/login` → Discord's consent screen → `/auth/callback` exchanges the code and pulls the user's identity + guild list. Sessions are cookie-based (`express-session`), 7-day expiry.
- **Access control**: a regular user only sees and can edit servers where they have **Manage Server** permission (checked against Discord's live permissions bitfield, not cached). Anyone in `OWNER_IDS` bypasses this and additionally gets `/admin` — a global overview across every server the bot is in.
- **New real data, not fake numbers**: "Commands Executed" and "Bot Latency/Uptime/Memory" on `/admin` are backed by two new small pieces of instrumentation — `utils/commandStats.js` (a lightweight, fire-and-forget counter hooked into `interactionCreate.js`) and `utils/botStatusFile.js` (a heartbeat file the bot writes every 30s that the separate dashboard process reads). Host CPU/RAM figures come from Node's `os` module — real values for the machine it's running on.
- **Every page gets a section**, per the redesign brief — but for features that don't actually exist in the bot's commands yet (Economy, Levels, Suggestions, Music queue UI, Premium, a visual Embed builder, per-command toggles), the dashboard shows a clearly labeled "not built into the bot yet" empty state instead of decorative fake data. The `Economy` model already exists in `models/Economy.js` for whenever that command gets built.
- **Required new env vars**: `CLIENT_SECRET`, `SESSION_SECRET`, `DISCORD_CALLBACK_URL` — see the Setup section below. You'll also need to register the callback URL in the Discord Developer Portal.

## 🗄️ MongoDB, split settings pages, real icons, profile home page (latest pass)

- **Storage moved from local JSON files to real MongoDB.** `utils/jsondb.js` (kept under its old filename so none of the 50+ files that `require()` it needed to change) now talks to a MongoDB database via the official native driver instead of writing to `data/db/*.json`. It intentionally does **not** use Mongoose — every model in this project mutates a fetched object and calls `.save()` (e.g. `cfg.welcome.enabled = true; await cfg.save()`), which is exactly the old engine's contract; replicating that directly on top of the native driver avoids Mongoose's `markModified()` footgun on loosely-typed nested documents, which would otherwise risk silently dropping writes. Both the bot (`index.js`) and the dashboard (`dashboard/server.js`) connect on startup and fail loudly if `MONGODB_URI` is missing or unreachable, rather than failing mysteriously on the first command. **I could not test the live connection to your Atlas cluster from this environment** (its network is locked to a small allowlist that doesn't include `mongodb.net`) — the code follows the documented MongoDB Node.js driver API exactly, but please verify it connects once you deploy it or run it somewhere with normal internet access.
- ⚠️ **About the connection string you shared in chat**: it contained your MongoDB username and password in plain text. I put a placeholder in `.env.example` and did not write your real credentials into any file in this project — but since that password was typed into this conversation, treat it as potentially exposed and consider rotating it from the Atlas dashboard (Database Access → your user → Edit password), then put the new one only in your local `.env` / your host's environment variables, never in a committed file.
- **Every settings section is now its own real page** (`/dashboard/:guildId/overview`, `/tickets`, `/security`, etc.) instead of one long scrollable page — see `dashboard/views/sections/*.ejs` for each page's content and `dashboard/views/guild-section.ejs` for the shared shell. The sidebar links to real URLs now, not in-page anchors.
- **Emoji replaced with real icons** (Font Awesome, loaded from a CDN) across every page — sidebars, KPI cards, buttons, badges, empty states, toasts.
- **The home page is now your profile**, not a plain server grid: your Discord avatar, banner, and real badges (decoded from Discord's `public_flags`, e.g. Early Supporter, Active Developer, HypeSquad house), a working **credits + 24h daily-reward** system (`models/Wallet.js` — claims are enforced server-side against a real timestamp, not just hidden by the UI), and a **real activity timeline** built from your actual mod actions, tickets, and applications across every server you manage (`utils/actionHistory.js`) — not placeholder data. Your server list moved to a sidebar next to it.

## 🐛 /status and /serverinfo were silently doing nothing — fixed

Both commands called `guild.members.fetch()` (and `/status` also called an external Minecraft-status API) **before** ever replying to the interaction. Discord invalidates a slash command interaction if it isn't acknowledged within 3 seconds — on anything but a tiny server, that fetch alone took longer than that, so the command silently failed with no visible error. Fixed by:
- Calling `interaction.deferReply()` immediately, before any slow work, then `editReply()` once done (the standard fix for this exact class of bug).
- Dropping the full `guild.members.fetch()` call entirely — it wasn't needed. With the `GuildPresences` intent now enabled (see below), online/offline counts read straight from the live presence cache instead.
- **Also fixed a second bug in the same commands**: the `GuildPresences` gateway intent was never enabled, so `member.presence` was always `undefined` and online counts were always wrong (would show as 0) even on the rare occasion the command didn't time out. It's now enabled in `index.js`.

**Action needed on your end:** like Server Members Intent, **Presence Intent** is a privileged intent — go to your bot's page on the [Discord Developer Portal](https://discord.com/developers/applications) → **Bot** → enable **Presence Intent** (alongside Server Members Intent and Message Content Intent), or `/status` and `/serverinfo` will error on startup.

I also swept every other command for the same "slow work before replying" pattern (checked everything doing member fetches, external API calls, or audit log lookups) — `/serverinfo` had the identical bug and got the same fix; everything else (`/purge`, `/play`, `/broadcast`, etc.) was already deferring correctly.

Separately, several utility commands (`ping`, `avatar`, `userinfo`, `help`, and others) were missing their `category` field, so `/help` dumped them all into "Misc" instead of grouping them under Utility — fixed.

## 🩹 Ticket system fixes (latest pass)

A few real bugs from the ticket system were found and fixed:
- `discord_category` in `/ticket-panel add-category` now only accepts an actual Discord **Category** channel (previously accepted any channel type, which crashed ticket creation if someone picked a text channel).
- Ticket creation now validates the target category still exists and is still a category at creation time, and falls back to no-parent instead of crashing if it was deleted/changed since.
- Ticket channel creation is wrapped in error handling with a clear message instead of a silent failure.
- **Transcript loss bug**: if no transcript/log channel was configured (or delivery to it failed), the generated transcript used to just vanish. It's now also attached directly in the ticket channel and DMed to whoever opened the ticket, so it's never silently lost.
- Deleting a ticket that's somehow still "open" (bypassing the normal close flow) now generates a transcript first instead of destroying the conversation with none.
- Claiming an already-closed ticket is now blocked with a clear message instead of silently succeeding.
- Added a 5-open-tickets-per-user cap to prevent ticket spam.
- Added `/ticket-panel list`, `remove-category`, and `delete` subcommands — previously there was no way to see or clean up panels after creating them.

## ⚠️ Documented gaps / where to extend next

Being upfront about scope so nothing here surprises you in production:

- **Dashboard ticket/giveaway/embed-builder management UI**: ticket, giveaway, and application activity now show as real read-only tables on the guild settings page. Full *editing* UI (creating ticket panels, giveaways, or embeds from the dashboard rather than Discord slash commands) isn't built — the pattern for adding a new form is already established in `dashboard/routes/api.js` if you want to add it.
- **Dashboard live stats** (bot latency/uptime/memory): now solved via `utils/botStatusFile.js`, a small heartbeat file the bot writes every 30s and the dashboard reads — no need to share a live `discord.js` Client between the two processes.
- **Storage is real MongoDB now** (`utils/jsondb.js`, using the native `mongodb` driver — see the changelog above). Both the bot and dashboard connect to the same `MONGODB_URI`, so unlike the old local-JSON setup, they no longer need to run on the same machine/container — the dashboard could be deployed separately from the bot now, as long as both reach the same database. The two small heartbeat files (`data/db/bot-guilds.json`, `data/db/bot-status.json`) are the one exception — they're cheap cross-process signaling files the bot writes and the dashboard reads, unrelated to the main data store, and still require the two processes to share a filesystem (which `npm start` already guarantees).
- **Sessions use the default in-memory store** (`express-session`'s default `MemoryStore`) — fine for a single dashboard process, but sessions won't survive a process restart/redeploy (everyone gets logged out) and won't work if you ever run multiple dashboard instances behind a load balancer. If that matters, swap in a MongoDB-backed session store (e.g. `connect-mongo`, pointed at the same `MONGODB_URI`) — a handful of lines in `dashboard/server.js`.
- **Captcha verification** stores pending codes in memory (`Map`), which resets on bot restart and won't work across multiple bot processes/shards. For serious scale, move this to Redis or MongoDB with a TTL index.
- **Anti-nuke** currently quarantines (strips roles) rather than bans, by design — safer default to avoid false-positive bans. Adjust `utils/antiNuke.js` if you want a harsher response.
- **Music** uses `@distube/ytdl-core` under the hood; YouTube changes its player logic periodically and this dependency needs to stay updated (`npm update @distube/ytdl-core`) — this affects every YouTube-based Discord bot, not just this one.
- **Welcome banners** (image generation) aren't implemented — `cfg.welcome.bannerEnabled` exists as a config flag for you to wire up later. (`canvas` isn't a dependency anymore — it was unused, and its native build was breaking `npm install` on hosts like Railway. Add it back yourself, e.g. `npm install canvas`, only when you actually build this feature.)
- **Economy, Levels, Suggestions, Music queue UI, Premium**: none of these have real server-level commands/logic in the bot yet (the `Economy` model in `models/Economy.js` is unused scaffolding for a future per-server economy). The dashboard's own credits/daily-reward system (`models/Wallet.js`, shown on your profile home page) is separate and real, but it's dashboard-only — it doesn't affect anything in Discord. The dashboard shows honest "coming soon" states for the server-level features rather than fabricated data — build the bot-side feature first, then wire up its dashboard page the same way tickets/warnings/giveaways are done today.

## 📁 Project Structure

```
minecore-manager/
├── commands/           # Slash commands, organized by feature
│   ├── admin/
│   ├── applications/
│   ├── config/
│   ├── embed/
│   ├── giveaway/
│   ├── messages/
│   ├── music/
│   ├── roles/
│   ├── status/
│   ├── tickets/
│   ├── utility/
│   └── voice/
├── events/              # discord.js event listeners
├── handlers/            # command/event/component loaders + deploy script
│   └── components/      # buttons/, selectMenus/, modals/
├── models/              # Thin MongoDB-backed models (mongoose-shaped API, native driver underneath — not actually Mongoose, see MongoDB section above)
├── utils/               # Shared logic (embeds, permissions, logging, security, music, etc.)
├── config/              # Static bot config (config.js) — reads from .env
├── dashboard/           # Express + EJS web dashboard (Vaylex purple/black/glass theme, Discord OAuth2 login)
│   ├── middleware/       # Discord OAuth2 session/access-control guards (auth.js)
│   ├── routes/           # auth.js (login), dashboard.js (home/profile + per-server sections), admin.js, api.js (settings form POSTs)
│   ├── views/
│   │   ├── sections/      # One file per settings tab (tickets.ejs, security.ejs, welcome.ejs, ...) — real separate pages, not anchors
│   │   └── partials/
│   └── public/
├── data/
│   ├── db/               # Just two small heartbeat files (bot-guilds.json, bot-status.json) the bot writes for the dashboard to read — NOT the database anymore, see MongoDB section above
│   └── transcripts/      # Local scratch space (transcripts are normally posted to Discord, not stored here)
├── index.js             # Bot entry point
├── package.json
└── .env.example
```

## 🚀 Setup

### 1. Prerequisites
- Node.js 18.17+
- A Discord Application: https://discord.com/developers/applications
- A MongoDB database — a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster works fine. You'll need its connection string (`mongodb+srv://...`).

### 2. Discord Application setup
1. Create an application, then a Bot user. Copy the **bot token**.
2. Under **OAuth2 → General**, copy the **Client ID** and **Client Secret** — the dashboard needs both for Discord login.
3. Still under **OAuth2 → General**, add a **Redirect URL** matching `DISCORD_CALLBACK_URL` below (e.g. `http://localhost:3000/auth/callback` locally, or `https://your-app.up.railway.app/auth/callback` in production).
4. Under **Bot → Privileged Gateway Intents**, enable **Server Members Intent**, **Presence Intent**, and **Message Content Intent**.
5. Invite the bot with the `bot` and `applications.commands` scopes and Administrator (or a tailored permission set) — the `/invite` command generates this link for you once running.

### 3. Install
```bash
git clone <your-repo-or-unzip-this>
cd minecore-manager
npm install
cp .env.example .env
```

Fill in `.env`:
```
DISCORD_TOKEN=...
CLIENT_ID=...
CLIENT_SECRET=...         # from the same Discord Developer Portal app — required for dashboard login
GUILD_ID=...              # your dev server, for instant command deploys

MONGODB_URI=mongodb+srv://user:password@your-cluster.mongodb.net/?appName=Cluster0
MONGODB_DB_NAME=vaylex    # optional, defaults to "vaylex" if omitted

DASHBOARD_PORT=3000       # most hosts (Railway, Render) inject PORT and override this automatically
DASHBOARD_URL=http://localhost:3000   # on Railway, set this to your public URL, e.g. https://your-app.up.railway.app
DISCORD_CALLBACK_URL=http://localhost:3000/auth/callback   # must exactly match an OAuth2 redirect registered in the Discord Developer Portal
SESSION_SECRET=...        # any long random string — used to sign login session cookies
OWNER_IDS=your_discord_user_id
```

**One extra one-time step for login to work:** in the [Discord Developer Portal](https://discord.com/developers/applications), open your app → **OAuth2** → add a redirect URL that exactly matches `DISCORD_CALLBACK_URL` above (e.g. `https://vaylex.up.railway.app/auth/callback` in production). Without this, Discord will refuse the login redirect.

### 4. Deploy slash commands
```bash
npm run deploy
```
With `GUILD_ID` set, commands appear instantly in that server. Remove `GUILD_ID` (or deploy without it) for a global rollout — global commands take up to ~1 hour to propagate.

### 5. Run everything — bot + dashboard, one command
```bash
npm start
```
This runs the Discord bot and the web dashboard together (via `concurrently`), with each process's logs labeled `BOT` / `DASHBOARD` in the same terminal. Visit `http://localhost:3000` and click **Log in with Discord**.

Prefer them separate (e.g. for debugging one at a time)? `npm run bot` and `npm run dashboard` each run just one. For local development, `npm run dev` also runs both together (via `concurrently`), but with `nodemon` under each one so they auto-restart on file changes.

### 6. Hosting publicly

**Important — read this before deploying anywhere:** the bot and the dashboard both read/write the same MongoDB database (`MONGODB_URI`), so they no longer need to be on the same machine the way the old local-JSON version did. The one exception is two small heartbeat files under `data/db/` (server list + bot latency/uptime) that the bot writes directly to disk for the dashboard to read — those still need a shared filesystem, which `npm start` already guarantees since it runs both processes together. If you ever split the dashboard onto a different host than the bot, you'd need to replace those two files with something networked too (e.g. writing that same heartbeat data into MongoDB instead of disk).

On a host like Railway/Render, set the service's start command to:
```
npm start
```
That's it — one service, one deployment, both processes running together under that single command.

**Railway-specific notes** (e.g. deploying to `https://vaylex.up.railway.app`):
- Railway auto-detects Node projects and runs `npm install` then `npm start` — no extra config needed, as long as the start command in the service settings is `npm start` (or left as default).
- Railway injects its own `PORT` env var; `dashboard/server.js` already reads `process.env.PORT` first, so the dashboard binds correctly without you setting `DASHBOARD_PORT`.
- Set these variables in the Railway service's **Variables** tab: `DISCORD_TOKEN`, `CLIENT_ID`, `CLIENT_SECRET`, `SESSION_SECRET`, `OWNER_IDS`, `MONGODB_URI`, `DASHBOARD_URL=https://vaylex.up.railway.app`, and `DISCORD_CALLBACK_URL=https://vaylex.up.railway.app/auth/callback`. Don't set `GUILD_ID` in production unless you want commands scoped to one server.
- In MongoDB Atlas, under **Network Access**, add `0.0.0.0/0` (allow from anywhere) or Railway's specific egress IPs — Atlas blocks all connections by default until you allowlist something.
- In the Discord Developer Portal, add `https://vaylex.up.railway.app/auth/callback` as an OAuth2 redirect URL — login will fail with a Discord-side error until this matches `DISCORD_CALLBACK_URL` exactly.
- Do **not** set `NODE_ENV=production` unless you also switch `npm run dev`'s dev-only dependency (`nodemon`) to a regular dependency — `npm start` itself doesn't need it, so this only matters if you're not using `npm start` as the Railway start command.

Regular users only see and can manage servers where they personally have Manage Server permission — verified live against Discord on login, not cached. Add your own Discord user ID to `OWNER_IDS` to get the global `/admin` overview and access to every server.

## 🔧 First-run configuration checklist

Once the bot is in your server:
1. `/config set-log type:modlog channel:#mod-logs` (repeat for `securitylog`, `ticketlog`, etc.)
2. `/ticket-panel create channel:#support title:"Need Help?" description:"Select a category below."`
3. `/ticket-panel add-category panel_id:<id> label:"General Support" discord_category:#tickets-category`
4. `/ticket-setup support-role role:@Support`
5. `/autorole add role:@Member`
6. `/verification-setup channel:#verify verified_role:@Verified type:button`
7. `/config welcome channel:#welcome message:"Welcome {mention} to {server}! You're member #{memberCount}."`
8. `/config security module:antiRaid enabled:true` (repeat per module, or use the dashboard toggle grid instead)

## 🛡️ Security notes

- The bot never stores your Discord token, client secret, session secret, or MongoDB connection string in code — all come from `.env`, which is gitignored. Never commit a real `MONGODB_URI` (it contains your database password) — only `.env.example` with a placeholder should be committed.
- Dashboard access now requires logging in with Discord, and a regular user can only view/edit servers where they have Manage Server permission (checked live against Discord on login, not a cached role). Server owners/staff in `OWNER_IDS` get global access via `/admin`.
- Session cookies are signed with `SESSION_SECRET` and marked `httpOnly`; set `secure: true` (already automatic when `NODE_ENV=production`) so they're only sent over HTTPS in production.
- Sessions are stored in-memory in the dashboard process — restarting/redeploying it logs everyone out, which is expected, not a bug.
- All moderation commands respect Discord role hierarchy (`utils/permissions.js`) — staff can't action users with an equal/higher role than themselves or the bot.

## 📦 Key dependencies
`discord.js`, `@discordjs/voice`, `distube`, `express`, `express-session` (dashboard login sessions), `mongodb` (native driver — the actual database layer, see the MongoDB changelog section above), `discord-html-transcripts`, `ms`, `concurrently` (runs bot + dashboard together under both `npm start` and `npm run dev`), `axios` (also used for the Discord OAuth2 token exchange). Charts use Chart.js and icons use Font Awesome, both loaded from a CDN client-side (no npm packages needed). Dashboard auth is a small hand-rolled Discord OAuth2 flow (no `passport` dependency) in `dashboard/routes/auth.js`.
