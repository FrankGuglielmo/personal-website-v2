# Impostor (Spyfall-style) party game — plan

**Summary.** A phone-per-player party game at `frankguglielmo.com/impostor` for 6–10 people. The host creates a room and gets a 4-letter code (or a share link, `/impostor?room=CODE`). Everyone joins and secretly sees the same location or word, except the impostor(s), who see "You are the Impostor". Players then question each other or give clues, vote, and the impostor gets one last-chance guess. Scores carry across rounds. Everything is plain fun at a get-together. Nothing is built for scale.

**Recommended approach (zero cost, no new accounts).** Copy the lobby and transport pattern from the Taboo plan ([PR #10](https://github.com/FrankGuglielmo/personal-website-v2/pull/10), `docs/taboo/ARCHITECTURE.md`) so the two games can later share a lobby. The code is a copy, not an import, because that branch is unmerged.

- One route handler, `next-site/app/api/impostor/route.ts`, is the authoritative server. It holds a pure reducer (`_lib/engine.ts`) and returns a **per-player view**, so non-impostors' phones never receive "who is the impostor" and impostors' phones never receive the secret.
- Clients poll `POST /api/impostor {op:"sync"}` about once a second (once every 5 s while the tab is hidden). Timers are server `endsAt` timestamps with clock-skew correction.
- **Store:** by default, in-memory plus an AES-GCM encrypted snapshot held by each client, so a cold or recycled function instance rebuilds the room from the next poll. If Frank later adds Upstash Redis (free, through the Vercel Marketplace), the store switches to it automatically when the env vars are present. Same interface as Taboo. No new npm dependencies.
- Room codes: 4 letters, no I or O. Rooms expire 8 h after the last write. Up to 16 players per room. The page is marked `noindex` and is not linked in the nav.
- UI code is isolated under `app/impostor/` and `components/impostor/`. It reuses the `GlassPanel`, `.glass` and `.liquid-glass` styles and the existing theme toggle and background.

Free-tier headroom matches the Taboo estimate: a few parties a month at 1 Hz is roughly 40% of Hobby's 1M invocations. If both games run on the same night, the combined load still fits, and Hobby pauses rather than bills.

---

## Open decisions

Each decision lists the options, then **Default** (what gets built if Frank doesn't choose).

**D1. Game variant**
- A. **Spyfall-style:** a secret location, with an optional role for each non-impostor (for example "Waiter" at "Diner"). Players take turns asking each other free-form questions out loud.
- B. **Word-impostor:** a secret word inside a known category. Each round, every player says one related word in turn order, then the group discusses.
- C. Both, picked by the host in the lobby.
- **Default: C, built A-first.** The engine is the same; only the pack shape and the clue phase differ. If time runs short, ship B alone, because it is easier for new players to pick up.

**D2. Number of impostors — DECIDED (Frank)**
- **The host sets the count freely in the lobby** (a stepper), regardless of player count. For example, 2 impostors with 7 players is fine.
- The only guardrail is that impostors must be fewer than the innocents (with 7 players, up to 3 impostors). The stepper starts at 1 and remembers the host's last choice for the room.
- Still open, as a toggle: whether multiple impostors know about each other. **Default: they don't know** (more chaos).

**D3. What the impostor knows — DECIDED (Frank)**
- **Everyone, impostors included, stays in the same category.** The impostor's card shows the round's category (for example "Food" or "Thanksgiving") but not the secret.
- This applies in both modes. Spyfall locations are grouped into the same categories as the word packs.
- The last-chance guess list (D8) is drawn only from that category.

**D4. Packs (all original content)**
- A. One mixed pack.
- B. Themed packs the host can select: Everyday Places, Food, Animals, Movies & TV (generic), Sports, Jobs, **Thanksgiving** (e.g. Turkey, Parade, Pie Table, Kids' Table, Football Game), **Family Gathering** (e.g. Grandma's Kitchen, Road Trip, Family Photo, Board Game Night). Spyfall locations each get about 6 roles.
- C. B plus a "custom list" field for the host.
- **Default: B.** About 8 packs × 20–30 entries, around 200 total, in `components/impostor/packs.ts`. A word never repeats within a game. Custom lists are Phase 2.

**D5. Clue phase (word-impostor mode)**
- A. **Spoken aloud.** The app shows the turn order and whose turn it is; players tap "Done".
- B. **Typed in the app.** Each player submits one word, and words are revealed to all at once or in order.
- C. Host toggle.
- **Default: A**, because it's a party in one room and typing slows things down. B is Phase 2. In Spyfall mode, questioning is always spoken. The app suggests who asks first and shows a "Your turn to ask" hint.

**D6. Discussion timer**
- A. Fixed timer: 3, 5 or 8 min (Spyfall uses about 1 min per player).
- B. No timer: the host taps "Vote now".
- C. Timer, plus "Call a vote" that anyone can trigger, with a majority needed to start voting early.
- **Default: A at 5 min, plus a host "Vote now" button.** Majority call-a-vote (C) is Phase 2.

**D7. Voting**
- Format: **simultaneous secret vote** on your own phone (you can't vote for yourself). Votes are revealed together once everyone has voted or a 45 s vote timer ends. The other option is open hand-raising off-app.
- Ties: A. a 30 s re-vote between the tied players only; B. a tie means no elimination and the impostor wins the round; C. the host breaks the tie.
- Multiple rounds of elimination: A. one vote per round, and the round ends (classic); B. if an innocent is voted out, play continues with another discussion and vote until the impostor is caught or impostors equal the innocents.
- **Default: secret vote, tie resolved by one re-vote (still tied means the impostor wins), single vote per round.** Multi-vote (B) is a host toggle, but only when there are 2 impostors.

**D8. Impostor's last-chance guess**
- A. When caught, the impostor picks the secret from a list of about 10 options (the same category); a correct pick steals the round.
- B. Free-text guess, with the host judging it.
- C. No guess.
- Also: let the impostor guess **at any time** during discussion (Spyfall rule), which ends the round immediately.
- **Default: A on capture, plus an "I know it!" button during discussion** in Spyfall mode. A wrong guess means the impostor loses.

**D9. Scoring across rounds**
- A. No score; each round stands alone.
- B. Points: innocents get +1 each if the impostor is caught; the impostor gets +2 for surviving, or +3 for a correct last-chance guess; +1 bonus to whoever first voted for the impostor.
- C. Simple win tally per side.
- **Default: B**, with a running leaderboard between rounds. A game is N rounds (default 5), or the host taps "End game". Roles are re-dealt each round, and the impostor is never the same person twice in a row when that can be avoided.

**D10. Secret reveal UX on phones**
- A. **Tap-and-hold to peek:** a card is face-down and shows the secret only while a finger is held on it. It re-hides on release, on blur and after 3 s.
- B. Tap to flip, then tap again to hide.
- C. A one-time reveal, then hidden (with a "peek again" option).
- **Default: A.** Impostor and innocent cards look identical face-down and are the same size (no layout or length tell). Text is muted until the reveal. Peeking again is allowed at any time. A haptic buzz on hold, where supported, plays the same for everyone.

**D11. Rejoin and refresh**
- A. A token in `localStorage` per room auto-resumes after a refresh or a sleeping phone (same as Taboo).
- B. A plus a host "rejoin as…" picker for a player whose phone died or who switched browsers.
- C. Rejoin by name only (simpler, but anyone can impersonate).
- **Default: A in Phase 1, B in Phase 2.** Players who disconnect mid-round keep their role. If they miss a vote, they abstain. The host can kick a player, and if the host is gone for 45 s, any player can tap "Become host".

**D12. Visual style**
- A. Reuse the site's liquid glass as-is: `GlassPanel`, `.liquid-glass` buttons, the page background image and the existing light/dark toggle (a CSS-variable theme, so the game follows it automatically).
- B. A plus a game accent color: a deep red "impostor" tint on the reveal card and the vote results.
- C. A separate full-screen game theme.
- **Default: B.** Mobile-first single column, 64 px tap targets, text labels rather than color-only cues, and the bottom nav stays (the game pads above it).

---

## Screens and flow

Home (create or join) → Lobby (big code, share, player list, host settings: mode, packs, impostors, timer, rounds) → Reveal (hold to peek, "Ready") → Discussion (timer, turn hint, "I know it!") → Vote → Results (who it was, the secret, last-chance guess) → Leaderboard → next round or Game over.

State machine: `lobby → reveal → discuss → vote (→ revote) → guess → results → (reveal | over)`.

## Phases and estimate

- **Phase 1:** everything marked Default above, except the items marked Phase 2. That means the engine and reducer with `node --test` unit tests (dealing, impostor count, vote and tie math, scoring, view secrecy), one route handler, the store (copied from Taboo), one client component with about 7 screens, the packs, and a manual 6-browser Playwright smoke run.
- **Phase 1 estimate:** about 4–6 hours of focused build time, or less if Taboo's lobby and store code has merged and can be copied directly. Most of the work is the engine, the packs and the reveal and vote screens.
- **Phase 2:** typed clues, call-a-vote, custom word lists, the rejoin picker, a QR code, and a shared `app/_party/` lobby module that both Taboo and Impostor import.

Note: Vercel preview deployments are protected by default, so guests' phones can't open them. Play on production after merge, or disable preview protection.
