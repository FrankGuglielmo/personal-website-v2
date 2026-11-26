"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import type { ActionOp, PlayerView, RoomView, Settings } from "../_lib/types";
import { keepAwake, phaseAlert, timeUpAlert, unlockAudio } from "./feedback";
import PeekCard from "./PeekCard";
import { Btn, Panel, Segmented, inputCls } from "./ui";
import { lastRoomCode, loadSession, useRoom } from "./useRoom";

const NAME_KEY = "impostor:name";

type Act = (op: ActionOp, args?: Record<string, unknown>) => Promise<boolean>;

export default function ImpostorApp() {
  const { session, view, error, setError, offline, busy, enter, resume, send, serverNow, leaveLocal } = useRoom();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mounted, setMounted] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    try {
      setName(localStorage.getItem(NAME_KEY) ?? "");
    } catch {}
    const code = (new URLSearchParams(window.location.search).get("room") || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
    const saved = code ? loadSession(code) : (() => {
      const last = lastRoomCode();
      return last ? loadSession(last) : null;
    })();
    if (saved) resume(saved);
    else if (code) setJoinCode(code);
    setMounted(true);
  }, [resume]);

  useEffect(() => (session ? keepAwake() : undefined), [session]);

  const act: Act = useCallback(
    async (op, args = {}) => {
      unlockAudio();
      setPending(true);
      try {
        return await send(op, args);
      } finally {
        setPending(false);
      }
    },
    [send],
  );

  const leave = useCallback(async () => {
    if (!session) return;
    if (!window.confirm("Leave this room?")) return;
    const code = session.code;
    await act("leave");
    leaveLocal(code, null);
    const url = new URL(window.location.href);
    url.searchParams.delete("room");
    window.history.replaceState(null, "", url.toString());
  }, [act, leaveLocal, session]);

  const startEnter = (op: "create" | "join") => {
    unlockAudio();
    try {
      localStorage.setItem(NAME_KEY, name.trim());
    } catch {}
    void enter(op, name, op === "join" ? joinCode : undefined);
  };

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-32 pt-6 text-[hsl(var(--color-text))] md:pt-4">
      {offline && (
        <div role="status" className="mb-3 rounded-2xl border border-amber-300/50 bg-amber-400/80 px-4 py-2 text-sm font-medium text-black">
          Reconnecting…
        </div>
      )}
      {error && (
        <div role="alert" className="mb-3 flex items-start justify-between gap-3 rounded-2xl border border-rose-300/50 bg-rose-600/85 px-4 py-2 text-sm font-medium text-white">
          <span>{error}</span>
          <button type="button" className="font-bold" aria-label="Dismiss" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}
      {!mounted ? null : !session ? (
        <Home name={name} setName={setName} joinCode={joinCode} setJoinCode={setJoinCode} busy={busy} onEnter={startEnter} />
      ) : !view ? (
        <Panel className="text-center">Joining room {session.code}…</Panel>
      ) : (
        <Game view={view} act={act} pending={pending} serverNow={serverNow} onLeave={leave} />
      )}
    </main>
  );
}

// ---------- home ----------

function Home({
  name,
  setName,
  joinCode,
  setJoinCode,
  busy,
  onEnter,
}: {
  name: string;
  setName: (v: string) => void;
  joinCode: string;
  setJoinCode: (v: string) => void;
  busy: boolean;
  onEnter: (op: "create" | "join") => void;
}) {
  return (
    <div className="space-y-4">
      <Panel>
        <h1 className="text-3xl font-black tracking-tight">Impostor</h1>
        <p className="mt-1 text-sm text-black/60 [.dark_&]:text-white/70">
          Everyone gets the same secret, except the impostor. Ask questions, give clues, then vote out who&apos;s faking it. Best with 6–10 people, each on their own phone.
        </p>
      </Panel>
      <Panel className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm text-black/60 [.dark_&]:text-white/70">Your name</span>
          <input className={inputCls} value={name} maxLength={20} autoComplete="nickname" placeholder="e.g. Aunt Linda" onChange={(e) => setName(e.target.value)} />
        </label>
        <Btn tone="primary" big className="w-full" disabled={busy} onClick={() => onEnter("create")}>
          Create a room
        </Btn>
      </Panel>
      <Panel className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm text-black/60 [.dark_&]:text-white/70">Room code</span>
          <input
            className={twMerge(inputCls, "text-center text-2xl font-bold uppercase tracking-[0.4em]")}
            value={joinCode}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="ABCD"
            maxLength={4}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4))}
          />
        </label>
        <Btn tone="good" big className="w-full" disabled={busy || joinCode.length !== 4} onClick={() => onEnter("join")}>
          Join room
        </Btn>
      </Panel>
    </div>
  );
}

// ---------- in-game shell ----------

function useCountdown(endsAt: number | undefined, serverNow: () => number) {
  const [now, setNow] = useState(() => serverNow());
  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setNow(serverNow()), 250);
    return () => clearInterval(id);
  }, [endsAt, serverNow]);
  return endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : 0;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function Timer({ endsAt, serverNow, label }: { endsAt: number; serverNow: () => number; label: string }) {
  const secs = useCountdown(endsAt, serverNow);
  return (
    <div className="text-center">
      <div className="text-xs uppercase tracking-wider text-black/60 [.dark_&]:text-white/70">{label}</div>
      <div className={twMerge("font-mono text-5xl font-black tabular-nums", secs <= 10 && "text-rose-500")} aria-live={secs % 30 === 0 || secs <= 10 ? "polite" : "off"}>
        {fmt(secs)}
      </div>
    </div>
  );
}

function Game({ view, act, pending, serverNow, onLeave }: { view: RoomView; act: Act; pending: boolean; serverNow: () => number; onLeave: () => void }) {
  const prevPhase = useRef(view.phase);
  useEffect(() => {
    if (prevPhase.current === view.phase) return;
    if (prevPhase.current === "discuss" && view.phase === "vote") timeUpAlert();
    else phaseAlert();
    prevPhase.current = view.phase;
  }, [view.phase]);

  const me = view.players.find((p) => p.id === view.meId);
  const isHost = view.hostId === view.meId;
  const nameOf = (id: string | null | undefined) => view.players.find((p) => p.id === id)?.name ?? "Someone";
  const ctx: Ctx = { view, act, pending, serverNow, isHost, me, nameOf };

  return (
    <div className="space-y-4">
      <GlassHeader view={view} onLeave={onLeave} />
      {view.phase === "lobby" && <Lobby {...ctx} />}
      {view.phase === "reveal" && <Reveal {...ctx} />}
      {view.phase === "discuss" && <Discuss {...ctx} />}
      {view.phase === "vote" && <Vote {...ctx} />}
      {view.phase === "guess" && <Guess {...ctx} />}
      {view.phase === "results" && <Results {...ctx} />}
      {view.phase === "over" && <Over {...ctx} />}
      <HostAway {...ctx} />
    </div>
  );
}

type Ctx = {
  view: RoomView;
  act: Act;
  pending: boolean;
  serverNow: () => number;
  isHost: boolean;
  me: PlayerView | undefined;
  nameOf: (id: string | null | undefined) => string;
};

function GlassHeader({ view, onLeave }: { view: RoomView; onLeave: () => void }) {
  const inGame = view.phase !== "lobby" && view.phase !== "over";
  return (
    <Panel className="flex items-center justify-between gap-3 py-3">
      <div>
        <div className="text-lg font-black leading-tight">Impostor</div>
        <div className="text-xs text-black/60 [.dark_&]:text-white/70">
          Room <span className="font-bold tracking-widest">{view.code}</span>
          {inGame && ` · Round ${view.roundNo} of ${view.totalRounds}`}
          {view.category && ` · ${view.category}`}
        </div>
      </div>
      <Btn className="min-h-[40px] px-3 text-sm" onClick={onLeave}>
        Leave
      </Btn>
    </Panel>
  );
}

function HostAway({ view, act, isHost }: Ctx) {
  const host = view.players.find((p) => p.isHost);
  if (isHost || !host || host.online) return null;
  return (
    <Panel className="flex items-center justify-between gap-3 py-3 text-sm">
      <span>{host.name} (host) seems to be offline.</span>
      <Btn className="min-h-[40px] px-3 text-sm" onClick={() => act("claimHost")}>
        Become host
      </Btn>
    </Panel>
  );
}

function SectionTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-bold">{children}</h2>
      {sub && <p className="text-sm text-black/60 [.dark_&]:text-white/70">{sub}</p>}
    </div>
  );
}

// ---------- lobby ----------

function Lobby({ view, act, pending, isHost }: Ctx) {
  const s = view.settings;
  const set = (patch: Partial<Settings>) => act("setSettings", { settings: patch });
  const n = view.players.length;
  const effective = Math.min(s.impostors, view.limits.maxImpostors);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/impostor?room=${view.code}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Join my Impostor game", text: `Room code ${view.code}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <>
      <Panel className="text-center">
        <div className="text-sm text-black/60 [.dark_&]:text-white/70">Room code</div>
        <div className="my-1 text-6xl font-black tracking-[0.25em]">{view.code}</div>
        <div className="text-xs text-black/60 [.dark_&]:text-white/70">Go to this page and enter the code, or share the link.</div>
        <Btn className="mt-3 w-full" onClick={share}>
          {copied ? "Link copied" : "Share invite link"}
        </Btn>
      </Panel>

      <Panel>
        <SectionTitle sub={`${n} of ${view.limits.maxPlayers} · need ${view.limits.minPlayers}+ to start`}>Players</SectionTitle>
        <ul className="mt-3 space-y-2">
          {view.players.map((p) => (
            <li key={p.id} className="flex min-h-[44px] items-center justify-between gap-2 rounded-2xl border border-white/30 bg-white/10 px-3">
              <span className="flex items-center gap-2">
                <span className={twMerge("h-2.5 w-2.5 rounded-full", p.online ? "bg-emerald-400" : "bg-zinc-400")} aria-label={p.online ? "online" : "offline"} />
                <span className="font-medium">
                  {p.name}
                  {p.id === view.meId && <span className="text-black/60 [.dark_&]:text-white/70"> (you)</span>}
                </span>
                {p.isHost && <span className="rounded-full bg-amber-400/90 px-2 py-0.5 text-xs font-bold text-black">Host</span>}
              </span>
              {isHost && p.id !== view.meId && (
                <button
                  type="button"
                  className="min-h-[36px] rounded-xl px-2 text-sm text-rose-600 [.dark_&]:text-rose-300"
                  onClick={() => window.confirm(`Remove ${p.name}?`) && act("kick", { target: p.id })}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="space-y-4">
        <SectionTitle sub={isHost ? "You're the host. Everyone sees these." : "Only the host can change these."}>Game settings</SectionTitle>
        <Segmented
          label="Mode"
          value={s.mode}
          disabled={!isHost || pending}
          onChange={(mode) => set({ mode })}
          options={[
            { value: "spyfall", label: "Secret location" },
            { value: "word", label: "Secret word" },
          ]}
        />
        <p className="-mt-2 text-xs text-black/60 [.dark_&]:text-white/70">
          {s.mode === "spyfall"
            ? "Everyone but the impostor gets a location and a role. Take turns asking each other questions out loud."
            : "Everyone but the impostor gets a word. Go around and each say one related word, then discuss."}
        </p>

        <div>
          <div className="mb-1 text-sm text-black/60 [.dark_&]:text-white/70">Impostors</div>
          <div className="flex items-center gap-3">
            <Btn className="w-14 text-2xl" aria-label="Fewer impostors" disabled={!isHost || pending || s.impostors <= 1} onClick={() => set({ impostors: s.impostors - 1 })}>
              −
            </Btn>
            <div className="min-w-[3ch] text-center text-3xl font-black tabular-nums" aria-live="polite">
              {s.impostors}
            </div>
            <Btn
              className="w-14 text-2xl"
              aria-label="More impostors"
              disabled={!isHost || pending || s.impostors >= Math.max(view.limits.maxImpostors, 1)}
              onClick={() => set({ impostors: s.impostors + 1 })}
            >
              +
            </Btn>
          </div>
          <p className="mt-1 text-xs text-black/60 [.dark_&]:text-white/70">
            With {n} player{n === 1 ? "" : "s"}, up to {view.limits.maxImpostors} (impostors must be outnumbered).
            {effective < s.impostors && ` ${effective} will be used unless more people join.`}
          </p>
        </div>

        {s.impostors >= 2 && (
          <>
            <Segmented
              label="Do impostors know each other?"
              value={s.knowEachOther ? "yes" : "no"}
              disabled={!isHost || pending}
              onChange={(v) => set({ knowEachOther: v === "yes" })}
              options={[
                { value: "no", label: "No (chaos)" },
                { value: "yes", label: "Yes" },
              ]}
            />
            <Segmented
              label="If an innocent is voted out"
              value={s.multiVote ? "keep" : "end"}
              disabled={!isHost || pending}
              onChange={(v) => set({ multiVote: v === "keep" })}
              options={[
                { value: "end", label: "Impostors win" },
                { value: "keep", label: "Keep voting" },
              ]}
            />
          </>
        )}

        <Segmented
          label="Discussion timer"
          value={s.discussSec}
          disabled={!isHost || pending}
          onChange={(discussSec) => set({ discussSec })}
          options={[
            { value: 180, label: "3 min" },
            { value: 300, label: "5 min" },
            { value: 480, label: "8 min" },
          ]}
        />
        <Segmented
          label="Rounds"
          value={s.rounds}
          disabled={!isHost || pending}
          onChange={(rounds) => set({ rounds })}
          options={[
            { value: 3, label: "3" },
            { value: 5, label: "5" },
            { value: 8, label: "8" },
          ]}
        />

        <div>
          <div className="mb-1 text-sm text-black/60 [.dark_&]:text-white/70">Categories</div>
          <div className="flex flex-wrap gap-2">
            {view.catalog.map((c) => {
              const on = s.categories.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  disabled={!isHost || pending}
                  onClick={() => set({ categories: on ? s.categories.filter((x) => x !== c.id) : [...s.categories, c.id] })}
                  className={twMerge(
                    "min-h-[40px] rounded-full border px-3 text-sm font-medium transition disabled:opacity-70",
                    on ? "border-rose-300/60 bg-rose-600/85 text-white" : "border-white/40 bg-white/10",
                  )}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      </Panel>

      {isHost ? (
        <Btn tone="bad" big className="w-full" disabled={pending || n < view.limits.minPlayers} onClick={() => act("start")}>
          {n < view.limits.minPlayers ? `Waiting for ${view.limits.minPlayers - n} more…` : "Deal the cards"}
        </Btn>
      ) : (
        <Panel className="text-center text-sm text-black/60 [.dark_&]:text-white/70">Waiting for the host to start…</Panel>
      )}
    </>
  );
}

// ---------- round ----------

function Reveal({ view, act, pending, isHost, me }: Ctx) {
  const inRound = view.players.filter((p) => p.inRound);
  const readyCount = inRound.filter((p) => p.ready).length;
  return (
    <>
      <Panel className="space-y-3">
        <SectionTitle sub="Press and hold the card to peek. Keep your screen private.">Round {view.roundNo}: your secret</SectionTitle>
        {view.card && <PeekCard card={view.card} />}
      </Panel>
      <Panel className="space-y-3">
        {me?.inRound ? (
          <Btn tone={me.ready ? "ghost" : "good"} big className="w-full" disabled={pending || me.ready} onClick={() => act("ready")}>
            {me.ready ? "Ready, waiting for others" : "I've seen it, ready"}
          </Btn>
        ) : null}
        <p className="text-center text-sm text-black/60 [.dark_&]:text-white/70">
          {readyCount} of {inRound.length} ready
        </p>
        {isHost && (
          <Btn className="w-full" disabled={pending} onClick={() => act("startDiscuss")}>
            Start the discussion now
          </Btn>
        )}
      </Panel>
    </>
  );
}

function Discuss({ view, act, pending, serverNow, isHost, me, nameOf }: Ctx) {
  const d = view.discuss!;
  const card = view.card;
  const isWord = card && card.kind !== "spectator" ? card.mode === "word" : d.clueOrder.length > 0;
  const current = d.clueOrder[d.clueIndex];
  const allDone = isWord && d.clueIndex >= d.clueOrder.length;
  const canKnowIt = card?.kind === "impostor" && card.mode === "spyfall" && !me?.eliminated;

  return (
    <>
      <Panel className="space-y-3">
        <Timer endsAt={d.endsAt} serverNow={serverNow} label="Until the vote" />
        {d.lastEliminated && (
          <div className="rounded-2xl bg-white/20 px-3 py-2 text-center text-sm">
            <b>{nameOf(d.lastEliminated)}</b> was voted out and was <b>not</b> an impostor. Keep going.
          </div>
        )}
        {me?.eliminated && <div className="text-center text-sm text-black/60 [.dark_&]:text-white/70">You&apos;re out this round. You can still watch.</div>}
      </Panel>

      {card && (
        <Panel>
          <PeekCard card={card} compact />
        </Panel>
      )}

      <Panel className="space-y-3">
        {isWord ? (
          <>
            <SectionTitle sub="Out loud, in order: say one word related to the secret. Don't make it too obvious!">Clues</SectionTitle>
            <ol className="space-y-1.5">
              {d.clueOrder.map((id, i) => {
                const p = view.players.find((x) => x.id === id);
                const out = p?.eliminated;
                return (
                  <li
                    key={id}
                    className={twMerge(
                      "flex min-h-[40px] items-center justify-between rounded-2xl border px-3",
                      i === d.clueIndex ? "border-rose-300/70 bg-rose-600/85 font-bold text-white" : "border-white/30 bg-white/10",
                      (i < d.clueIndex || out) && "opacity-60",
                    )}
                  >
                    <span>
                      {i + 1}. {p?.name ?? "Someone"}
                      {id === view.meId && " (you)"}
                    </span>
                    <span className="text-xs">{out ? "out" : i < d.clueIndex ? "done" : i === d.clueIndex ? "now" : ""}</span>
                  </li>
                );
              })}
            </ol>
            {!allDone && current && (current === view.meId || isHost) && (
              <Btn tone="good" className="w-full" disabled={pending} onClick={() => act("clueDone", { who: current })}>
                {current === view.meId ? "I said my word" : `${nameOf(current)} said their word`}
              </Btn>
            )}
            {allDone && <p className="text-center text-sm">Everyone&apos;s given a clue. Discuss, then vote.</p>}
            {allDone && isHost && (
              <Btn className="w-full" disabled={pending} onClick={() => act("clueAgain")}>
                Another round of clues
              </Btn>
            )}
          </>
        ) : (
          <>
            <SectionTitle sub="Ask anyone a question about the location. Whoever answers asks the next one. Don't be too specific!">Questions</SectionTitle>
            <p className="text-center text-lg">
              <b>{d.firstAsker === view.meId ? "You ask" : `${nameOf(d.firstAsker)} asks`}</b> first.
            </p>
          </>
        )}
      </Panel>

      {(canKnowIt || isHost) && (
        <Panel className="space-y-2">
          {canKnowIt && (
            <Btn
              tone="bad"
              className="w-full"
              disabled={pending}
              onClick={() => window.confirm("Reveal yourself and guess the location? A wrong guess loses the round.") && act("knowIt")}
            >
              I know the location!
            </Btn>
          )}
          {isHost && (
            <Btn tone="primary" className="w-full" disabled={pending} onClick={() => act("callVote")}>
              Start the vote now
            </Btn>
          )}
        </Panel>
      )}
    </>
  );
}

function Vote({ view, act, pending, serverNow }: Ctx) {
  const v = view.vote!;
  const waiting = view.players.filter((p) => p.inRound && !p.eliminated && !p.voted);
  return (
    <>
      <Panel className="space-y-3">
        <Timer endsAt={v.endsAt} serverNow={serverNow} label={v.revote ? "Re-vote" : "Vote"} />
        <SectionTitle sub={v.revote ? "It was a tie. Vote again between these players only." : "Secret vote. Results show once everyone has voted."}>
          Who&apos;s the impostor?
        </SectionTitle>
        {v.canVote ? (
          <div className="grid gap-2">
            {v.candidates
              .filter((id) => id !== view.meId)
              .map((id) => {
                const chosen = v.myVote === id;
                return (
                  <Btn key={id} tone={chosen ? "bad" : "ghost"} big className="w-full justify-between" disabled={pending} onClick={() => act("vote", { target: id })}>
                    <span>{view.players.find((p) => p.id === id)?.name ?? "Someone"}</span>
                    <span className="text-sm">{chosen ? "Your vote" : ""}</span>
                  </Btn>
                );
              })}
          </div>
        ) : (
          <p className="text-center text-sm text-black/60 [.dark_&]:text-white/70">You&apos;re not voting this time. Sit tight.</p>
        )}
        {v.canVote && v.myVote && <p className="text-center text-xs text-black/60 [.dark_&]:text-white/70">You can change your vote until everyone is in.</p>}
      </Panel>
      <Panel className="text-center text-sm">
        <b>
          {v.votedCount} of {v.voterCount}
        </b>{" "}
        voted
        {waiting.length > 0 && <div className="mt-1 text-black/60 [.dark_&]:text-white/70">Waiting on {waiting.map((p) => p.name).join(", ")}</div>}
      </Panel>
    </>
  );
}

function Guess({ view, act, pending, serverNow, nameOf }: Ctx) {
  const g = view.guess!;
  const mine = g.by === view.meId;
  const what = view.card && view.card.kind !== "spectator" && view.card.mode === "word" ? "word" : "location";
  return (
    <Panel className="space-y-3">
      <Timer endsAt={g.endsAt} serverNow={serverNow} label="Last chance" />
      {mine ? (
        <>
          <SectionTitle sub={`Pick the secret ${what}. Get it right and you steal the round.`}>
            {g.reason === "caught" ? "You've been caught!" : "Call it!"}
          </SectionTitle>
          <div className="grid gap-2">
            {(g.options ?? []).map((o) => (
              <Btn key={o} big className="w-full" disabled={pending} onClick={() => window.confirm(`Final answer: ${o}?`) && act("guess", { pick: o })}>
                {o}
              </Btn>
            ))}
          </div>
        </>
      ) : (
        <SectionTitle sub={`They get one guess at the secret ${what}. If they're right, they steal the round.`}>
          {g.reason === "caught" ? `${nameOf(g.by)} was the impostor!` : `${nameOf(g.by)} says they're the impostor!`}
        </SectionTitle>
      )}
    </Panel>
  );
}

function Leaderboard({ view, deltas }: { view: RoomView; deltas?: Record<string, number> }) {
  const rows = [...view.players].sort((a, b) => b.score - a.score);
  return (
    <ol className="space-y-1.5">
      {rows.map((p, i) => (
        <li key={p.id} className="flex min-h-[40px] items-center justify-between rounded-2xl border border-white/30 bg-white/10 px-3">
          <span>
            <span className="mr-2 text-black/60 [.dark_&]:text-white/70">{i + 1}.</span>
            {p.name}
            {p.id === view.meId && <span className="text-black/60 [.dark_&]:text-white/70"> (you)</span>}
          </span>
          <span className="tabular-nums">
            {deltas?.[p.id] ? <span className="mr-2 text-sm font-semibold text-emerald-600 [.dark_&]:text-emerald-300">+{deltas[p.id]}</span> : null}
            <b>{p.score}</b>
          </span>
        </li>
      ))}
    </ol>
  );
}

function Results({ view, act, pending, isHost, nameOf }: Ctx) {
  const r = view.result;
  if (!r) return null;
  const last = view.roundNo >= view.totalRounds;
  const headline =
    r.outcome === "cancelled" ? "Round cancelled" : r.outcome === "innocents" ? "The innocents win!" : r.impostors.length > 1 ? "The impostors win!" : "The impostor wins!";
  const roles = Object.entries(r.roles);
  return (
    <>
      <Panel className="space-y-2 text-center">
        <div className={twMerge("text-3xl font-black", r.outcome === "impostors" && "text-rose-600 [.dark_&]:text-rose-300")}>{headline}</div>
        <p className="text-sm text-black/60 [.dark_&]:text-white/70">{r.reason}</p>
        <div className="rounded-2xl bg-gradient-to-br from-rose-600/85 to-rose-950/90 px-4 py-3 text-white">
          <div className="text-xs uppercase tracking-wider opacity-80">
            {r.mode === "spyfall" ? "The location was" : "The secret word was"} · {r.category}
          </div>
          <div className="text-2xl font-black">{r.secret}</div>
          <div className="mt-1 text-sm">
            Impostor{r.impostors.length > 1 ? "s" : ""}: <b>{r.impostors.map(nameOf).join(", ")}</b>
          </div>
        </div>
        {r.guess && (
          <p className="text-sm">
            {nameOf(r.guess.by)} guessed <b>{r.guess.pick ?? "nothing (time ran out)"}</b>: {r.guess.correct ? "correct!" : "wrong."}
          </p>
        )}
      </Panel>

      {r.tally.length > 0 && (
        <Panel>
          <SectionTitle>Final vote</SectionTitle>
          <ul className="mt-2 space-y-1 text-sm">
            {r.tally.map((t) => (
              <li key={t.id} className="flex justify-between">
                <span>
                  {nameOf(t.id)}
                  {r.impostors.includes(t.id) && " (impostor)"}
                </span>
                <span className="tabular-nums">
                  {t.votes} vote{t.votes === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
          {r.firstVoterId && <p className="mt-2 text-xs text-black/60 [.dark_&]:text-white/70">+1 bonus to {nameOf(r.firstVoterId)} for voting for the impostor first.</p>}
        </Panel>
      )}

      {roles.length > 0 && (
        <Panel>
          <details>
            <summary className="cursor-pointer font-semibold">Everyone&apos;s roles</summary>
            <ul className="mt-2 space-y-1 text-sm">
              {roles.map(([id, role]) => (
                <li key={id}>
                  {nameOf(id)}: {role}
                </li>
              ))}
            </ul>
          </details>
        </Panel>
      )}

      <Panel>
        <SectionTitle sub={`After round ${view.roundNo} of ${view.totalRounds}`}>Scores</SectionTitle>
        <div className="mt-2">
          <Leaderboard view={view} deltas={r.deltas} />
        </div>
      </Panel>

      {isHost ? (
        <div className="space-y-2">
          <Btn tone="bad" big className="w-full" disabled={pending} onClick={() => act("nextRound")}>
            {last ? "See final scores" : "Next round"}
          </Btn>
          {!last && (
            <Btn className="w-full" disabled={pending} onClick={() => window.confirm("End the game now?") && act("endGame")}>
              End game
            </Btn>
          )}
        </div>
      ) : (
        <Panel className="text-center text-sm text-black/60 [.dark_&]:text-white/70">Waiting for the host…</Panel>
      )}
    </>
  );
}

function Over({ view, act, pending, isHost }: Ctx) {
  const top = Math.max(0, ...view.players.map((p) => p.score));
  const winners = view.players.filter((p) => p.score === top && top > 0);
  return (
    <>
      <Panel className="text-center">
        <div className="text-sm uppercase tracking-wider text-black/60 [.dark_&]:text-white/70">Game over</div>
        <div className="mt-1 text-3xl font-black">{winners.length ? `${winners.map((w) => w.name).join(" & ")} win${winners.length === 1 ? "s" : ""}!` : "Thanks for playing!"}</div>
      </Panel>
      <Panel>
        <SectionTitle>Final scores</SectionTitle>
        <div className="mt-2">
          <Leaderboard view={view} />
        </div>
      </Panel>
      {isHost ? (
        <Btn tone="bad" big className="w-full" disabled={pending} onClick={() => act("newGame")}>
          New game
        </Btn>
      ) : (
        <Panel className="text-center text-sm text-black/60 [.dark_&]:text-white/70">The host can start a new game.</Panel>
      )}
    </>
  );
}
