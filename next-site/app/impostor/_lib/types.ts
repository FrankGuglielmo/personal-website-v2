// Shared between the route handler and the client. Type-only: the server never
// sends anything a player shouldn't see, so these describe filtered views.

export type Mode = "spyfall" | "word";
export type Phase = "lobby" | "reveal" | "discuss" | "vote" | "guess" | "results" | "over";

export type Settings = {
  mode: Mode;
  impostors: number;
  knowEachOther: boolean;
  discussSec: number;
  rounds: number;
  multiVote: boolean;
  categories: string[];
};

export type PlayerView = {
  id: string;
  name: string;
  isHost: boolean;
  online: boolean;
  score: number;
  inRound: boolean;
  eliminated: boolean;
  ready: boolean;
  voted: boolean;
};

export type CardView =
  | { kind: "spectator" }
  | { kind: "innocent"; mode: Mode; category: string; secret: string; role: string | null }
  | { kind: "impostor"; mode: Mode; category: string; fellows: string[] };

export type ResultView = {
  roundNo: number;
  outcome: "innocents" | "impostors" | "cancelled";
  reason: string;
  mode: Mode;
  category: string;
  secret: string;
  impostors: string[];
  roles: Record<string, string>;
  eliminated: string[];
  tally: { id: string; votes: number }[];
  guess: { by: string; pick: string | null; correct: boolean } | null;
  deltas: Record<string, number>;
  firstVoterId: string | null;
};

export type RoomView = {
  code: string;
  version: number;
  serverNow: number;
  phase: Phase;
  meId: string;
  hostId: string;
  players: PlayerView[];
  settings: Settings;
  limits: { minPlayers: number; maxPlayers: number; maxImpostors: number };
  catalog: { id: string; name: string }[];
  roundNo: number;
  totalRounds: number;
  category: string | null;
  card: CardView | null;
  discuss: {
    endsAt: number;
    clueOrder: string[];
    clueIndex: number;
    firstAsker: string | null;
    lastEliminated: string | null;
  } | null;
  vote: {
    endsAt: number;
    candidates: string[];
    revote: boolean;
    myVote: string | null;
    canVote: boolean;
    votedCount: number;
    voterCount: number;
  } | null;
  guess: { endsAt: number; by: string; reason: "caught" | "called"; options: string[] | null } | null;
  result: ResultView | null;
};

export type ActionOp =
  | "setSettings"
  | "start"
  | "ready"
  | "startDiscuss"
  | "clueDone"
  | "clueAgain"
  | "callVote"
  | "vote"
  | "knowIt"
  | "guess"
  | "nextRound"
  | "endGame"
  | "newGame"
  | "kick"
  | "claimHost"
  | "leave";

export type ApiResponse =
  | { ok: true; view: RoomView; snapshot?: string; playerId?: string; token?: string }
  | { ok: false; error: string; gone?: boolean };
