# Word Spies (Codenames-style) at `/codenames`: plan

**Status:** plan only. No feature code yet. Each item under "Open decisions" needs Frank's pick; the **Recommended** option is the default if he doesn't choose.

## Summary

Word Spies is a party game for 6-10 people, played on their phones at `frankguglielmo.com/codenames`. It runs in the existing Next.js app in `next-site/` on Frank's existing Vercel Hobby project. It costs nothing, needs no new accounts, and adds no npm dependencies.

- A host creates a room and gets a 4-letter code (`/codenames?room=CODE`). Everyone joins, picks a team, and two players become spymasters.
- There are 25 words on a 5x5 board. Spymasters see the secret key. Operatives see only the words and the cards revealed so far.
- One route handler (`app/api/codenames/route.ts`) is the authoritative server. Clients poll it about once a second, and it returns a **per-player view**, so operatives' phones never receive the key.
- The UI name is **Word Spies**. The URL stays `/codenames`. The word lists are written from scratch.

## Recommended approach

Copy the conventions from the Taboo plan ([PR #10](https://github.com/FrankGuglielmo/personal-website-v2/pull/10), `docs/taboo/ARCHITECTURE.md`) so both games can later share one lobby. Write the code separately here, because that branch isn't merged.

| Concern | Taboo's approach (#10) | Word Spies |
| --- | --- | --- |
| Transport | `POST /api/taboo {op, code, token, ...}`, ~1 s polling | Same shape: `POST /api/codenames` |
| Room code | 4 letters, no I/O, `?room=CODE` share link | Same |
| Identity | `{playerId, token}` in `localStorage` per room | Same, under a `codenames:` key prefix |
| Store | In-memory + AES-GCM encrypted client snapshot; Upstash optional | Same default (see Decision 10) |
| Secrecy | Per-player `viewFor(player)`; guessers get `card: null` | Operatives get `key: null` for unrevealed cards |
| Host | Normal player + settings/kick; "Become host" after 45 s absent | Same |
| Engine | Pure reducer in `_lib/engine.ts`, `tick(now)` per request | Same |

**Planned files (all new, nothing shared):** `next-site/app/codenames/{layout,page}.tsx`, `next-site/app/api/codenames/route.ts`, `next-site/app/api/codenames/_lib/{engine,store,words,crypto}.ts`, and `next-site/components/codenames/*`. Once both games are merged, the room, token and store helpers can move into a shared `lib/party/`. That is not part of this work.

**Free-tier headroom:** 10 phones × 1 request/s × 2 h comes to about 72K function invocations per room per party, against the 1M/month Hobby limit, which Taboo shares. When a tab is hidden, polling drops to once every 5 s. If the limit is ever hit, Hobby pauses the functions instead of billing.

**Preview caveat (same as Taboo):** Vercel Authentication protects preview URLs by default, so guests' phones can't open them. Play on production after merging, or turn off preview protection.

## Open decisions

### Decision 1: Board and word sets
The board is 5x5. The starting team has 9 agents, the other team has 8, plus 7 bystanders and 1 assassin. The starting team is random.
- **A. One original list** of about 400 family-friendly single words.
- **B. Original default list plus 2-3 themed packs** (for example Food, Places, Holiday), chosen by the host in the lobby. **Recommended.**
- **C. B, plus a "paste your own words" box** for custom packs.

### Decision 2: Team setup
- **A. Players pick a team in the lobby, and the host can tap Shuffle.** **Recommended.** This matches Taboo.
- B. Teams are always randomly assigned when the game starts.
- C. The host drags players onto teams.

### Decision 3: Spymaster assignment
- A. Random at game start.
- B. Chosen: players tap "Be spymaster" in the lobby, and the host can override.
- **C. Chosen for the first game, then rotating:** "New game" passes the spymaster role to the next teammate in join order. The host can still override. **Recommended.**

### Decision 4: What each role sees
- Spymaster: the board with the key colors and the clue entry.
- Operatives: the board with only revealed colors, plus the current clue and the number of guesses left.
- Everyone: scores, whose turn it is, and the clue log.

Options:
- A. Phones only.
- **B. Phones, plus an optional read-only "TV" view** at `/codenames/tv?room=CODE`, showing the operative view large enough for a laptop or TV. **Recommended.** It's cheap to add, since it's just another view.
- C. A shared TV board is required. Phones are only for spymasters and for tapping.

### Decision 5: How guesses are made
- A. Any operative on the active team taps a card, and it's revealed right away.
- **B. Tap, then confirm.** Tapping highlights the card for the whole team, and a "Reveal" button confirms it. Any operative on that team can confirm or change the pick. **Recommended.** This prevents accidental taps without slowing the game down.
- C. Team vote: a card is revealed once a majority of the team's operatives pick it.

Under every option, any operative can tap "End turn" once at least one guess has been made.

### Decision 6: Clue entry
- **A. Typed in the app:** one word plus a number from 0 to 9 or ∞. The clue is shown to everyone and logged. The server enforces the standard limit of number + 1 guesses, and it rejects a clue that is a word on the board. **Recommended.**
- B. Spoken aloud. The spymaster only taps the number, so the guess limit is still enforced.
- C. Spoken aloud with no app input. Operatives guess until they miss or tap "End turn".

### Decision 7: Turn timer
- **A. Off.** **Recommended** for a casual party.
- B. Optional host setting (off, 60, 90 or 120 s). The server stores `endsAt`, the same way Taboo does, and the turn passes automatically when time runs out.
- C. A timer on the spymaster's clue only (for example 90 s), with unlimited guessing time.

### Decision 8: Assassin and end conditions
Standard rules: revealing a bystander or an opponent's agent ends the turn. A team wins when all of its agents are revealed, including when the other team reveals the last one.
- **A. Standard assassin:** revealing it means instant loss for the guessing team. **Recommended.**
- B. Soft assassin: it ends the turn, and the other team gets 1 of its agents revealed for free. This is gentler for first-time players.
- C. A host setting to choose between A and B, with A as the default.

After the game, everyone sees the full key, and the host can tap "New game" to get a new board with the same teams.

### Decision 9: Rejoin and refresh
- A. Token only: refreshing restores the session from `localStorage`. A lost token means joining as a new player.
- **B. Token, plus a "Rejoin as…" picker** listing players who haven't been seen for over 30 s. The host can also re-seat players. **Recommended.** At a party, people switch phones and browsers.
- C. Only the host can re-seat players.

Under every option: the state lives on the server, so a refresh never loses the game. A Wake Lock keeps screens on where supported. "Become host" works the same way as in Taboo.

### Decision 10: Room store (zero cost, no new account)
- **A. Taboo's default: in-memory rooms, with every client also holding an AES-GCM encrypted copy of the room**, which rebuilds the room if the function instance is recycled. **Recommended.** It needs no setup and matches Taboo. Set `CODENAMES_SECRET` in Vercel so a player can't decrypt the key from their own snapshot, since the repo is public.
- B. A plus Vercel Runtime Cache (`getCache()` from `@vercel/functions`) as a shared layer between instances. This is Vercel-native with no account, but it's per-region and evicts old entries, and it adds one dependency. Check what it includes on Hobby first.
- C. Upstash Redis free tier through the Vercel Marketplace. This is the most robust option, but it creates an Upstash account, which conflicts with the brief.

Ruled out: Vercel Blob, because its free operation quota can't handle 1 s polling, and Global Config, formerly Edge Config, because it's built for rare writes, not frequent ones.

### Decision 11: Visual style
Always applied: the site's `.glass` / `GlassPanel` panels, the background, the light/dark mode set by `ThemeToggle` (the `.dark` class), and a `noindex` page that isn't linked from the nav.
- **A. Glass board.** Cards are frosted glass tiles. A revealed card fills with its team tint and also gets an icon (agent, bystander or skull), so color isn't the only cue. The spymaster's key colors appear as thin tinted borders. The page goes full-width with the sidebar hidden on this route. **Recommended.**
- B. The same, but inside the normal site chrome (sidebar and navbar stay).
- C. Flat solid cards for maximum legibility, with glass used only for the surrounding panels.

The team colors come from the site palette, not red and blue (for example coral and teal). Each team name is editable.

### Decision 12: UI name
- **A. Word Spies.** **Recommended.**
- B. Clue Crew.
- C. Undercover Words.

## Phase 1 scope and size

- **In scope:** create and join with a room code, lobby (teams, spymasters, word pack), board, clue entry, tap-and-confirm guessing, end conditions, the full key after the game, new game with spymaster rotation, rejoin, glass styling with light and dark modes, and the optional TV view.
- **Deferred:** QR codes, custom word packs, the turn timer, the Runtime Cache layer, rate limiting, and an automated multi-browser end-to-end suite.
- **Build size:** smaller than Taboo's Phase 1, because there's no timer, no review screen and no undo. It adds about 12 new files and about 1,200-1,600 lines, including about 400-500 words of data. The work breaks down into a pure engine with `node --test` unit tests (board generation, turn passing, guess limits, the assassin and wins, and keys removed from operative views), one route handler, the store copied from Taboo's pattern, about 5 screens (home, lobby, board for each role, game over, TV), and writing the word lists. It fits in a single implementation pass, followed by a manual test with 4 or more browser contexts.
