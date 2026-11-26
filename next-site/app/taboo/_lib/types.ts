// Shared between client and server. Must never import the deck.

export type Phase = "lobby" | "ready" | "active" | "review" | "over";
/** 0-based team index, `< settings.teamCount`. */
export type TeamIdx = number;
export type CardResult = "correct" | "skip" | "buzz";
export type WinMode = "score" | "rounds";

export type Settings = {
  teamCount: number;
  roundSec: number;
  skipPenalty: 0 | 1;
  winMode: WinMode;
  target: number;
};

export type PublicCard = { id: number; word: string; taboo: string[] };

export type PlayedView = { cardId: number; result: CardResult; word: string | null };

export type PlayerView = {
  id: string;
  name: string;
  team: TeamIdx | null;
  online: boolean;
};

export type RoomView = {
  code: string;
  version: number;
  serverNow: number;
  me: { id: string; name: string; team: TeamIdx | null; isHost: boolean };
  hostId: string;
  hostAway: boolean;
  phase: Phase;
  settings: Settings;
  players: PlayerView[];
  teamNames: string[];
  scores: number[];
  turnsPlayed: number[];
  activeTeam: TeamIdx;
  clueGiverId: string | null;
  turn: {
    endsAt: number | null;
    pausedRemainingMs: number | null;
    card: PublicCard | null;
    canSeeCard: boolean;
    played: PlayedView[];
    delta: number;
  } | null;
  lastTurn: {
    team: TeamIdx;
    clueGiverName: string;
    played: PlayedView[];
    delta: number;
  } | null;
  winner: TeamIdx | "tie" | null;
};

export type ActionOp =
  | "setTeam"
  | "setTeamName"
  | "setSettings"
  | "shuffleTeams"
  | "start"
  | "beginTurn"
  | "correct"
  | "skip"
  | "buzz"
  | "undo"
  | "pause"
  | "resume"
  | "toggleResult"
  | "confirmReview"
  | "kick"
  | "transferHost"
  | "claimHost"
  | "endGame"
  | "newGame"
  | "leave";

export type ApiRequest =
  | { op: "create"; name: string }
  | { op: "join"; code: string; name: string; snapshot?: string }
  | { op: "sync"; code: string; token: string; snapshot?: string }
  | ({ op: ActionOp; code: string; token: string; snapshot?: string } & Record<string, unknown>);

export type ApiResponse =
  | { ok: true; view: RoomView; snapshot?: string; playerId?: string; token?: string }
  | { ok: false; error: string; gone?: boolean; removed?: boolean; missing?: boolean };

export const ROUND_OPTIONS = [45, 60, 90] as const;
export const TEAM_COUNT_OPTIONS = [2, 3, 4] as const;
export const MIN_PER_TEAM = 2;
