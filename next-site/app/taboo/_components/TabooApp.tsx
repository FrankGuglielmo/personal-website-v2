"use client";

import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import type { CardResult, PlayedView, PublicCard, RoomView, TeamIdx } from "../_lib/types";
import { ROUND_OPTIONS } from "../_lib/types";
import { Btn, Panel, Segmented, inputCls } from "./ui";
import { beep, buzzAlert, keepAwake, timeUpAlert, unlockAudio } from "./feedback";
import { lastRoomCode, loadSession, useRoom } from "./useRoom";

type Send = (op: string, args?: Record<string, unknown>) => Promise<boolean>;

const TEAM_STYLE: Record<TeamIdx, { text: string; ring: string; dot: string }> = {
  0: { text: "text-blue-700 [.dark_&]:text-blue-300", ring: "ring-blue-500/60", dot: "bg-blue-500" },
  1: { text: "text-pink-700 [.dark_&]:text-pink-300", ring: "ring-pink-500/60", dot: "bg-pink-500" },
};

const RESULT_STYLE: Record<CardResult, { label: string; cls: string }> = {
  correct: { label: "Correct +1", cls: "bg-emerald-500/20 text-emerald-800 [.dark_&]:text-emerald-200 border-emerald-500/40" },
  skip: { label: "Skipped", cls: "bg-amber-500/20 text-amber-900 [.dark_&]:text-amber-200 border-amber-500/40" },
  buzz: { label: "Buzzed -1", cls: "bg-rose-500/20 text-rose-800 [.dark_&]:text-rose-200 border-rose-500/40" },
};

const muted = "text-[hsl(var(--color-muted))]";
const other = (t: TeamIdx): TeamIdx => (t === 0 ? 1 : 0);
const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

function useTicker(active: boolean, ms = 200) {
  const [, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setN((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [active, ms]);
}

export default function TabooApp() {
  const room = useRoom();
  const { session, view, resume } = room;
  const [initialCode, setInitialCode] = useState("");
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("room")?.toUpperCase() ?? "";
    setInitialCode(param);
    const code = param || lastRoomCode();
    const saved = code ? loadSession(code) : null;
    if (saved) resume(saved);
    setBooted(true);
  }, [resume]);

  useEffect(() => {
    const onDown = () => unlockAudio();
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  useEffect(() => (session ? keepAwake() : undefined), [session]);

  const prevRef = useRef<{ phase?: string; played: number }>({ played: 0 });
  useEffect(() => {
    if (!view) return;
    const prev = prevRef.current;
    const played = view.turn?.played ?? [];
    if (prev.phase === "active" && view.phase === "review") timeUpAlert();
    else if (view.phase === "active" && played.length > prev.played && played[played.length - 1]?.result === "buzz") buzzAlert();
    prevRef.current = { phase: view.phase, played: played.length };
  }, [view]);

  const inGame = !!view && view.phase !== "lobby";

  return (
    <main className={twMerge("mx-auto w-full max-w-xl px-4 pb-32 md:pb-12 md:pt-10", inGame ? "pt-3" : "pt-6")}>
      {inGame ? (
        <h1 className="sr-only">Forbidden Words</h1>
      ) : (
        <header className="mb-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Forbidden Words</h1>
          <p className={twMerge("text-sm", muted)}>A Taboo-style party game · one phone each</p>
        </header>
      )}

      {room.error && (
        <div role="alert" className="mb-3 flex items-start justify-between gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/15 px-4 py-3 text-sm">
          <span>{room.error}</span>
          <button type="button" className="font-semibold" onClick={() => room.setError(null)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}
      {room.offline && (
        <div role="status" className="mb-3 rounded-2xl border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-center text-sm">
          Reconnecting…
        </div>
      )}

      {!booted ? null : !session ? (
        <Home busy={room.busy} initialCode={initialCode} onCreate={(n) => room.enter("create", n)} onJoin={(n, c) => room.enter("join", n, c)} />
      ) : !view ? (
        <Panel className="text-center">
          <p>Connecting to room {session.code}…</p>
          <Btn className="mt-4" onClick={() => room.leaveLocal(session.code, null)}>
            Back
          </Btn>
        </Panel>
      ) : (
        <Game view={view} send={room.send} serverNow={room.serverNow} />
      )}
    </main>
  );
}

function Home({
  busy,
  initialCode,
  onCreate,
  onJoin,
}: {
  busy: boolean;
  initialCode: string;
  onCreate: (name: string) => void;
  onJoin: (name: string, code: string) => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  useEffect(() => {
    try {
      setName(localStorage.getItem("taboo:name") ?? "");
    } catch {}
  }, []);
  useEffect(() => setCode(initialCode), [initialCode]);
  const saveName = () => {
    try {
      localStorage.setItem("taboo:name", name.trim());
    } catch {}
  };
  const canJoin = code.length === 4 && name.trim().length > 0;

  return (
    <div className="space-y-4">
      <Panel>
        <label htmlFor="taboo-name" className="mb-1 block text-sm font-medium">
          Your name
        </label>
        <input
          id="taboo-name"
          className={inputCls}
          value={name}
          maxLength={20}
          autoComplete="nickname"
          placeholder="e.g. Aunt Linda"
          onChange={(e) => setName(e.target.value)}
        />
      </Panel>

      <Panel className="space-y-3">
        <h2 className="text-lg font-semibold">Join a room</h2>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canJoin) return;
            saveName();
            onJoin(name, code);
          }}
        >
          <input
            aria-label="Room code"
            className={twMerge(inputCls, "flex-1 text-center font-mono text-2xl uppercase tracking-[0.3em]")}
            value={code}
            placeholder="CODE"
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4))}
          />
          <Btn tone="primary" type="submit" disabled={!canJoin || busy}>
            Join
          </Btn>
        </form>
        {!name.trim() && code.length === 4 && <p className={twMerge("text-sm", muted)}>Enter your name first.</p>}
      </Panel>

      <Panel className="space-y-3 text-center">
        <p className={twMerge("text-sm", muted)}>Hosting? Make a room and share the code.</p>
        <Btn
          tone="good"
          big
          className="w-full"
          disabled={!name.trim() || busy}
          onClick={() => {
            saveName();
            onCreate(name);
          }}
        >
          Create a room
        </Btn>
      </Panel>

      <HowToPlay />
    </div>
  );
}

function HowToPlay() {
  return (
    <Panel>
      <details>
        <summary className="cursor-pointer font-semibold">How to play</summary>
        <ul className={twMerge("mt-2 list-disc space-y-1 pl-5 text-sm", muted)}>
          <li>Everyone joins on their own phone and picks a team (2+ per team).</li>
          <li>Each turn one player is the clue-giver: get your team to say the word without saying it or any of the 5 forbidden words.</li>
          <li>The clue-giver taps Correct or Skip. The other team sees the card too and taps Buzz on a slip (-1).</li>
          <li>Teams alternate, clue-givers rotate. First team to the target score wins.</li>
        </ul>
      </details>
    </Panel>
  );
}

function Game({ view, send, serverNow }: { view: RoomView; send: Send; serverNow: () => number }) {
  return (
    <div className="space-y-4">
      {view.phase !== "lobby" && <Scoreboard view={view} />}
      {view.phase === "lobby" && <Lobby view={view} send={send} />}
      {view.phase === "ready" && <Ready view={view} send={send} />}
      {view.phase === "active" && <Active view={view} send={send} serverNow={serverNow} />}
      {view.phase === "review" && <Review view={view} send={send} />}
      {view.phase === "over" && <Over view={view} send={send} />}
      <RoomFooter view={view} send={send} />
    </div>
  );
}

function Scoreboard({ view }: { view: RoomView }) {
  const target = view.settings.winMode === "score" ? `First to ${view.settings.target}` : `${view.settings.target} rounds`;
  return (
    <Panel className="p-3 sm:p-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
        {([0, 1] as TeamIdx[]).map((t) => (
          <div
            key={t}
            className={twMerge(
              "rounded-2xl px-2 py-1",
              t === 1 && "order-3",
              view.activeTeam === t && view.phase !== "over" && twMerge("ring-2", TEAM_STYLE[t].ring),
            )}
          >
            <div className={twMerge("truncate text-sm font-semibold", TEAM_STYLE[t].text)}>{view.teamNames[t]}</div>
            <div className="text-3xl font-bold tabular-nums">{view.scores[t]}</div>
          </div>
        ))}
        <div className={twMerge("order-2 text-xs", muted)}>
          {view.phase !== "over" && <div>Round {Math.min(view.turnsPlayed[0], view.turnsPlayed[1]) + 1}</div>}
          <div>{target}</div>
        </div>
      </div>
    </Panel>
  );
}

function Lobby({ view, send }: { view: RoomView; send: Send }) {
  const isHost = view.me.isHost;
  const [copied, setCopied] = useState(false);
  const counts = [0, 1].map((t) => view.players.filter((p) => p.team === t).length);
  const canStart = counts[0] >= 2 && counts[1] >= 2;
  const spectators = view.players.filter((p) => p.team === null);

  const share = async () => {
    const url = `${window.location.origin}/taboo?room=${view.code}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Forbidden Words", text: `Join my game, room ${view.code}`, url });
        return;
      }
    } catch {
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <>
      <Panel className="text-center">
        <div className={twMerge("text-sm", muted)}>Room code</div>
        <div className="font-mono text-5xl font-bold tracking-[0.25em]" aria-label={`Room code ${view.code.split("").join(" ")}`}>
          {view.code}
        </div>
        <p className={twMerge("mt-1 text-sm", muted)}>Others open frankguglielmo.com/taboo and enter this code.</p>
        <Btn className="mt-3" onClick={share}>
          {copied ? "Link copied" : "Share invite link"}
        </Btn>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        {([0, 1] as TeamIdx[]).map((t) => (
          <Panel key={t} className="space-y-2">
            <TeamName view={view} team={t} send={send} />
            <ul className="space-y-1">
              {view.players
                .filter((p) => p.team === t)
                .map((p) => (
                  <PlayerRow key={p.id} view={view} id={p.id} send={send} />
                ))}
              {counts[t] === 0 && <li className={twMerge("text-sm", muted)}>No one yet</li>}
            </ul>
            {view.me.team !== t && (
              <Btn className="w-full" onClick={() => send("setTeam", { team: t })}>
                Join {view.teamNames[t]}
              </Btn>
            )}
          </Panel>
        ))}
      </div>

      <Panel className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Spectators</h3>
          {view.me.team !== null && (
            <button type="button" className="text-sm underline" onClick={() => send("setTeam", { team: null })}>
              Just watch
            </button>
          )}
        </div>
        {spectators.length ? (
          <ul className="space-y-1">
            {spectators.map((p) => (
              <PlayerRow key={p.id} view={view} id={p.id} send={send} />
            ))}
          </ul>
        ) : (
          <p className={twMerge("text-sm", muted)}>Spectators see scores and the timer, not the cards.</p>
        )}
      </Panel>

      {isHost ? <HostSettings view={view} send={send} canStart={canStart} /> : (
        <Panel className="text-center">
          <p>Waiting for the host to start…</p>
          <p className={twMerge("mt-1 text-sm", muted)}>
            {view.settings.roundSec}s turns · skip {view.settings.skipPenalty ? "-1" : "free"} ·{" "}
            {view.settings.winMode === "score" ? `first to ${view.settings.target}` : `${view.settings.target} rounds`}
          </p>
        </Panel>
      )}
      <HowToPlay />
    </>
  );
}

function TeamName({ view, team, send }: { view: RoomView; team: TeamIdx; send: Send }) {
  const editable = view.me.isHost || view.me.team === team;
  const [value, setValue] = useState(view.teamNames[team]);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setValue(view.teamNames[team]);
  }, [view.teamNames, team, editing]);
  const commit = () => {
    setEditing(false);
    if (value.trim() && value.trim() !== view.teamNames[team]) send("setTeamName", { team, name: value });
  };
  if (!editable) return <h3 className={twMerge("text-lg font-bold", TEAM_STYLE[team].text)}>{view.teamNames[team]}</h3>;
  return (
    <input
      aria-label={`Team ${team === 0 ? "A" : "B"} name`}
      className={twMerge("w-full rounded-xl border border-transparent bg-transparent px-1 text-lg font-bold outline-none focus:border-white/40 focus:bg-white/20", TEAM_STYLE[team].text)}
      value={value}
      maxLength={20}
      onFocus={() => setEditing(true)}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
    />
  );
}

function PlayerRow({ view, id, send }: { view: RoomView; id: string; send: Send }) {
  const p = view.players.find((x) => x.id === id);
  if (!p) return null;
  const isMe = p.id === view.me.id;
  return (
    <li className="flex items-center justify-between gap-2 rounded-xl bg-white/10 px-3 py-2">
      <span className="flex min-w-0 items-center gap-2">
        <span className={twMerge("h-2 w-2 shrink-0 rounded-full", p.online ? "bg-emerald-500" : "bg-gray-400")} title={p.online ? "Online" : "Away"} />
        <span className="truncate">
          {p.name}
          {isMe && <span className={muted}> (you)</span>}
          {p.id === view.hostId && <span className={muted}> · host</span>}
        </span>
      </span>
      {view.me.isHost && !isMe && (
        <button
          type="button"
          className={twMerge("shrink-0 rounded-lg px-2 py-1 text-xs hover:bg-white/20", muted)}
          onClick={() => {
            if (window.confirm(`Remove ${p.name} from the room?`)) send("kick", { playerId: p.id });
          }}
        >
          Remove
        </button>
      )}
    </li>
  );
}

function HostSettings({ view, send, canStart }: { view: RoomView; send: Send; canStart: boolean }) {
  const s = view.settings;
  const set = (patch: Record<string, unknown>) => send("setSettings", patch);
  return (
    <Panel className="space-y-4">
      <h3 className="font-semibold">Game settings</h3>
      <Segmented
        label="Turn length"
        value={s.roundSec}
        options={ROUND_OPTIONS.map((v) => ({ value: v as number, label: `${v}s` }))}
        onChange={(v) => set({ roundSec: v })}
      />
      <Segmented
        label="Skip penalty"
        value={s.skipPenalty}
        options={[
          { value: 0 as const, label: "Free (0)" },
          { value: 1 as const, label: "-1 point" },
        ]}
        onChange={(v) => set({ skipPenalty: v })}
      />
      <Segmented
        label="Game ends"
        value={s.winMode}
        options={[
          { value: "score" as const, label: "Target score" },
          { value: "rounds" as const, label: "Rounds" },
        ]}
        onChange={(v) => set({ winMode: v, target: v === "score" ? 20 : 4 })}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm">{s.winMode === "score" ? "Points to win" : "Rounds (each team)"}</span>
        <div className="flex items-center gap-2">
          <Btn aria-label="Decrease" className="w-12" onClick={() => set({ target: s.target - (s.winMode === "score" ? 5 : 1) })}>
            −
          </Btn>
          <span className="w-10 text-center text-xl font-bold tabular-nums">{s.target}</span>
          <Btn aria-label="Increase" className="w-12" onClick={() => set({ target: s.target + (s.winMode === "score" ? 5 : 1) })}>
            +
          </Btn>
        </div>
      </div>
      <div className="flex gap-2">
        <Btn className="flex-1" onClick={() => send("shuffleTeams")}>
          Shuffle teams
        </Btn>
      </div>
      <Btn tone="good" big className="w-full" disabled={!canStart} onClick={() => send("start")}>
        Start game
      </Btn>
      {!canStart && <p className={twMerge("text-center text-sm", muted)}>Each team needs at least 2 players.</p>}
    </Panel>
  );
}

function nameOf(view: RoomView, id: string | null) {
  return view.players.find((p) => p.id === id)?.name ?? "someone";
}

function Ready({ view, send }: { view: RoomView; send: Send }) {
  const t = view.activeTeam;
  const isGiver = view.clueGiverId === view.me.id;
  const giver = nameOf(view, view.clueGiverId);
  const myRole =
    isGiver ? null : view.me.team === t ? "You're guessing this turn." : view.me.team === other(t) ? `You're watching: you'll see the card and can buzz ${giver} for slips.` : "You're spectating.";
  return (
    <>
      <Panel className="space-y-3 text-center">
        <div className={twMerge("text-sm font-semibold uppercase tracking-wide", TEAM_STYLE[t].text)}>{view.teamNames[t]}&apos;s turn</div>
        {isGiver ? (
          <>
            <h2 className="text-3xl font-bold">You&apos;re the clue-giver!</h2>
            <p className={muted}>Keep your screen hidden from your team. When everyone&apos;s ready, start the timer.</p>
            <Btn tone="good" big className="w-full" onClick={() => send("beginTurn")}>
              Start {view.settings.roundSec}s turn
            </Btn>
          </>
        ) : view.clueGiverId ? (
          <>
            <h2 className="text-2xl font-bold">
              Ready, {view.teamNames[t]}? Clue-giver: {giver}
            </h2>
            <p className={muted}>{myRole}</p>
            <p className={twMerge("text-sm", muted)}>Waiting for {giver} to start…</p>
            {view.me.isHost && (
              <Btn className="w-full" onClick={() => send("beginTurn")}>
                Start for {giver}
              </Btn>
            )}
          </>
        ) : (
          <p>{view.teamNames[t]} has no players. Ask someone to join this team.</p>
        )}
      </Panel>
      {view.lastTurn && <LastTurn view={view} />}
    </>
  );
}

function LastTurn({ view }: { view: RoomView }) {
  const lt = view.lastTurn!;
  return (
    <Panel className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold">
          Last turn: {view.teamNames[lt.team]} ({lt.clueGiverName})
        </h3>
        <span className="text-lg font-bold tabular-nums">{signed(lt.delta)}</span>
      </div>
      <PlayedList played={lt.played} />
    </Panel>
  );
}

function PlayedList({ played, onToggle }: { played: PlayedView[]; onToggle?: (i: number) => void }) {
  if (!played.length) return <p className={twMerge("text-sm", muted)}>No cards played.</p>;
  return (
    <ul className="space-y-1">
      {played.map((p, i) => {
        const r = RESULT_STYLE[p.result];
        const content = (
          <>
            <span className="truncate font-medium">{p.word ?? "Hidden"}</span>
            <span className={twMerge("shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold", r.cls)}>{r.label}</span>
          </>
        );
        return (
          <li key={`${p.cardId}-${i}`}>
            {onToggle ? (
              <button
                type="button"
                onClick={() => onToggle(i)}
                className="flex min-h-[48px] w-full items-center justify-between gap-2 rounded-xl bg-white/10 px-3 py-2 text-left hover:bg-white/20"
                aria-label={`${p.word}: ${r.label}. Tap to change.`}
              >
                {content}
              </button>
            ) : (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-white/10 px-3 py-2">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function TimerBar({ remainingMs, totalMs, paused }: { remainingMs: number; totalMs: number; paused: boolean }) {
  const secs = Math.ceil(remainingMs / 1000);
  const pct = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
  const color = secs <= 5 ? "bg-rose-500" : secs <= 10 ? "bg-amber-500" : "bg-emerald-500";
  const announce = paused ? "Paused" : secs === 0 ? "Time's up" : secs <= 10 || secs % 15 === 0 ? `${secs} seconds left` : "";
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className={twMerge("text-5xl font-bold tabular-nums", secs <= 5 && !paused && "text-rose-600 [.dark_&]:text-rose-400")}>
          {paused ? "II" : secs === 0 ? "0" : `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`}
        </span>
        <span className={twMerge("text-sm", muted)}>{paused ? "Paused" : secs === 0 ? "Time's up!" : "remaining"}</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/10 [.dark_&]:bg-white/10">
        <div className={twMerge("h-full rounded-full transition-[width] duration-200 ease-linear", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}

function CardView({ card }: { card: PublicCard }) {
  return (
    <div className="rounded-3xl border border-white/50 bg-white/75 p-4 text-center text-black shadow-lg [.dark_&]:border-white/25 [.dark_&]:bg-black/45 [.dark_&]:text-white sm:p-5">
      <div className="break-words text-4xl font-extrabold leading-tight sm:text-5xl">{card.word}</div>
      <div className="my-3 h-px bg-rose-500/40" />
      <div className="text-xs font-semibold uppercase tracking-widest text-rose-600 [.dark_&]:text-rose-400">Don&apos;t say</div>
      <ul className="mt-1 space-y-0.5">
        {card.taboo.map((w) => (
          <li key={w} className="text-xl font-semibold capitalize sm:text-2xl">
            {w}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Active({ view, send, serverNow }: { view: RoomView; send: Send; serverNow: () => number }) {
  useTicker(true);
  const turn = view.turn!;
  const [pending, setPending] = useState(false);
  const paused = turn.endsAt == null;
  const remaining = paused ? turn.pausedRemainingMs ?? 0 : Math.max(0, turn.endsAt! - serverNow());
  const over = !paused && remaining <= 0;
  const secs = Math.ceil(remaining / 1000);
  const lastTickRef = useRef<number | null>(null);
  useEffect(() => {
    if (!paused && secs > 0 && secs <= 5 && lastTickRef.current !== secs) beep(1000, 60, 0.08);
    lastTickRef.current = secs;
  }, [secs, paused]);

  const isGiver = view.clueGiverId === view.me.id;
  const t = view.activeTeam;
  const isWatcher = view.me.team === other(t);
  const giver = nameOf(view, view.clueGiverId);
  const card = turn.card;
  const act = async (op: string) => {
    if (pending) return;
    setPending(true);
    await send(op, { cardId: card?.id });
    setPending(false);
  };
  const correct = turn.played.filter((p) => p.result === "correct").length;
  const canControl = isGiver || view.me.isHost;

  return (
    <>
      <Panel className="space-y-1">
        <TimerBar remainingMs={remaining} totalMs={view.settings.roundSec * 1000} paused={paused} />
        <div className={twMerge("flex justify-between text-sm", muted)}>
          <span>
            {view.teamNames[t]} · {giver} giving clues
          </span>
          <span className="font-semibold tabular-nums">This turn {signed(turn.delta)}</span>
        </div>
      </Panel>

      {turn.canSeeCard && card ? (
        <>
          <CardView card={card} />
          {isGiver ? (
            <div className="grid grid-cols-2 gap-3">
              <Btn tone="warn" big disabled={pending || over || paused} onClick={() => act("skip")}>
                Skip{view.settings.skipPenalty ? " −1" : ""}
              </Btn>
              <Btn tone="good" big disabled={pending || over || paused} onClick={() => act("correct")}>
                Correct +1
              </Btn>
              <Btn tone="bad" disabled={pending || over || paused} onClick={() => act("buzz")}>
                I slipped (−1)
              </Btn>
              <Btn disabled={pending || over || paused || turn.played.length === 0} onClick={() => send("undo")}>
                Undo
              </Btn>
            </div>
          ) : (
            <Btn tone="bad" big className="min-h-[96px] w-full text-3xl" disabled={pending || over || paused} onClick={() => act("buzz")}>
              BUZZ!
            </Btn>
          )}
          {isWatcher && <p className="text-center text-sm font-medium opacity-90">Tap Buzz if {giver} says the word or a forbidden word.</p>}
        </>
      ) : (
        <Panel className="py-10 text-center">
          {view.me.team === t ? (
            <>
              <div className="text-5xl font-extrabold">Guess!</div>
              <p className={twMerge("mt-2", muted)}>Listen to {giver} and shout your guesses.</p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">{view.teamNames[t]} is guessing</div>
              <p className={twMerge("mt-2", muted)}>Spectators don&apos;t see the card.</p>
            </>
          )}
          <div className="mt-4 text-lg">
            <span className="font-bold tabular-nums">{correct}</span> correct so far
          </div>
        </Panel>
      )}

      {turn.canSeeCard && turn.played.length > 0 && (
        <Panel>
          <h3 className="mb-2 text-sm font-semibold">This turn</h3>
          <PlayedList played={turn.played.slice().reverse()} />
        </Panel>
      )}

      {canControl && !over && (
        <Btn className="w-full" onClick={() => send(paused ? "resume" : "pause")}>
          {paused ? "Resume timer" : "Pause"}
        </Btn>
      )}
    </>
  );
}

function Review({ view, send }: { view: RoomView; send: Send }) {
  const turn = view.turn;
  const canEdit = view.me.isHost || view.clueGiverId === view.me.id;
  const giver = nameOf(view, view.clueGiverId);
  return (
    <Panel className="space-y-3">
      <div className="text-center">
        <div className="text-sm font-semibold uppercase tracking-wide text-rose-600 [.dark_&]:text-rose-400">Time&apos;s up!</div>
        <h2 className="text-2xl font-bold">
          {view.teamNames[view.activeTeam]}: {signed(turn?.delta ?? 0)}
        </h2>
        <p className={twMerge("text-sm", muted)}>
          {canEdit ? "Tap a card to fix a result if there's a dispute, then confirm." : `Waiting for ${giver} or the host to confirm.`}
        </p>
      </div>
      <PlayedList played={turn?.played ?? []} onToggle={canEdit ? (i) => send("toggleResult", { index: i }) : undefined} />
      {canEdit && (
        <Btn tone="primary" big className="w-full" onClick={() => send("confirmReview")}>
          Confirm & continue
        </Btn>
      )}
    </Panel>
  );
}

function Over({ view, send }: { view: RoomView; send: Send }) {
  const w = view.winner;
  return (
    <>
      <Panel className="space-y-3 py-8 text-center">
        <div className="text-5xl" aria-hidden>
          🏆
        </div>
        <h2 className="text-3xl font-bold">
          {w === "tie" || w === null ? "It's a tie!" : <span className={TEAM_STYLE[w].text}>{view.teamNames[w]} wins!</span>}
        </h2>
        <p className="text-xl tabular-nums">
          {view.scores[0]} – {view.scores[1]}
        </p>
        {view.me.isHost ? (
          <Btn tone="good" big className="w-full" onClick={() => send("newGame")}>
            New game (same room)
          </Btn>
        ) : (
          <p className={muted}>The host can start a new game in this room.</p>
        )}
      </Panel>
      {view.lastTurn && <LastTurn view={view} />}
    </>
  );
}

function RoomFooter({ view, send }: { view: RoomView; send: Send }) {
  const inGame = view.phase === "ready" || view.phase === "active" || view.phase === "review";
  const myTeam = view.me.team;
  return (
    <Panel className="space-y-3 p-3 sm:p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          Room <span className="font-mono font-bold tracking-widest">{view.code}</span> · {view.me.name}
          {myTeam !== null ? <span className={TEAM_STYLE[myTeam].text}> · {view.teamNames[myTeam]}</span> : <span className={muted}> · spectating</span>}
          {view.me.isHost && <span className={muted}> · host</span>}
        </span>
        <button
          type="button"
          className={twMerge("rounded-lg px-2 py-1 underline", muted)}
          onClick={() => {
            if (window.confirm("Leave this room?")) send("leave");
          }}
        >
          Leave
        </button>
      </div>
      {inGame && view.phase !== "active" && myTeam !== null && view.me.id !== view.clueGiverId && (
        <button type="button" className={twMerge("text-sm underline", muted)} onClick={() => send("setTeam", { team: other(myTeam) })}>
          Switch to {view.teamNames[other(myTeam)]}
        </button>
      )}
      {inGame && myTeam === null && view.phase !== "active" && (
        <div className="flex gap-2">
          {([0, 1] as TeamIdx[]).map((t) => (
            <Btn key={t} className="flex-1 text-sm" onClick={() => send("setTeam", { team: t })}>
              Join {view.teamNames[t]}
            </Btn>
          ))}
        </div>
      )}
      {!view.me.isHost && view.hostAway && (
        <Btn className="w-full text-sm" onClick={() => send("claimHost")}>
          Host seems away: become host
        </Btn>
      )}
      {view.me.isHost && inGame && (
        <button
          type="button"
          className={twMerge("text-sm underline", muted)}
          onClick={() => {
            if (window.confirm("End the game now? The team in the lead wins.")) send("endGame");
          }}
        >
          End game
        </button>
      )}
    </Panel>
  );
}
