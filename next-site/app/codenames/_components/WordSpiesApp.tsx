"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";
import ThemeToggle from "@/components/ThemeToggle";
import { PACKS, TEAMS, TEAM_LABEL, type GameEvent, type PlayerView, type RoomView, type Team } from "../_lib/types";
import Board from "./Board";
import { Btn, Panel, inputCls, muted, teamChip, teamText } from "./ui";
import { lastRoomCode, loadSession, useRoom, useWakeLock } from "./useRoom";

type Room = ReturnType<typeof useRoom>;
type Send = Room["send"];

const NAME_KEY = "codenames:name";
const otherTeam = (t: Team): Team => (t === "blue" ? "red" : "blue");

export default function WordSpiesApp() {
  const room = useRoom();
  const { session, view, error, setError, offline, resume } = room;
  const [mounted, setMounted] = useState(false);
  const [prefillCode, setPrefillCode] = useState("");

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("room")?.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
    const code = fromUrl || lastRoomCode();
    const saved = code ? loadSession(code) : null;
    if (saved) resume(saved);
    else if (fromUrl) setPrefillCode(fromUrl);
    setMounted(true);
  }, [resume]);

  useWakeLock(!!session);

  let content: ReactNode = null;
  if (!mounted) content = null;
  else if (!session) content = <Home room={room} prefillCode={prefillCode} />;
  else if (!view) content = <Centered><p className={muted}>Connecting…</p></Centered>;
  else if (view.me.role === "board") content = view.phase === "lobby" ? <BoardLobby view={view} send={room.send} room={room} /> : <BoardGame view={view} send={room.send} room={room} />;
  else content = view.phase === "lobby" ? <PlayerLobby view={view} send={room.send} /> : <PhoneGame view={view} send={room.send} />;

  return (
    <Shell>
      {content}
      {(error || offline) && (
        <div className="pointer-events-none fixed inset-x-0 bottom-3 z-20 flex justify-center px-3" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div role="alert" className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-neutral-900/90 px-4 py-3 text-sm text-white shadow-lg">
            <span>{error ?? "Reconnecting…"}</span>
            {error && (
              <button type="button" className="font-semibold underline" onClick={() => setError(null)}>
                OK
              </button>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}

// Portaled to <body> because the root layout's `.site-content` wrapper is its own
// stacking context, which would keep this overlay under the fixed site sidebar.
function Shell({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => setTarget(document.body), []);
  if (!target) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex flex-col overflow-y-auto text-[hsl(var(--color-text))]"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-[url('/images/lightmode-background.webp')] [.dark_&]:bg-[url('/images/darkmode-background.webp')]"
      />
      {children}
    </div>,
    target,
  );
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 items-center justify-center p-6">{children}</div>;
}

function Title({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={twMerge("whitespace-nowrap font-black tracking-tight", small ? "text-lg" : "text-4xl sm:text-5xl")}>
        Word <span className="text-blue-600 [.dark_&]:text-blue-400">Sp</span>
        <span className="text-rose-600 [.dark_&]:text-rose-400">ies</span>
      </span>
    </div>
  );
}

// ---------------- Home ----------------

function Home({ room, prefillCode }: { room: Room; prefillCode: string }) {
  const [code, setCode] = useState(prefillCode);
  const [name, setName] = useState("");
  useEffect(() => {
    try {
      setName(localStorage.getItem(NAME_KEY) ?? "");
    } catch {}
  }, []);
  useEffect(() => setCode(prefillCode), [prefillCode]);

  const join = () => {
    try {
      localStorage.setItem(NAME_KEY, name.trim());
    } catch {}
    void room.enter("join", name, code);
  };

  const joinPanel = (
    <Panel className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">Join from your phone</h2>
      <p className={twMerge("text-sm", muted)}>Use the 4-letter code shown on the TV.</p>
      <input
        className={twMerge(inputCls, "text-center text-2xl font-bold uppercase tracking-[0.4em]")}
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4))}
        placeholder="CODE"
        aria-label="Room code"
        autoCapitalize="characters"
        autoComplete="off"
        inputMode="text"
      />
      <input
        className={inputCls}
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 20))}
        placeholder="Your name"
        aria-label="Your name"
        autoComplete="nickname"
        onKeyDown={(e) => e.key === "Enter" && code.length === 4 && name.trim() && join()}
      />
      <Btn tone="primary" big disabled={room.busy || code.length !== 4 || !name.trim()} onClick={join}>
        Join game
      </Btn>
    </Panel>
  );

  const boardPanel = (
    <Panel className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">Put the board on the TV</h2>
      <p className={twMerge("text-sm", muted)}>
        Open this on the phone or laptop you&apos;ll cast to the TV. That device shows the board and taps the cards
        the teams pick. It never shows the secret key.
      </p>
      <Btn tone={prefillCode ? "ghost" : "primary"} big disabled={room.busy} onClick={() => void room.enter("create")}>
        Start a TV board
      </Btn>
    </Panel>
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <Title />
        <ThemeToggle />
      </div>
      <p className={twMerge("-mt-2", muted)}>
        A team word-guessing game. One screen on the TV, spymasters on their phones.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {prefillCode ? (
          <>
            {joinPanel}
            {boardPanel}
          </>
        ) : (
          <>
            {boardPanel}
            {joinPanel}
          </>
        )}
      </div>
      <Panel>
        <details>
          <summary className="cursor-pointer font-semibold">How to play</summary>
          <ul className={twMerge("mt-3 list-disc space-y-1.5 pl-5 text-sm", muted)}>
            <li>Split into Blue and Red. Each team picks one spymaster, who joins on their phone to see the secret key.</li>
            <li>The spymaster says one word and a number out loud, like &ldquo;Ocean, 2&rdquo;. The word links some of their team&apos;s cards.</li>
            <li>Their team says a guess out loud, and whoever holds the TV board taps it to reveal its color.</li>
            <li>Your own agent: keep guessing. A bystander or the other team&apos;s agent ends your turn.</li>
            <li>Find all your agents first to win. Reveal the assassin and you lose on the spot.</li>
          </ul>
        </details>
      </Panel>
    </main>
  );
}

// ---------------- Shared bits ----------------

function joinUrl() {
  if (typeof window === "undefined") return "/codenames";
  return `${window.location.host}/codenames`;
}

function TurnPill({ view, big = false }: { view: RoomView; big?: boolean }) {
  if (view.phase === "over" && view.winner) {
    return (
      <span className={twMerge("rounded-full px-4 py-1.5 font-bold shadow", teamChip[view.winner], big && "text-lg")}>
        {TEAM_LABEL[view.winner]} wins!
      </span>
    );
  }
  if (!view.turn) return null;
  return (
    <span className={twMerge("rounded-full px-4 py-1.5 font-bold shadow", teamChip[view.turn], big && "text-lg")}>
      {TEAM_LABEL[view.turn]}&apos;s turn
    </span>
  );
}

function Score({ view, team, big = false }: { view: RoomView; team: Team; big?: boolean }) {
  const left = view.remaining?.[team] ?? 0;
  return (
    <div className={twMerge("glass flex items-center gap-2 rounded-2xl border px-3 py-1.5", big && "px-4 py-2")}>
      <span className={twMerge("h-3 w-3 rounded-full", team === "blue" ? "bg-blue-600" : "bg-rose-600")} aria-hidden />
      <span className={twMerge("font-black tabular-nums", teamText[team], big ? "text-3xl" : "text-xl")}>{left}</span>
      <span className={twMerge("text-xs leading-tight", muted)}>
        {TEAM_LABEL[team]}
        <br />
        left
      </span>
    </div>
  );
}

function endText(view: RoomView) {
  if (!view.winner) return "";
  const loser = otherTeam(view.winner);
  return view.endReason === "assassin"
    ? `${TEAM_LABEL[loser]} found the assassin.`
    : `${TEAM_LABEL[view.winner]} found all their agents.`;
}

function eventText(e: GameEvent, view: RoomView): string | null {
  if (view.winner) return null;
  if (e.kind === "undo") return "Undone";
  if (e.kind === "pass") return `${TEAM_LABEL[e.team]} ends their turn. ${TEAM_LABEL[otherTeam(e.team)]}'s turn.`;
  if (e.color === e.team) return `${TEAM_LABEL[e.team]} agent! Keep guessing.`;
  if (e.color === "neutral") return `Bystander. ${TEAM_LABEL[otherTeam(e.team)]}'s turn.`;
  if (e.color === "assassin") return "The assassin!";
  return `${TEAM_LABEL[e.color]} agent! ${TEAM_LABEL[otherTeam(e.team)]}'s turn.`;
}

/** Shows a short announcement whenever the server reports a new game event. */
function EventToast({ view, big = false }: { view: RoomView; big?: boolean }) {
  const seenRef = useRef<number | null>(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  const [text, setText] = useState<string | null>(null);
  const seq = view.lastEvent?.seq ?? 0;
  useEffect(() => {
    const first = seenRef.current === null;
    const fresh = !first && seq > seenRef.current!;
    seenRef.current = seq;
    if (!fresh) return;
    const v = viewRef.current;
    const t = v.lastEvent ? eventText(v.lastEvent, v) : null;
    setText(t);
    if (!t) return;
    try {
      if (v.me.role !== "board") navigator.vibrate?.(60);
    } catch {}
    const id = window.setTimeout(() => setText(null), 2600);
    return () => window.clearTimeout(id);
  }, [seq]);
  if (!text) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-30 flex justify-center px-4" aria-live="polite">
      <div className={twMerge("rounded-3xl bg-neutral-900/85 px-6 py-4 text-center font-bold text-white shadow-2xl backdrop-blur", big ? "text-3xl" : "text-xl")}>
        {text}
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-3 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal aria-label={title} className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <Panel className="max-h-[85dvh] overflow-y-auto">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{title}</h2>
            <Btn onClick={onClose}>Done</Btn>
          </div>
          {children}
        </Panel>
      </div>
    </div>
  );
}

// ---------------- Players (team columns + host controls) ----------------

const seatValue = (p: PlayerView) => (p.team ? `${p.team}:${p.role}` : "none");

function PlayerRow({ p, view, send }: { p: PlayerView; view: RoomView; send: Send }) {
  const isBoard = view.me.role === "board";
  return (
    <li className="flex items-center gap-2 py-1">
      <span className={twMerge("h-2 w-2 shrink-0 rounded-full", p.online ? "bg-emerald-500" : "bg-neutral-400")} aria-label={p.online ? "online" : "offline"} />
      <span className="min-w-[3.5rem] flex-1 truncate font-medium">
        {p.name}
        {p.id === view.me.id && <span className={muted}> (you)</span>}
      </span>
      {p.role === "spymaster" && !isBoard && <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-semibold [.dark_&]:bg-white/15">Spymaster</span>}
      {isBoard && (
        <select
          aria-label={`Seat for ${p.name}`}
          className="min-w-0 max-w-[9.5rem] rounded-xl border border-white/40 bg-white/60 px-1.5 py-1 text-sm text-black [.dark_&]:bg-white/15 [.dark_&]:text-white"
          value={seatValue(p)}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "kick") {
              if (window.confirm(`Remove ${p.name} from the room?`)) void send("kick", { playerId: p.id });
              return;
            }
            const [team, role] = v === "none" ? [null, "operative"] : v.split(":");
            void send("setPlayer", { playerId: p.id, team, role });
          }}
        >
          <option value="blue:spymaster">Blue spymaster</option>
          <option value="blue:operative">Blue operative</option>
          <option value="red:spymaster">Red spymaster</option>
          <option value="red:operative">Red operative</option>
          <option value="none">No team</option>
          <option value="kick">Remove…</option>
        </select>
      )}
    </li>
  );
}

function TeamColumns({ view, send }: { view: RoomView; send: Send }) {
  const people = view.players.filter((p) => p.role !== "board");
  const unassigned = people.filter((p) => !p.team);
  const order = (a: PlayerView, b: PlayerView) => (a.role === "spymaster" ? -1 : b.role === "spymaster" ? 1 : 0);
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-3">
        {TEAMS.map((t) => {
          const members = people.filter((p) => p.team === t).sort(order);
          const hasSpy = members.some((p) => p.role === "spymaster");
          return (
            <div key={t} className={twMerge("min-w-0 rounded-2xl border p-3", t === "blue" ? "border-blue-500/50 bg-blue-500/10" : "border-rose-500/50 bg-rose-500/10")}>
              <div className={twMerge("mb-1 flex items-baseline justify-between font-bold", teamText[t])}>
                <span>{TEAM_LABEL[t]}</span>
                <span className="text-xs font-medium">{members.length}</span>
              </div>
              {!hasSpy && <p className={twMerge("text-xs", muted)}>Needs a spymaster</p>}
              <ul>{members.map((p) => <PlayerRow key={p.id} p={p} view={view} send={send} />)}</ul>
            </div>
          );
        })}
      </div>
      {unassigned.length > 0 && (
        <div className="rounded-2xl border border-white/30 p-3">
          <div className={twMerge("mb-1 text-sm font-semibold", muted)}>Still choosing</div>
          <ul>{unassigned.map((p) => <PlayerRow key={p.id} p={p} view={view} send={send} />)}</ul>
        </div>
      )}
    </div>
  );
}

// ---------------- TV board: lobby ----------------

function BoardLobby({ view, send, room }: { view: RoomView; send: Send; room: Room }) {
  const [host, setHost] = useState("/codenames");
  useEffect(() => setHost(joinUrl()), []);
  const missing = TEAMS.filter((t) => !view.players.some((p) => p.team === t && p.role === "spymaster"));
  return (
    <main className="mx-auto grid w-full min-w-0 max-w-6xl flex-1 grid-cols-[minmax(0,1fr)] content-center gap-4 p-3 sm:p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] landscape:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <Panel className="flex min-w-0 flex-col items-center justify-center gap-3 text-center">
        <div className="flex w-full items-center justify-between">
          <Title small />
          <ThemeToggle />
        </div>
        <p className={muted}>On your phone, go to</p>
        <p className="max-w-full break-all text-lg font-bold sm:text-2xl">{host}</p>
        <p className={muted}>and enter the code</p>
        <p className="font-mono text-[clamp(3rem,12vmin,7rem)] font-black leading-none tracking-[0.25em]">{view.code}</p>
        <p className={twMerge("text-sm", muted)}>Spymasters must join. Everyone else can join or just watch the TV.</p>
      </Panel>
      <Panel className="flex min-w-0 flex-col gap-4">
        <TeamColumns view={view} send={send} />
        <div>
          <div className={twMerge("mb-1 text-sm", muted)}>Word pack</div>
          <div role="radiogroup" aria-label="Word pack" className="flex flex-wrap gap-1 rounded-2xl border border-white/30 bg-white/10 p-1">
            {PACKS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={view.pack === p.id}
                onClick={() => void send("setPack", { pack: p.id })}
                className={twMerge(
                  "min-h-[40px] flex-1 rounded-xl px-3 text-sm font-medium transition",
                  view.pack === p.id ? "bg-white/70 text-black shadow [.dark_&]:bg-white/25 [.dark_&]:text-white" : "hover:bg-white/20",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <Btn tone="primary" big disabled={missing.length > 0} onClick={() => void send("start")}>
          {missing.length ? `Waiting for ${missing.map((t) => TEAM_LABEL[t]).join(" and ")} spymaster` : "Start game"}
        </Btn>
        <button
          type="button"
          className={twMerge("self-center text-sm underline", muted)}
          onClick={() => window.confirm("Close this board? Players can make another device the board.") && room.leaveLocal(view.code, null)}
        >
          Close this board
        </button>
      </Panel>
    </main>
  );
}

// ---------------- TV board: game ----------------

function BoardGame({ view, send, room }: { view: RoomView; send: Send; room: Room }) {
  const [menu, setMenu] = useState(false);
  const [players, setPlayers] = useState(false);
  const cards = view.cards ?? [];
  const sel = view.selected;
  const over = view.phase === "over";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 sm:gap-3 sm:p-3">
      <EventToast view={view} big />
      <header className="flex items-center gap-2">
        <Score view={view} team="blue" />
        <div className="flex flex-1 flex-col items-center justify-center gap-0.5 text-center">
          <TurnPill view={view} big />
        </div>
        <Score view={view} team="red" />
      </header>

      <div className="relative min-h-0 flex-1">
        <Board
          cards={cards}
          mode="board"
          fill
          selected={sel}
          onTap={over ? undefined : (i) => void send("select", { index: i })}
        />
      </div>

      <footer className="flex flex-wrap items-center gap-2">
        {over ? (
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <span className="text-lg font-bold">{endText(view)}</span>
            <Btn tone="primary" onClick={() => void send("newGame")}>New game</Btn>
          </div>
        ) : sel !== null && cards[sel] ? (
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <Btn tone="good" className="min-w-[10rem]" onClick={() => void send("reveal", { index: sel })}>
              Reveal &ldquo;{cards[sel].word}&rdquo;
            </Btn>
            <Btn onClick={() => void send("select", { index: null })}>Cancel</Btn>
          </div>
        ) : (
          <p className={twMerge("min-w-[14rem] flex-1 text-sm", muted)}>
            Tap the word {view.turn ? TEAM_LABEL[view.turn] : "the team"} picks. Join code <b className="font-mono tracking-widest">{view.code}</b>
          </p>
        )}
        <div className="flex items-center gap-2">
          <Btn disabled={!view.canUndo} onClick={() => void send("undo")}>Undo</Btn>
          {!over && view.turn && (
            <Btn tone={view.turn} onClick={() => void send("endTurn")}>
              End {TEAM_LABEL[view.turn]}&apos;s turn
            </Btn>
          )}
          <div className="relative">
            <Btn aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
              Menu
            </Btn>
            {menu && (
              <div role="menu" className="glass absolute bottom-full right-0 z-30 mb-2 flex w-56 flex-col gap-1 rounded-2xl border p-2 shadow-xl">
                <MenuItem onClick={() => { setMenu(false); setPlayers(true); }}>Players &amp; roles</MenuItem>
                <MenuItem onClick={() => { setMenu(false); if (over || window.confirm("Deal a new board? This game will end.")) void send("newGame"); }}>New game</MenuItem>
                <MenuItem onClick={() => { setMenu(false); if (window.confirm("Back to the lobby? This game will end.")) void send("toLobby"); }}>Back to lobby</MenuItem>
                <div className="flex items-center justify-between px-3 py-1">
                  <span className="text-sm">Theme</span>
                  <ThemeToggle />
                </div>
                <MenuItem onClick={() => { setMenu(false); if (window.confirm("Close this board? Players can make another device the board.")) room.leaveLocal(view.code, null); }}>
                  Close this board
                </MenuItem>
              </div>
            )}
          </div>
        </div>
      </footer>

      {players && (
        <Modal title={`Players · room ${view.code}`} onClose={() => setPlayers(false)}>
          <TeamColumns view={view} send={send} />
        </Modal>
      )}
    </div>
  );
}

function MenuItem({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className="min-h-[44px] rounded-xl px-3 text-left text-sm font-medium hover:bg-white/30">
      {children}
    </button>
  );
}

// ---------------- Phones ----------------

function RolePicker({ view, send }: { view: RoomView; send: Send }) {
  const me = view.me;
  const spyOf = (t: Team) => view.players.find((p) => p.team === t && p.role === "spymaster");
  return (
    <div className="grid grid-cols-2 gap-3">
      {TEAMS.map((t) => {
        const spy = spyOf(t);
        const ops = view.players.filter((p) => p.team === t && p.role === "operative");
        const iAmSpy = me.team === t && me.role === "spymaster";
        const iAmOp = me.team === t && me.role === "operative";
        const takenByOther = !!spy && spy.id !== me.id && spy.online;
        return (
          <div key={t} className={twMerge("flex flex-col gap-2 rounded-2xl border p-3", t === "blue" ? "border-blue-500/50 bg-blue-500/10" : "border-rose-500/50 bg-rose-500/10")}>
            <div className={twMerge("text-lg font-bold", teamText[t])}>{TEAM_LABEL[t]}</div>
            <button
              type="button"
              aria-pressed={iAmSpy}
              disabled={takenByOther}
              onClick={() => void send("setPlayer", { team: t, role: "spymaster" })}
              className={twMerge(
                "min-h-[64px] rounded-2xl border px-3 py-2 text-left transition disabled:opacity-60",
                iAmSpy ? twMerge(teamChip[t], "border-transparent shadow-lg") : "glass border-white/40",
              )}
            >
              <div className="font-bold">Spymaster</div>
              <div className="text-xs opacity-80">{spy ? (spy.id === me.id ? "That's you" : spy.name) : "Sees the key"}</div>
            </button>
            <button
              type="button"
              aria-pressed={iAmOp}
              onClick={() => void send("setPlayer", { team: t, role: "operative" })}
              className={twMerge(
                "min-h-[64px] rounded-2xl border px-3 py-2 text-left transition",
                iAmOp ? twMerge(teamChip[t], "border-transparent shadow-lg") : "glass border-white/40",
              )}
            >
              <div className="font-bold">Operative</div>
              <div className="text-xs opacity-80">{ops.length ? ops.map((p) => p.name).join(", ") : "Guesses"}</div>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function PhoneHeader({ view, onRole }: { view: RoomView; onRole?: () => void }) {
  const me = view.me;
  return (
    <header className="flex items-center gap-2">
      {!onRole && <Title small />}
      <span className={twMerge("whitespace-nowrap text-sm", muted)}>{onRole ? `Room ${view.code}` : `· ${view.code}`}</span>
      <div className="flex-1" />
      {onRole && (
        <button
          type="button"
          onClick={onRole}
          className={twMerge("whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold shadow", me.team ? teamChip[me.team] : "glass border")}
        >
          {me.team ? `${TEAM_LABEL[me.team]} ${me.role === "spymaster" ? "spymaster" : "operative"}` : "Watching"} ▾
        </button>
      )}
      <ThemeToggle />
    </header>
  );
}

function TakeoverBanner({ view, send }: { view: RoomView; send: Send }) {
  if (!view.boardAway) return null;
  const spy = view.me.role === "spymaster";
  return (
    <Panel className="flex flex-col gap-2 border-amber-400/70">
      <p className="font-semibold">The TV board hasn&apos;t checked in for 30 seconds.</p>
      <p className={twMerge("text-sm", muted)}>
        If it&apos;s gone for good, this phone can take over as the board. Cast it to the TV to keep playing.
        {spy && " You'll stop being spymaster, so your team will need a new one."}
      </p>
      <Btn
        tone="primary"
        onClick={() => {
          const msg = spy
            ? "Make this phone the TV board? Your key will be hidden and you'll stop being spymaster."
            : "Make this phone the TV board?";
          if (window.confirm(msg)) void send("claimBoard");
        }}
      >
        Make this phone the board
      </Btn>
    </Panel>
  );
}

function PlayerLobby({ view, send }: { view: RoomView; send: Send }) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-4">
      <PhoneHeader view={view} />
      <TakeoverBanner view={view} send={send} />
      <Panel className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl font-bold">Hi {view.me.name}! Pick a team and role.</h2>
          <p className={twMerge("text-sm", muted)}>
            Each team needs one spymaster, who sees the secret key on their phone. Operatives can follow along here or
            just watch the TV.
          </p>
        </div>
        <RolePicker view={view} send={send} />
        <p className={twMerge("text-center text-sm", muted)}>Waiting for the TV board to start the game…</p>
      </Panel>
      <LeaveButton send={send} />
    </main>
  );
}

function LeaveButton({ send }: { send: Send }) {
  return (
    <button
      type="button"
      className={twMerge("self-center text-sm underline", muted)}
      onClick={() => window.confirm("Leave this room?") && void send("leave")}
    >
      Leave room
    </button>
  );
}

function PhoneGame({ view, send }: { view: RoomView; send: Send }) {
  const [rolesOpen, setRolesOpen] = useState(false);
  const me = view.me;
  const spy = me.role === "spymaster";
  const over = view.phase === "over";
  const cards = view.cards ?? [];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 px-3 py-3">
      <EventToast view={view} />
      <PhoneHeader view={view} onRole={() => setRolesOpen(true)} />
      <TakeoverBanner view={view} send={send} />
      <div className="flex items-center justify-between gap-2">
        <Score view={view} team="blue" />
        <TurnPill view={view} />
        <Score view={view} team="red" />
      </div>
      <div className="mx-auto w-full max-w-[calc((100dvh-13rem)*1.33)]">
        <Board cards={cards} mode={spy && !over ? "key" : "board"} selected={view.selected} />
      </div>
      <Panel className="text-sm">
        {over ? (
          <p className="font-semibold">
            {endText(view)} The full key is shown. Waiting for the TV board to deal a new game.
          </p>
        ) : spy ? (
          <p>
            <b>You&apos;re the {TEAM_LABEL[me.team!]} spymaster.</b> Give your clue out loud: one word and a number. Keep
            this screen to yourself, and don&apos;t cast it.
          </p>
        ) : (
          <p>
            Say your guesses out loud. Whoever holds the TV board taps them.
            {view.selected !== null && cards[view.selected] && (
              <>
                {" "}
                Picked: <b>{cards[view.selected].word}</b>
              </>
            )}
          </p>
        )}
      </Panel>
      {rolesOpen && (
        <Modal title="Your team and role" onClose={() => setRolesOpen(false)}>
          <RolePicker view={view} send={send} />
          <div className="mt-4 flex justify-center">
            <LeaveButton send={send} />
          </div>
        </Modal>
      )}
    </main>
  );
}
