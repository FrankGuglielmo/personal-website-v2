# Forbidden Words (Taboo-style) multiplayer — short plan

**Summary.** A small multiplayer party game at `frankguglielmo.com/taboo`, served by the existing Next.js app in `next-site/` on Frank's existing Vercel project. Every player uses their own phone: create or join a room with a 4-letter code or a share link, pick teams in a lobby, and the host starts the game. A single Next.js route handler (`/api/taboo`) is the authoritative server. Clients poll it about once a second. It returns a **per-player view**, so guessers' phones never receive the card. The timer is a server timestamp (`endsAt`). Clients only render it, correcting for clock skew. Target: a handful of rooms with 6-10 players each, used occasionally. Built for tonight; nothing is engineered for scale.

**Recommended stack (zero cost):** Next.js route handler on Vercel Hobby, polling, and a pluggable room store:

| Store | When | Needs | Robustness |
| --- | --- | --- | --- |
| **Vercel Runtime Cache + memory + encrypted client snapshots** (default) | No env vars set | `@vercel/functions` `getCache`, included on every plan; no account or integration | Every request reads the room from the regional Runtime Cache (shared by all instances) and every mutation writes it back after a version check, so a stale instance can't overwrite newer state. The cache has no compare-and-set, so each write carries a nonce and is read back; a write that lost a race adopts the winner and retries. Phones also hold an encrypted copy of the room, which rebuilds it if the cache is evicted, paused or unavailable. Without Vercel (`next dev`) the cache falls back to per-process memory. |
| **Upstash Redis free plan** (optional upgrade) | `KV_REST_API_URL` + `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) set | Frank adds the free Upstash Redis integration from the Vercel Marketplace (Storage tab). That creates an Upstash-linked resource, so it counts as a new account. No card is needed. | Fully shared state with compare-and-set writes. Correct even across many instances. |

One npm dependency, `@vercel/functions` (Vercel's own runtime helpers, for `getCache`). Upstash is called over its REST API with `fetch`, and encryption uses `node:crypto`.

## 1. Rules

- **Teams:** 2, 3 or 4 teams (default 2), set by the host, with names only the host can edit (defaults Team A to Team D). Players pick a team in the lobby, or the host shuffles them. You need at least 2 players per team to start. Teams take turns in order. Odd team sizes are fine: each team has its own clue-giver rotation, so members of a smaller team give clues more often. Rooms saved before team counts existed are upgraded to 2 teams on load.
- **VIP host:** the room creator is the VIP host (crown badge everywhere their name appears). Only the host can change the rules (team count, team names, turn length, skip penalty, win mode and target), shuffle teams, kick, and start, end or restart the game; the server enforces this. Non-hosts see the rules read-only. The host can hand VIP to another player, and anyone can claim it only after the host has been gone 3 minutes, so a locked phone or a quick trip to another app never costs the host the crown.
- **Turn:** teams alternate. The clue-giver rotates through each team in join order. The "Ready" screen shows everyone who is up, and the clue-giver (or host) taps Start.
- **Roles during a turn:**
  - **Clue-giver** sees the card (target word plus 5 forbidden words) and the buttons Correct (+1), Skip (penalty 0 or -1, set in setup), and Undo.
  - **Own-team guessers** see the timer, the turn score and "Guess!". They never receive the card.
  - **Every non-active team (watchers)** sees the card and a big **Buzz** button (-1, skips the card). Duplicate buzzes, including near-simultaneous ones from different teams, count once: every action carries the card id, and once the first buzz moves to the next card the others are stale and dropped.
  - **Spectators** (no team) see the timer and scores but not the card.
  - **Host:** a normal player who also controls settings, start, pause and resume, kick, end game and new game.
- **Timer:** 45, 60 or 90 s (default 60). The server holds `endsAt`. Taps arriving up to 750 ms after zero still count, to cover network delay. After that the server moves to review.
- **Review (disputes and undo):** after time-up everyone sees the list of cards played. The clue-giver or host can tap a result to change it (correct, skip, buzz), then confirm. Scores are applied on confirm. During a turn, Undo reverts the last tap.
- **Pause:** the host or clue-giver can pause. The server stores the remaining milliseconds and resets `endsAt` on resume.
- **Win:** first to the target score (default 20), or a fixed number of rounds. The game is only checked once every team has had the same number of turns. If the lead at or above the target is shared, play continues until a full round breaks it. In rounds mode a shared lead stays a tie.
- **More than 10 players:** works as-is (polling load scales linearly). The cap is 24 players per room.

## 2. Realtime and the server

- **Why polling, not WebSockets:** Vercel Functions can hold WebSockets, but they close at the 300 s max duration on Hobby and have no instance affinity, so they would still need a shared store. Managed realtime services (Ably, Pusher, Liveblocks, Supabase, PartyKit or Cloudflare Durable Objects) would each mean a new account. One poll per second is plenty for a word game.
- **Single route file** (`app/api/taboo/route.ts`): Vercel may give each route file its own function, so all room operations go through one handler to share memory.
- **Authoritative state machine:** the reducer is a pure function in `app/api/taboo/_lib/engine.ts`. Every request runs `tick(now)` first, which handles lazy time-up. It then applies the action and returns `viewFor(player)`.
- **Clock skew:** each response includes `serverNow`. The client keeps `offset = serverNow - (receivedAt - rtt/2)` and renders `endsAt - (Date.now() + offset)`.
- **Card secrecy:** the deck is only imported by server code. Guessers' views have `card: null`, and the played-card words are only revealed in review. The client snapshot is AES-256-GCM encrypted with a server key: `TABOO_SECRET` if set, otherwise derived from the project id, which stays the same across deploys. Servers try every known key when opening a snapshot, so snapshots sealed by an older deployment, or before `TABOO_SECRET` was added, still open. The repo is public, so set `TABOO_SECRET` for real secrecy. Without it a determined player could, in theory, decrypt their own snapshot.

## 3. Room lifecycle

- **Room codes:** 4 letters with no I or O. The share link is `/taboo?room=CODE`, shared with the native share sheet or a copy button. QR codes are deferred.
- **Join and rejoin:** joining returns `{playerId, token}`, which is saved in `localStorage` per room. A refresh or a sleeping phone resumes automatically. Polling slows down while the tab is hidden, and a Wake Lock keeps the screen on where supported.
- **Late joiners** go to the smaller team and join that team's rotation at the end of the order.
- **Host leaving:** if the host hasn't been seen for 3 minutes, any player can tap "Become host". There is no automatic migration.
- **Leaving the tab, locking the phone, redeploys:** nothing a phone does in the background ends a room or removes a player. Players are only removed by the host's Remove or their own Leave, and only the host's End game or New game ends a game. While a phone is away it shows "Reconnecting…" and keeps its session. When it comes back (`visibilitychange`, `pageshow`, `focus`, `online`) it resyncs at once. If the server answers "room missing", the client keeps retrying with its snapshot, which rebuilds the room on whichever instance answers; it only gives up after about 45 consecutive misses (no usable copy anywhere).
- **Why this matters (the Nov 26 bug):** production runs several function instances. Rooms lived only in each instance's memory, and the snapshot key was tied to the deployment. Two redeploys landed mid-game, so the new instances had no room and couldn't read any phone's snapshot. The server answered "Room not found", and the client treated that as final: it erased the session and dropped every phone to the start screen. That looked like "leaving Safari ended the room". Fixed by the shared Runtime Cache store, deploy-stable snapshot keys, separating "room missing" (retry) from "you were removed" (leave), and the 3-minute VIP claim.
- **Kick:** the host can remove a player.
- **Expiry:** rooms expire 8 h after the last write (Runtime Cache TTL, Redis `PX`, or a memory sweep).
- **Abuse (brief):** caps on names (20 characters), players (24) and rooms in memory (200). There is no rate limiting.

## 4. Data model and protocol

- **Room data:** code, version, host id and phase (`lobby`, `ready`, `active`, `review`, `over`). Settings are round length, skip penalty, win mode and target. Then the players (id, name, team, token, joined-at, last-seen), team names, scores, turns played, rotation indexes, active team, clue-giver, turn data (`endsAt`, paused-remaining, played cards), deck order and position, last turn, and winner.
- **Protocol:** `POST /api/taboo` with body `{op, code?, token?, snapshot?, ...}`. The `op` is one of: `create`, `join`, `sync` (the poll), `setTeam`, `setTeamName`, `setSettings`, `shuffleTeams`, `start`, `beginTurn`, `correct`, `skip`, `buzz`, `undo`, `pause`, `resume`, `toggleResult`, `confirmReview`, `kick`, `claimHost`, `transferHost`, `endGame`, `newGame` or `leave`. The response is `{view, snapshot?}` or `{error}`.
- **State machine:** `lobby →start→ ready →beginTurn→ active (⇄ paused) →time-up→ review →confirm→ ready … → over →newGame→ lobby`.

## 5. Deck

397 original family-friendly cards in 7 categories (everyday, food, places, pop culture, actions, nature, Thanksgiving), stored in `deck.ts`. Each game shuffles the deck once, so no card repeats in a game; if the deck runs out it reshuffles. Custom decks later: a room setting holding a pasted list.

## 6. UX

Mobile-first, one column. It uses the site's `.glass` panels, the background image and the existing light/dark toggle (the layout's bottom nav stays; the game pads above it). Screens: Home (create or join) → Lobby (big code, share, team columns, host settings) → Ready → Active (per role) → Review → Game over. Primary buttons are 72 px tall, secondary ones 48 px, all and labeled with text, not just color. Dark-mode styles use a `.dark`-scoped variant (`[.dark_&]:`), because the shared Tailwind config's `dark:` follows the OS setting rather than the site toggle. The timer has an `aria-live` region for milestones. On time-up and buzz there is a short Web Audio beep (unlocked on the first tap, so it is iOS-safe) and `navigator.vibrate` where supported.

## 7. Security, environment variables and accounts

- **Required:** nothing.
- **Optional:** `TABOO_SECRET` (a random string, for snapshot encryption) and the Upstash Redis free integration (for fully shared state). Both are added in the Vercel dashboard by Frank. Nothing paid.
- **Privacy:** only player-entered names are stored. Tokens are random 128-bit values. The page is marked `noindex` and is not linked in the nav.
- **Preview deployments:** Vercel Authentication protects previews by default, so guests' phones can't open a preview URL. Play on production after merging, or turn off preview protection.

### Free-tier headroom

Assumed usage: 3 parties a month × 2 rooms × 2 h × 10 phones polling at 1 Hz (0.2 Hz while hidden), which is 12 room-hours, or about 430K requests a month.

| Limit (Hobby or free) | Usage | What happens if it's hit |
| --- | --- | --- |
| Vercel function invocations, 1M/month | ~430K (43%) | Hobby never bills; functions pause until the 30-day window resets. The rest of the site is static and keeps working. |
| Vercel Active CPU, 4 h/month | ~430K × ~5 ms ≈ 36 min (15%) | Same as above. |
| Vercel provisioned memory, 360 GB-h | ~12–24 GB-h (≤7%) | Same as above. |
| Vercel Runtime Cache (Hobby allowance) | ~1 read per request plus a read-back per write ≈ 460K reads; writes on each action plus a presence write per player every 20 s ≈ 30K | Hobby never bills; the cache pauses and rooms keep working from memory and phone snapshots. |
| Upstash free (only if added), 500K commands/month | ~1 read + occasional writes per poll ≈ 450K (90%) | Requests are rejected and there is no card on file, so no charge. To add headroom, add an in-instance 1 s read cache, which cuts reads several-fold (Phase 2). |

To protect the margin, polling drops to 1 per 5 s while a tab is hidden.

## 8. Testing and phases

- **Tests:** engine unit tests use `node --test` (no new dependencies) to cover rotation, scoring, grace window, undo, review edits, win and tie, and card secrecy in views. Multi-client end-to-end tests use Playwright with 4 or more browser contexts against `next dev`, run ad hoc for this PR.
- **Run tests:** `cd next-site && node --test app/api/taboo/_lib/engine.test.mjs`.
- **Phase 1 (this PR, built):** everything above except QR codes, custom decks, the Redis read cache and the checked-in e2e suite. Verified ad hoc with a 5-browser Playwright run (create, join by link, start, card shown only to the clue-giver and watchers, buzz, refresh and rejoin mid-turn, review, rotation, winner), and by restarting the server mid-turn (the room was restored from a client snapshot). Main work: the engine and reducer, one route handler, a store with two backends, one client component with about 6 screens, and the deck.
- **Phase 2 (hardening):** checked-in Playwright multi-client e2e, a QR code (small dependency), the Redis read cache, a reconnect banner, rate limiting, and a rejoin picker for players who lost their token.
- **Phase 3 (extras):** custom decks and category picks, sound options, per-player stats, and a push transport (WebSocket or Durable Object) if polling ever pinches.

## 9. Tonight

Feasible. Phase 1 needs no account or setup, and it can run as soon as it's on a URL guests' phones can open. Because of preview protection, that means production after merge, unless preview protection is turned off. Cut for tonight: QR codes, custom decks, Redis, and the automated e2e suite. A single device also works in a pinch: one phone can be the clue-giver while the other team watches it.
