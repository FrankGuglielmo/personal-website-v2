export type Team = "blue" | "red";
export type Role = "board" | "spymaster" | "operative";
export type CardColor = Team | "neutral" | "assassin";
export type Phase = "lobby" | "playing" | "over";
export type PackId = "classic" | "food" | "places" | "holiday" | "mix";

export const TEAMS: readonly Team[] = ["blue", "red"];
export const TEAM_LABEL: Record<Team, string> = { blue: "Blue", red: "Red" };

export const PACKS: readonly { id: PackId; label: string }[] = [
  { id: "classic", label: "Classic" },
  { id: "food", label: "Food" },
  { id: "places", label: "Places" },
  { id: "holiday", label: "Holiday" },
  { id: "mix", label: "Mix of all" },
];

export type PlayerView = {
  id: string;
  name: string;
  team: Team | null;
  role: Role;
  online: boolean;
  isHost: boolean;
};

/** `color` is null for unrevealed cards unless the viewer may see the key. */
export type CardView = { word: string; revealed: boolean; color: CardColor | null };

export type GameEvent =
  | { seq: number; kind: "reveal"; index: number; color: CardColor; team: Team }
  | { seq: number; kind: "pass"; team: Team }
  | { seq: number; kind: "undo" };

export type RoomView = {
  code: string;
  version: number;
  serverNow: number;
  phase: Phase;
  pack: PackId;
  me: PlayerView;
  players: PlayerView[];
  cards: CardView[] | null;
  turn: Team | null;
  startingTeam: Team | null;
  selected: number | null;
  remaining: Record<Team, number> | null;
  winner: Team | null;
  endReason: "agents" | "assassin" | null;
  lastEvent: GameEvent | null;
  canUndo: boolean;
  boardAway: boolean;
  gameNo: number;
};

export type ActionOp =
  | "setPlayer"
  | "setPack"
  | "start"
  | "select"
  | "reveal"
  | "endTurn"
  | "undo"
  | "newGame"
  | "toLobby"
  | "kick"
  | "claimBoard"
  | "leave";

export type ApiResponse =
  | { ok: true; view: RoomView; snapshot?: string; playerId?: string; token?: string }
  | { ok: false; error: string; gone?: boolean };
