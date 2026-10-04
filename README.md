<div align="center">
  <!--
    TODO (after pushing the public repo):
    For guaranteed rendering on npmjs / documentation hubs that don't resolve relative raw GitHub paths,
    swap the relative image line below for the absolute raw CDN URL with your real owner/repo:

      <img src="https://raw.githubusercontent.com/<YOU>/<REPO>/main/client/public/favicon.svg" alt="Watchly logo" width="118" />

    For now the relative src works inside GitHub repo previews once pushed.
  -->
  <p>
    <a href="#-watchly--watch-together-feel-it-together">
      <img src="client/public/favicon.svg" alt="Watchly logo" width="118" />
    </a>
  </p>

  <h1><a href="#-watchly--watch-together-feel-it-together" style="text-decoration:none;color:inherit;">WATCHLY</a></h1>

  <!--
    Fallback: if the typing SVG below ever returns empty due to endpoint rate limits,
    simply replace the entire <p>...</p> block with a plain text <p>.
    The static North Star tagline below will always keep the hero legible.
  -->
  <p>
    <img
      src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=500&size=20&duration=2600&pause=1200&color=DB2777&center=true&vCenter=true&width=640&lines=Watch+together.+Feel+it+together.;Realtime+synchronized+watch+parties+for+your+crew.;Moments%2C+friends%2C+groups+%E2%80%94+%240+to+run."
      alt="Animated tagline"
      width="640"
    />
  </p>

  <blockquote style="max-width:640px;border-left:3px solid #db2777;margin:16px auto 22px;padding:6px 18px;font-style:italic;opacity:0.92;">
    Don't just help people watch the same video. Help them feel like they watched it together.
  </blockquote>

  <p>
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-100%25-3178C6?style=for-the-badge&logo=typescript&logoColor=FFF&labelColor=0A0B0D" />
    <img alt="Socket.IO" src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=FFF&labelColor=0A0B0D" />
    <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFF&labelColor=0A0B0D" />
    <img alt="Express" src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=FFF&labelColor=0A0B0D" />
    <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=FFF&labelColor=0A0B0D" />
    <img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge&labelColor=0A0B0D" />
  </p>

  <p>
    <img alt="Vercel Deployed" src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=FFF&labelColor=0A0B0D" />
    <img alt="Render" src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=000&labelColor=0A0B0D" />
    <img alt="Aiven" src="https://img.shields.io/badge/Aiven-FFA500?style=for-the-badge&labelColor=0A0B0D" />
    <img alt="License MIT" src="https://img.shields.io/badge/license-MIT-FB7185?style=for-the-badge&labelColor=0A0B0D" />
    <img alt="Node 20+" src="https://img.shields.io/badge/Node-%E2%89%A520-22C55E?style=for-the-badge&logo=nodedotjs&logoColor=FFF&labelColor=0A0B0D" />
  </p>
</div>

---

## 🧭 Jump to

<p>
  <a href="#-why-watchly"><img alt="Why" src="https://img.shields.io/badge/⭐-Why_Watchly-111827?style=flat-square&labelColor=0A0B0D" /></a>
  <a href="#-quick-start"><img alt="Quick Start" src="https://img.shields.io/badge/%F0%9F%9A%80-Quick_Start-111827?style=flat-square&labelColor=0A0B0D" /></a>
  <a href="#%EF%B8%8F-tech-stack"><img alt="Tech Stack" src="https://img.shields.io/badge/%E2%9A%99%EF%B8%8F-Tech_Stack-111827?style=flat-square&labelColor=0A0B0D" /></a>
  <a href="#-feature-showcase"><img alt="Features" src="https://img.shields.io/badge/%F0%9F%92%A0-Features-111827?style=flat-square&labelColor=0A0B0D" /></a>
  <a href="#-architecture-the-portfolio-bit"><img alt="Architecture" src="https://img.shields.io/badge/%F0%9F%A7%AE-Architecture-111827?style=flat-square&labelColor=0A0B0D" /></a>
  <a href="#%EF%B8%8F-screenshots"><img alt="Screenshots" src="https://img.shields.io/badge/%F0%9F%96%BC%EF%B8%8F-Screenshots-111827?style=flat-square&labelColor=0A0B0D" /></a>
  <a href="#-deep-dives-collapse"><img alt="Deep Dives" src="https://img.shields.io/badge/%F0%9F%93%9A-Deep_Dives-111827?style=flat-square&labelColor=0A0B0D" /></a>
  <a href="#-contributing"><img alt="Contributing" src="https://img.shields.io/badge/%F0%9F%A4%9D-Contributing-111827?style=flat-square&labelColor=0A0B0D" /></a>
  <a href="#-deployment-guide"><img alt="Deploy" src="https://img.shields.io/badge/%F0%9F%9A%80-Deploy-111827?style=flat-square&labelColor=0A0B0D" /></a>
  <a href="#-license"><img alt="License" src="https://img.shields.io/badge/%F0%9F%93%84-License-111827?style=flat-square&labelColor=0A0B0D" /></a>
</p>

---

## ⭐ Why Watchly

| &nbsp; | Problem Watchly solves |
|---|---|
| 🔴 | Desktop sync tools (Syncplay, older co-watch apps) require **every viewer to install software, be on the same OS, and own a copy of the video** — nobody wants that for a casual invite. |
| 📱 | Built-in social watch-togethers (Discord Watch, Telegram Parties) only work inside **a closed provider silo and a narrow list of blessed sources**. Bring your own YouTube? Nah. Bring your own Google Drive rip? Nah. |
| 📮 | None of them ship **timestamped Moments (intensity-timeline reactions)**, **spoiler-safe chat**, and **persistent Friend / Group watchlists** as first-class citizens — the *social memory* of the night, not just the video sync. |
| 🎯 | Most are built as "live-video CDN" products for thousands of viewers. Watchly is engineered for **2–10 people per room** — the actual size of a friend group — so it stays inside **$0 of free-tier infra forever** (Vercel Hobby + Render Free + Aiven Free PG). |

Full engineering rules, scope and philosophy are in [`AGENTS.md`](AGENTS.md).

---

## 🚀 Quick Start

**Four commands and you're watching together.** (60 seconds on a warm machine.)

```bash
# 1. Clone
git clone https://github.com/<YOU>/<REPO>.git watchly && cd watchly

# 2. Install all three workspaces (shared / server / client) in one go.
npm install

# 3. Wire up local env vars from the checked-in templates.
#    You'll need a Google OAuth Client ID, and (optionally) a Brevo / Aiven / Cloudinary key.
#    Without the DB configured the app still runs basic rooms in degraded mode.
cp server/.env.example server/.env
cp client/.env.example client/.env

# 4. Run everything. Vite HMR + tsx watch-mode for the server.
npm run dev
```

| Service | Local URL |
|---|---|
| **Frontend** (Vite) | http://localhost:5173 |
| **Backend API** (Express + Socket.IO) | http://localhost:3001 |
| **Health check** | `GET http://localhost:3001/api/health` → JSON `{ status: "healthy" }` |

Room flow:
1. Homepage → **Create room** → enter a display name → drop any YouTube / direct / Google-Drive URL.
2. Share the invite link. Second browser → paste link → enter name → join.
3. Host presses Play. Everybody's playback locks. React, chat, scrub, make Moments.

> **Prerequisites:** Node.js **≥ 20** (matches `.nvmrc`), npm ≥ 10, and a PostgreSQL instance if you want friends / groups / chat persistence (Aiven Free is easiest). **Postgres is optional for basic watch-party rooms.**

---

## ⚙️ Tech Stack

Grouped by layer. Icons via [Devicon](https://devicon.dev/) and [Shields.io](https://shields.io/).

<table>
  <tbody>
    <tr>
      <th width="18%">&nbsp;</th>
      <th width="32%"></th>
      <th></th>
    </tr>

    <!-- FRONTEND -->
    <tr>
      <td rowspan="6" valign="top"><b>🖥 Frontend</b></td>
      <td valign="top"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" width="22" /> &nbsp; React 18</td>
      <td>Component model, hooks, Suspense fallbacks, lazy route loading.</td>
    </tr>
    <tr>
      <td><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" width="22" /> &nbsp; TypeScript 5.x</td>
      <td>Strict mode end-to-end. Shared types in <code>shared/</code> guarantee client/server API contracts never drift.</td>
    </tr>
    <tr>
      <td><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vitejs/vitejs-original.svg" width="22" /> &nbsp; Vite 7</td>
      <td>Bundler. Builds 15s cold, HMR <200ms hot. SSR not used; pure SPA output at <code>client/dist/</code>.</td>
    </tr>
    <tr>
      <td><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg" width="22" /> &nbsp; HTML5 / CSS3</td>
      <td>Hand-authored design system (no Tailwind). Magenta <code>#db2777</code> brand, 16:9 aspect-locked video, motion-tween animations.</td>
    </tr>
    <tr>
      <td><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/socketio/socketio-original.svg" width="22" /> &nbsp; socket.io-client 4</td>
      <td>Event channels: <code>room:*</code>, <code>chat:*</code>, <code>reactions:*</code>, <code>presence</code>. Auto-reconnect + fallbacks.</td>
    </tr>
    <tr>
      <td><img alt="lucide" src="https://img.shields.io/badge/Lucide_Icons-16a34a?style=flat-square" /></td>
      <td>Consistent icon family across every page.</td>
    </tr>

    <!-- BACKEND -->
    <tr><td colspan="3" height="6"></td></tr>
    <tr>
      <td rowspan="5" valign="top"><b>🛠 Backend</b></td>
      <td><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg" width="22" /> &nbsp; Node.js 20+</td>
      <td>Runtime. <code>0.0.0.0:$PORT</code> binding for Render. Event-loop friendly; no per-frame CPU work.</td>
    </tr>
    <tr>
      <td><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg" width="22" /> &nbsp; Express 4</td>
      <td>HTTP router. Helmet + CORS locked to <code>CLIENT_URL</code>. JSON body caps, cookie-based sessions, CSRF + auth guards.</td>
    </tr>
    <tr>
      <td><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/socketio/socketio-original.svg" width="22" /> &nbsp; Socket.IO 4</td>
      <td>Authoritative realtime. Rooms. Per-room state machines (see <a href="#-architecture-the-portfolio-bit">Architecture</a>).</td>
    </tr>
    <tr>
      <td><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg" width="22" /> &nbsp; node-postgres (pg)</td>
      <td>Pool capped at 5 conservative connections — well inside Aiven Free's 20-connection cap.</td>
    </tr>
    <tr>
      <td><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/zod/zod-original.svg" width="22" /> &nbsp; Zod</td>
      <td>Schema-validates every inbound API payload and DB row. No runtime shape drift.</td>
    </tr>

    <!-- DATA + AUTH -->
    <tr><td colspan="3" height="6"></td></tr>
    <tr>
      <td rowspan="3" valign="top"><b>🛢 Data &amp; Auth</b></td>
      <td><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg" width="22" /> &nbsp; PostgreSQL 16 (Aiven Free)</td>
      <td>Migrations-driven schema at <code>server/db/migrations/*.sql</code>. Friends, groups, watchlists, chat messages, Moments, queues.</td>
    </tr>
    <tr>
      <td><img alt="google-cloud" src="https://img.shields.io/badge/Google_OAuth_ID_token-4285F4?logo=google&logoColor=white&style=flat-square" /></td>
      <td>Id_token-only Google One Tap / sign-in. No refresh tokens on the OAuth provider side. Matches <code>VITE_GOOGLE_CLIENT_ID</code> on both ends.</td>
    </tr>
    <tr>
      <td><img alt="JWT" src="https://img.shields.io/badge/JWT-sessions-FB7185?style=flat-square" /></td>
      <td>HTTP-only, SameSite=Lax session cookies. JWT_SECRET is <em>required in production</em> — server refuses to boot without one.</td>
    </tr>

    <!-- DEPLOY + INFRA -->
    <tr><td colspan="3" height="6"></td></tr>
    <tr>
      <td rowspan="3" valign="top"><b>☁️ Deploy &amp; Infra</b></td>
      <td><img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=FFF" /> &nbsp; Vercel Hobby</td>
      <td>Frontend host (default). 100 GB bandwidth / 6000 build-min / 1M edge req on Hobby. Zero-config SPA.</td>
    </tr>
    <tr>
      <td><img src="https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=000" /> &nbsp; Render Free Web</td>
      <td>Backend host. 750 instance-h/mo. 15-min idle spin-down, ~60-s spin-up. External monitor keeps it warm.</td>
    </tr>
    <tr>
      <td><img src="https://img.shields.io/badge/Aiven_PostgreSQL_Free-FFA500?style=flat-square" /> &nbsp; Aiven Free PG</td>
      <td>1 GB storage / 1 GB RAM / 20 connections / automated backups. Perpetual free tier, 30-day expiry nonsense.</td>
    </tr>

    <!-- MEDIA + COMMS -->
    <tr><td colspan="3" height="6"></td></tr>
    <tr>
      <td rowspan="3" valign="top"><b>🖼 Media &amp; Comms</b></td>
      <td><img alt="cloudinary" src="https://img.shields.io/badge/Cloudinary-3448C5?logo=cloudinary&logoColor=white&style=flat-square" /></td>
      <td>Avatar + group picture uploads (unsigned preset). 25 GB storage + 25 GB bandwidth free.</td>
    </tr>
    <tr>
      <td><img alt="brevo" src="https://img.shields.io/badge/Brevo_Transactional_Email-0079FF?style=flat-square" /></td>
      <td>Magic-link authentication emails (~300/day free). <b>HTTPS REST API transport — not SMTP</b>, so Render's SMTP-port block never touches it.</td>
    </tr>
    <tr>
      <td><img alt="betterstack" src="https://img.shields.io/badge/BetterStack_Uptime_Free-0080FF?style=flat-square" /></td>
      <td>3-min external monitor (10 free) + free branded status page with custom domain — keeps Render warm 24/7.</td>
    </tr>

    <!-- MONOREPO + TOOLING -->
    <tr><td colspan="3" height="6"></td></tr>
    <tr>
      <td rowspan="4" valign="top"><b>📦 Monorepo &amp; Tooling</b></td>
      <td><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/npm/npm-original-wordmark.svg" width="22" /> &nbsp; npm 10 workspaces</td>
      <td>Three workspace packages: <code>shared/</code>, <code>server/</code>, <code>client/</code>. No Turbo/Lerna/Nx — no extra build tooling.</td>
    </tr>
    <tr>
      <td><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/eslint/eslint-original.svg" width="22" /> &nbsp; oxlint (client) / tsc (full)</td>
      <td>Lint + strict typecheck on every workspace.</td>
    </tr>
    <tr>
      <td><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vitest/vitest-original.svg" width="22" /> &nbsp; Vitest</td>
      <td>Server unit tests for <code>roomState</code> and validators.</td>
    </tr>
    <tr>
      <td><img alt="dotenv" src="https://img.shields.io/badge/.env_templates-7E22CE?style=flat-square" /></td>
      <td><code>server/.env.example</code> and <code>client/.env.example</code> check in every key. No secrets tracked.</td>
    </tr>
  </tbody>
</table>

---

## 💠 Feature Showcase

| | |
|---|---|
| **⏯️ Host-grade playback sync**<br />Play, pause, and seek stay pixel-accurate across the whole room. Host-only permissions by default; participants keep a visual click-block overlay so accidental local seeks never desync. | **🛠 Provider abstraction**<br />`VideoProvider` → `YouTubeProvider`, `GoogleDriveProvider`, `DirectVideoProvider`. Room/sync logic is 100% provider-agnostic. Add a new source (Vimeo, Twitch archive, whatever) without touching the state machine. |
| **⚡ Authoritative room state**<br />The server owns truth. Not client-elected. Not event-log replay. Every late-join or reconnect gets the *current* authoritative state in one message. | **👥 Presence & connect quality**<br />Join/leave toasts, "X is typing…", connection-quality indicators, reconnecting-spinner overlays, participant list. Nobody feels like they're watching alone. |
| **💬 Spoiler-safe chat**<br />Messages can tag a video timestamp. Messages from *the future of where the viewer currently is* lock behind a blur + spoiler click-through. No more Netflix party screen-grab panic. | **💖 Per-timestamp reactions**<br />Every 💖 😂 😱 🔥 drop gets recorded against the exact playback timestamp it was reacted to. |
| **🔥 Moments timeline**<br />The project's signature feature. A density heatmap under the scrubber shows where the room lost its mind. Click any peak → jump instantly + see WHO reacted with WHAT. Captures the "OHMYGOD DID YOU SEE THAT?" memory of the night. | **🧑‍🤝‍🧑 Friends + 1:1 shared watchlists**<br />Friend requests, accept/reject, mutual friendship. Each friendship ships a shared "movies these two people want to watch together" watchlist, with "who added this" attribution + a "Watch again → start room" action. |
| **👥 Groups (separate, not big friend lists)**<br />Name, banner picture, owner/admin, invitations, voting per watchlist item, watched history, group-level shared watchlist. Start a Watch Party from any item with one click. | **🔐 Auth (social features only)**<br />Basic rooms work with no account — enter a display name and go. Friends/Groups/profiles need a Google OAuth sign-in or magic-link email. JWT_SECRET is required in production. |
| **🎞 Party Replay**<br />After a session ends, a lightweight memory card: duration, participants who showed up, reaction count, chat message count, top 5 memorable moments thumbnail row. Not an analytics dashboard — a keepsake. | **🎨 Product-grade UI/UX**<br />16:9 aspect-locked video player, balanced desktop side gutters (no edge-to-edge chaos), magenta `#db2777` brand tokens, staggered-slide-up motion animations, responsive all the way down to iPhone SE. |

---

## 🧠 Architecture — the portfolio bit

This is the section hiring managers care about. Watchly is not "Socket.IO broadcast every video frame" — that melts on free tiers and drifts by 2–10 seconds within a minute. Instead it follows four simple rules.

### Four core architectural principles

1. **Separate authoritative state from transient events.** The server keeps one `RoomState` per room in memory. Events (play, pause, seek, reaction, chat) mutate it. Chat and Moments persist to Postgres. Presence, playback ticks, and drift corrections do NOT — they're pure realtime.
2. **Timestamp-based sync, not per-frame ticks.** A "play" command carries a wall-clock server timestamp; each client projects its local playback forward from that timestamp instead of re-broadcasting 60 ticks per second. This means a room of 10 people uses **roughly the same bandwidth as a room of 2 people**.
3. **Sensible drift correction, not constant seeking.** If a client is within ~150 ms of where it should be, we do nothing. Only big (> ~500 ms) deltas trigger a real seek, otherwise a small `playbackRate` nudge. Viewers never see micro-stuttery "why does it keep jumping?" artifacts.
4. **Clients recover from current state, not history.** Late joiners get the entire `RoomState` in one `room_state` event (current position, video loaded, participants, presence, most recent N chats, reactions density). We never replay a backlog of events at them. That's how you get broken drift on a spotty hotel Wi‑Fi.

### Mermaid sequence diagram — host presses play

```mermaid
sequenceDiagram
    participant Host as 👤 Host Browser
    participant Server as 🟪 Watchly Server<br/>(Express + Socket.IO)
    participant State as RoomState (in-memory)
    participant P1 as 👥 Participant A
    participant P2 as 👥 Participant B (late join)

    Host->>Server: play  { clientEstimatedTs: 1728001000 }
    Server->>State: applyCommand(PLAY, server_ts: 1728001000120)
    Note over State: positionAt(now) is authoritative
    State-->>Server: new state { status: playing, ts: 1728001000120, videoId }
    Server-->>P1: room_state { ts, status, position }
    Server-->>Host: room_state { ts, status, position }

    Note over Host,P1: Each browser projects playback forward locally.<br/>Minor drift → playbackRate nudge. Major drift → 1 seek.

    P2->>Server: join(roomId)
    Server->>State: snapshot()
    State-->>Server: FULL authoritative state (not event log)
    Server-->>P2: room_state { ts, position, video, members, recentChat, reactionDensity }
    Note over P2: Late-join syncs instantly — zero catch-up replay.
```

What this buys you: **the app stays inside Aiven's 20 connections, Render's 512 MB RAM, and Socket.IO's tiny event budget** comfortably for 2–10 person friend rooms. Exactly the intended usage per AGENTS.md.

---

## 🖼️ Screenshots

> **TODO: After your first deploy, replace these three placeholders with real PNGs (1920 × 1080 each works great for GitHub previews).** Drop them directly into [`docs/screenshots/`](docs/screenshots) as `room.png`, `moments-chat.png`, and `friends-groups.png` — the `<img src>` links below will resolve automatically.

<table>
  <thead>
    <tr>
      <th width="33%">🎥 Room &amp; 16:9 player</th>
      <th width="33%">🔥 Moments + Spoiler-safe Chat</th>
      <th width="33%">🧑‍🤝‍🧑 Friends &amp; Groups</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td valign="top">
        <img
          alt="Watchly room: 16:9 aspect-locked YouTube player, participants rail on right, host controls below"
          src="docs/screenshots/room.png"
          onerror="this.style.display='none';this.nextElementSibling && (this.nextElementSibling.style.display='grid');"
        />
        <div style="display:grid;place-items:center;aspect-ratio:16/9;border:1px dashed #db277755;border-radius:12px;color:var(--color-text-muted,#94A3B8);background:radial-gradient(circle at 40% 20%, #db27771a 0%, transparent 60%);font-size:0.82rem;text-align:center;padding:8px;">
          16:9 frame<br/>
          Participant sidebar on right<br/>
          Host play / pause / seek overlay<br/>
          Moments density timeline under the scrubber<br/>
          <code>docs/screenshots/room.png</code>
        </div>
      </td>
      <td valign="top">
        <img
          alt="Moments density heatmap and chat panel with blurred future-spoiler messages"
          src="docs/screenshots/moments-chat.png"
          onerror="this.style.display='none';this.nextElementSibling && (this.nextElementSibling.style.display='grid');"
        />
        <div style="display:grid;place-items:center;aspect-ratio:16/9;border:1px dashed #db277755;border-radius:12px;color:var(--color-text-muted,#94A3B8);background:radial-gradient(circle at 60% 30%, #db27771a 0%, transparent 60%);font-size:0.82rem;text-align:center;padding:8px;">
          Moments peaks heatmap (💖 😱 😂)<br/>
          Click a peak → jump + see WHO reacted<br/>
          Chat messages with timestamps<br/>
          Future messages → blurred &amp; click-to-unspoiler<br/>
          <code>docs/screenshots/moments-chat.png</code>
        </div>
      </td>
      <td valign="top">
        <img
          alt="Friends watchlist and Group voting watchlist with thumbnails"
          src="docs/screenshots/friends-groups.png"
          onerror="this.style.display='none';this.nextElementSibling && (this.nextElementSibling.style.display='grid');"
        />
        <div style="display:grid;place-items:center;aspect-ratio:16/9;border:1px dashed #db277755;border-radius:12px;color:var(--color-text-muted,#94A3B8);background:radial-gradient(circle at 80% 30%, #db27771a 0%, transparent 60%);font-size:0.82rem;text-align:center;padding:8px;">
          Friendship requests inbox<br/>
          1:1 shared watchlist (per friendship)<br/>
          Group name + banner + members<br/>
          Voting on what to watch + watched history<br/>
          <code>docs/screenshots/friends-groups.png</code>
        </div>
      </td>
    </tr>
  </tbody>
</table>

---

## 📚 Deep Dives ↓ (collapse)

<details>
<summary><b>⚙️ Environment variables — full reference</b></summary>

<br />

### Client side (`client/.env`)

| Variable | Required | Value example | Purpose |
|---|:-:|---|---|
| `VITE_API_URL` | ✅ | `http://localhost:3001` for dev; absolute origin of your Render backend in prod (no trailing slash) | Base URL every `fetch()` + Socket.IO connects to. **Must be an absolute origin, not `/api`.** Frontend and backend run on different hosts. |
| `VITE_GOOGLE_CLIENT_ID` | ⚠️ | `202338102488-xxxx.apps.googleusercontent.com` | Public Google OAuth Client ID. Required if you want Google sign-in. |

### Server side (`server/.env`)

| Variable | Required | Value example | Purpose |
|---|:-:|---|---|
| `NODE_ENV` | ✅ prod | `production` | Enables fail-fast checks (server refuses to boot if `JWT_SECRET` is missing). |
| `PORT` | ⚪️ | *auto-injected by Render* | Bind port. Defaults to `3001` locally. Express binds to `0.0.0.0:$PORT`. |
| `CLIENT_URL` | ✅ | `http://localhost:5173` for dev; **your Vercel / Netlify origin in prod — NO trailing slash** | Exact-origin allowlist for CORS + Socket.IO CORS. Also used for magic-link email callback URLs. |
| `DATABASE_URL` | ⚠️ rec | `postgresql://avnadmin:PASS@H.aivencloud.com:PORT/defaultdb?sslmode=require` | If absent, the server runs **degraded mode**: basic rooms work, but any friends/groups/chat persistence route returns 503 and `/api/health` reports `"degraded"`. |
| `JWT_SECRET` | ✅ | *generate once:* `openssl rand -hex 32` (64+ chars recommended) | Signs session cookies. Refuses to boot in production if empty. Rotate = all active sessions logged out. |
| `GOOGLE_CLIENT_ID` | ⚠️ | *same value as the client* | Verifies id_tokens on the backend for Google logins. |
| `BREVO_API_KEY` | ⚠️ if email used | `xkeysib-<…>` | Magic-link email delivery (300/day free). HTTPS REST API, **not SMTP** — Render SMTP ports blocked on free tier is irrelevant to us. |
| `BREVO_FROM_EMAIL` | ⚠️ if email used | `noreply@watchly.app` | Sender address. Must be a verified Brevo sender. |
| `BREVO_FROM_NAME` | ⚪️ | `Watchly` | Display name on magic-link emails. |
| `CLOUDINARY_CLOUD_NAME` | ⚠️ if avatars used | `dxyxxxxxx` | Profile + group picture uploads (unsigned preset). 25 GB free. |
| `CLOUDINARY_API_KEY` | ⚠️ if avatars used | `912xxxxxxxxx` | |
| `CLOUDINARY_API_SECRET` | ⚠️ if avatars used | `x-x-xxxxxxxxxxxxxxxxxxxxx` | Never paste this to the frontend. Only the server reads it. |

</details>

<details>
<summary><b>🎞 Video provider matrix — what works, what doesn't</b></summary>

<br />

| Provider | Playback engine | Source type | DRM / restrictions we respect |
|---|---|---|---|
| **YouTube** | Official `iframe` + YouTube IFrame API (`onReady`, `seekTo`, `playVideo`) | `https://youtube.com/watch?v=…`, `youtu.be/…`, shorts URLs accepted | Never bypasses YouTube's native ad/DRM/premium checks. If YouTube requires login on host browser, it requires it on every client — Watchly does not tunnel or proxy. |
| **Google Drive** | Native `<video>` element pointed at `googleapis.com/drive/v3/files/<id>?alt=media&key=…` blob | Public Drive video file, or "anybody with link can view" sharing permission set. Requires a valid `GDRIVE_API_KEY` configured. | Respects Drive's file-level ACL 100%. We do not scrape private Drives. CORS preflight must pass. |
| **Direct video URL** | Native `<video>` element (browser codecs only: H.264 MP4, WebM VP9, HLS via hls.js if extended in future) | Any direct `https://…./video.mp4` the browser will play CORS-allowed. | Never proxied. Browser fetches the file directly from the host. If the upstream blocks CORS, the viewer sees an explicit "this source doesn't allow browser playback" message — we do not pretend it works. |

Want a new provider? Implement `VideoProvider` in the client. The rest of the room / sync / chat / moments system is completely provider-agnostic and does not change.

</details>

<details>
<summary><b>🧑‍🤝‍🧑 Friends vs Groups — what's the difference?</b></summary>

<br />

They are separate systems on purpose. Watchly never treats "a group" as "a big friend list" — the semantics are different.

| Concept | Friends (1:1) | Groups (N people) |
|---|---|---|
| Membership model | Mutual friendship (request → accept → both have each other listed) | Owned by a creator/owner; admin invites; can leave any time |
| Shared watchlist | Exactly one per friendship — represents "movies these two people want to watch together" | One per group — represents "movies this *group* wants to watch together" |
| Voting on what to watch next | ❌ No | ✅ Yes, rank-what-to-watch voting per item |
| Watched history | Optional per-friendship | First-class per-group history + "Watch again" from any past item |
| Group banner picture, display name | ❌ No (each user has their own profile) | ✅ Yes |
| Start a Watch Party from a watchlist item | ✅ Yes | ✅ Yes |
| Presence indicators | Online/offline dot on profile cards | Per-session member list only |
| Typical scale | ~10–200 friends per user | ~3–25 members per group |

</details>

<details>
<summary><b>🚀 Production deployment — three-step cheatsheet</b></summary>

<br />

The exhaustive 2026 free-tier audited version lives in [`DEPLOYMENT.md`](DEPLOYMENT.md). This is the TL;DR:

1. **Frontend → Vercel Hobby** (default, per AGENTS.md) · import repo · Framework = Vite · Build command `npm install --include=dev && npm run build -w shared -w client` · Output `client/dist` · Env: `VITE_API_URL=<your render origin>`, `VITE_GOOGLE_CLIENT_ID`, `NODE_VERSION=20`.
   - *(Netlify alternate)*: `netlify.toml` at repo root pre-configures everything. Keep the **20-deploys/month credit math** in mind (15 credits/production deploy, 300 credits/mo total on new post-Sep-2025 accounts). See DEPLOYMENT.md §2b.
2. **Backend → Render Free Web** · `Node` runtime · Build `npm install --include=dev && npm run build -w shared -w server` · Start `node server/dist/index.js` · **Hobby plan** · set all env vars, including `CLIENT_URL=<your vercel or netlify origin, no slash>`.
3. **Database → Aiven PostgreSQL Free** · copy Service URI · Render env `DATABASE_URL=<URI>` · run the `server/db/migrations/*.sql` files against it once (easiest: `node server/dist/db/migrate.js`, or paste the SQL into Aiven's web console).
4. **Warm Render**: add a BetterStack Free (or UptimeRobot Free, or HetrixTools Free) external monitor to `GET https://<render-url>/api/health` every **≤12 minutes**. Render sleeps after 15 idle minutes — this keeps it warm.

**Then, cross the URLs:** set `VITE_API_URL` (frontend env) = Render URL; set `CLIENT_URL` (backend env) = Vercel / Netlify URL; redeploy both; try `/api/health`; done.

The full per-service free-tier limits, all the gotchas, SMTP-block note, Render-own-DB-30-day-expiry warning, Netlify credit math, and uptime-tool comparisons are in [`DEPLOYMENT.md`](DEPLOYMENT.md).

</details>

---

## 🤝 Contributing

Portfolio project, but PRs welcome.

```
Fork the repo
Branch:  git checkout -b feature/your-feature
Make changes
Run checks: npm run typecheck  &&  npm run lint  &&  npm test
Open PR 🔖
```

If you touch architecture (sync, providers, or the RoomState), please read [`AGENTS.md`](AGENTS.md) first — the project has very deliberate opinions on what goes where, what gets persisted, and what does NOT. Code changes that break the AGENTS.md core rules (persisting playback ticks, broadcasting per-frame events, adding paid infrastructure when a free solution exists) will be closed gently with a pointer to the rule.

---

## 📄 License

**MIT** (portfolio-friendly). If you'd rather ship Watchly under another license, you only need to edit this section and the `license-MIT` badge in the hero.

```
MIT License

Copyright (c) 2026 Watchly contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<p align="center">
  <a href="#-watchly--watch-together-feel-it-together">
    <img src="client/public/favicon.svg" alt="" width="30" />
  </a>
  <br />
  <sub>
    Made with <span style="color:#db2777">♥</span> &nbsp;+&nbsp; 🔴 live-synced magenta, for friends.
  </sub>
</p>
