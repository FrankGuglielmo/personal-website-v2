# Word Spies (Codenames-style) at `/codenames`: plan

**Status:** plan only. No feature code yet. Each item under "Open decisions" needs Frank's pick; the **Recommended** option is the default if he doesn't choose.

## Summary

Word Spies is a party game for 6-10 people at `frankguglielmo.com/codenames`. It runs in the existing Next.js app in `next-site/` on Frank's existing Vercel Hobby project. It costs nothing, needs no new accounts, and adds no npm dependencies.

**Setup: one board phone cast to the TV.**

- **Board (the host device).** One phone or laptop creates the room and is cast or screen-mirrored to the TV. It shows the 5x5 board, the score and whose turn it is. It is the **only device that reveals cards**: the team says its guess out loud, and the person holding the board taps that word. The app then reveals the card's color (blue, red, bystander or assassin). The board never receives the key, so it's safe on the TV.
- **Spymasters (one per team).** They join on their own phones and pick a team and "Spymaster". Their phone shows the **key**, which is the color of every card, with revealed cards dimmed. It's read-only, so the only thing they do is give clues out loud.
- **Operatives (everyone else).** Joining is **optional**. If they join, they pick a team and "Operative", and their phone shows the same board as the TV, plus their team and whose turn it is. Players who don't join just watch the TV.

**How it works:** one route handler, `app/api/codenames/route.ts`, is the authoritative server. Phones poll it about once a second, and it returns a **per-role view**, so only spymasters' phones ever receive the key. A 4-letter room code (`/codenames?room=CODE`) is shown in large text on the TV lobby so people can join.

The UI name is **Word Spies** and the URL stays `/codenames`. The word lists are written from scratch.

## Turn flow

1. The TV shows "Blue's turn". The blue spymaster gives a clue out loud, for example "Ocean, 2".
2. Blue's operatives talk it over and say a word. The person holding the board taps it and confirms (Decision 5).
3. If it's a blue card, blue can keep guessing. If it's a bystander or a red card, the turn passes automatically. If it's the assassin, blue loses (Decision 8).
4. The person holding the board taps "End turn" when blue stops guessing.
5. After the game, the TV shows the full key, and "New game" deals a new board with the same teams.

## Recommended approach

Copy the conventions from the Taboo plan ([PR #10](https://github.com/FrankGuglielmo/personal-website-v2/pull/10), `docs/taboo/ARCHITECTURE.md`) so both games can later share one lobby. Write the code separately here, because that branch isn't merged.

| Concern | Taboo's approach (#10) | Word Spies |
| --- | --- | --- |
| Transport | `POST /api/taboo {op, code, token, ...}`, ~1 s polling | Same shape: `POST /api/codenames` |
| Room code | 4 letters, no I/O, `?room=CODE` share link | Same, shown in large text on the TV lobby |
| Identity | `{playerId, token}` in `localStorage` per room | Same. The board device holds the host token. |
| Store | In-memory + AES-GCM encrypted client snapshot; Upstash optional | Same default (see Decision 10) |
| Secrecy | Per-player `viewFor(player)`; guessers get `card: null` | Only spymasters get `key`. The board and operatives get `null` for unrevealed cards. |
| Host | Normal player + settings/kick | The host is the board device. Only the host can reveal cards, end turns, undo or start a new game. |
| Engine | Pure reducer in `_lib/engine.ts`, `tick(now)` per request | Same |

**Planned files (all new, nothing shared):** `next-site/app/codenames/{layout,page}.tsx`, `next-site/app/api/codenames/route.ts`, `next-site/app/api/codenames/_lib/{engine,store,words,crypto}.ts`, and `next-site/components/codenames/*`. Once both games are merged, the room, token and store helpers can move into a shared `lib/party/`. That is not part of this work.

**Free-tier headroom:** at most 10 phones × 1 request/s × 2 h comes to about 72K function invocations per party, against the 1M/month Hobby limit, which Taboo shares. When a tab is hidden, polling drops to once every 5 s. If the limit is ever hit, Hobby pauses the functions instead of billing.

**Preview caveat (same as Taboo):** Vercel Authentication protects preview URLs by default, so guests' phones can't open them. Play on production after merging, or turn off preview protection.

## Open decisions

### Decision 1: Board and word sets
The board is 5x5. The starting team has 9 agents, the other team has 8, plus 7 bystanders and 1 assassin. The starting team is random.
- A. One original list of about 400 family-friendly single words.
- **B. Original default list plus 2-3 themed packs** (for example Food, Places, Holiday), chosen on the board device in the lobby. **Recommended.**
- C. B, plus a "paste your own words" box for custom packs.

### Decision 2: Team and role setup
Each joining phone enters a name and taps a team (Blue or Red) and a role (Spymaster or Operative). The TV lobby lists who is on each team. Starting requires one spymaster per team.
- **A. Self-select, with the board device able to fix mistakes** (move a player or change a role). **Recommended.**
- B. Self-select only, with no host override.
- C. Players only enter a name, and the board device assigns teams and roles.

### Decision 3: Spymaster rules and rotation
- **A. Exactly one spymaster per team, chosen in the lobby.** "New game" keeps the roles, and players can switch before starting. **Recommended.**
- B. The same, but "New game" automatically passes the spymaster role to the next teammate who joined.
- C. Allow two spymasters per team, sharing the key view.

Under every option, the board device can never be a spymaster, because its screen is on the TV.

### Decision 4: What each screen shows
- **TV (the board device):** words, revealed colors, score (agents left per team), whose turn it is and the current clue. The host controls (reveal, end turn, undo) are kept small and at the edge of the screen. The layout is landscape-first with large text, sized for a mirrored phone.
- **Spymaster phone:** the key on a 5x5 grid with revealed cards dimmed, the score and whose turn it is.
- **Operative phone:** the same as the TV, minus the host controls.

Options:
- **A. As above, with operatives' joining optional.** **Recommended.**
- B. The same, but operatives don't join at all; only spymasters' phones join.
- C. Add a separate read-only `/codenames/tv?room=CODE` view, for a laptop or smart-TV browser instead of casting a phone. This could also be added later.

### Decision 5: How the board device reveals a card
- A. One tap reveals the card right away, and Undo fixes mistakes.
- **B. Tap to select, then tap "Reveal".** Undo restores the last reveal. **Recommended.** Wrong taps would be visible to everyone on the TV, so a two-step reveal is safer.
- C. Long-press to reveal, with no confirm step.

Under every option, a wrong guess passes the turn automatically, and "End turn" is always available on the board device.

### Decision 6: Clue entry
- **A. Spoken aloud, with no app input.** **Recommended.** This is the simplest option, and it matches how people play at a table.
- B. Spoken aloud, and the spymaster optionally types the clue and number on their phone so the TV shows "Ocean, 2" and the app counts guesses left.
- C. Typed clues required, with the standard limit of number + 1 guesses enforced.

### Decision 7: Turn timer
- **A. Off.** **Recommended** for a casual party.
- B. Optional board setting (off, 60, 90 or 120 s), shown on the TV. The turn passes automatically when time runs out.
- C. A countdown on the TV that is only a reminder and never passes the turn.

### Decision 8: Assassin and end conditions
Standard rules: revealing a bystander or an opponent's agent ends the turn. A team wins when all of its agents are revealed, including when the other team reveals the last one.
- **A. Standard assassin:** revealing it means instant loss for the guessing team. **Recommended.**
- B. Soft assassin: it ends the turn, and the other team gets 1 of its agents revealed for free.
- C. A board setting to choose between A and B, with A as the default.

### Decision 9: Rejoin and refresh
The state lives on the server, so a refresh never loses the game, and Wake Lock keeps the screen on where supported. Only the board device is critical.
- **A. Tokens in `localStorage` restore every device.** If the board device is lost, any joined player can tap "Take over board" after it hasn't been seen for 30 s. Spymasters and operatives who lose their token just join again with the same team and role. **Recommended.**
- B. The same, but a "Take over board" device must enter the room code plus a 4-digit host PIN shown in the lobby.
- C. Tokens only, with no takeover. If the board device is lost, the game is over.

### Decision 10: Room store (zero cost, no new account)
- **A. Taboo's default: in-memory rooms, with every client also holding an AES-GCM encrypted copy of the room**, which rebuilds the room if the function instance is recycled. **Recommended.** It needs no setup and matches Taboo. Set `CODENAMES_SECRET` in Vercel so an operative can't decrypt the key from their own snapshot, since the repo is public.
- B. A plus Vercel Runtime Cache (`getCache()` from `@vercel/functions`) as a shared layer between instances. This is Vercel-native with no account, but it's per-region and evicts old entries, and it adds one dependency. Check what it includes on Hobby first.
- C. Upstash Redis free tier through the Vercel Marketplace. This is the most robust option, but it creates an Upstash account, which conflicts with the brief.

Ruled out: Vercel Blob, because its free operation quota can't handle 1 s polling, and Global Config, formerly Edge Config, because it's built for rare writes, not frequent ones.

### Decision 11: Visual style
Always applied: the site's `.glass` / `GlassPanel` panels, the background, the light/dark mode set by `ThemeToggle` (the `.dark` class), and a `noindex` page that isn't linked from the nav. The teams are Blue and Red, as Frank described.
- **A. Glass board.** Cards are frosted glass tiles. A revealed card fills with blue, red or a neutral tint, and also gets an icon (agent, bystander or skull), so color isn't the only cue on the TV. The spymaster's key uses solid fills. The route is full-screen with the sidebar and navbar hidden, so the cast TV shows only the game. **Recommended.**
- B. The same, but inside the normal site chrome (sidebar and navbar stay).
- C. Flat solid cards for maximum legibility on the TV, with glass used only for the surrounding panels.

### Decision 12: UI name
- **A. Word Spies.** **Recommended.**
- B. Clue Crew.
- C. Undercover Words.

## Phase 1 scope and size

- **In scope:** the board device creates a room and shows the room code on the TV lobby. Phones join with a team and role. The board device reveals cards (tap, then Reveal) with Undo and End turn. The game ends on the assassin or when a team's agents are all revealed, and then shows the full key. New game keeps the teams. Also in scope: the spymaster key view, the optional operative view, rejoin and board takeover, and full-screen glass styling with light and dark modes.
- **Deferred:** QR codes for joining, custom word packs, typed clues, the turn timer, the separate `/tv` view, the Runtime Cache layer, rate limiting, and an automated multi-browser end-to-end suite.
- **Build size:** smaller than the earlier version of this plan, and smaller than Taboo's Phase 1, because only one device writes during play. It adds about 12 new files and about 1,000-1,300 lines, including about 400-500 words of data. The work breaks down into a pure engine with `node --test` unit tests (board generation, reveal and turn passing, undo, the assassin and wins, and the key removed from board and operative views), one route handler, the store copied from Taboo's pattern, about 4 screens (home, lobby, the board or TV view, and the spymaster key view), and writing the word lists. It fits in a single implementation pass, followed by a manual test with a board browser and 2 spymaster browsers.
