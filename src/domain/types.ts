/** Capicuu domain types — schema version 1 */

export const SCHEMA_VERSION = 1 as const;

export type Language = 'es' | 'en';
export type Theme = 'light' | 'dark' | 'system';
export type GameStatus = 'active' | 'completed' | 'abandoned';
export type GameType = 'parejas' | 'individual';
export type RegionalPreset = 'puertorriqueno' | 'dominicano' | 'personalizado';
export type HandType =
  | 'normal'
  | 'dominada'
  | 'capicu'
  | 'tranque'
  | 'chuchazo'
  | 'vuelta_redonda'
  | 'pase'
  | 'personalizado';

/** Special bonuses that use a fixed point value (no multipliers). */
export const NUMERIC_BONUS_HAND_TYPES: Exclude<HandType, 'normal'>[] = [
  'dominada',
  'capicu',
  'tranque',
  'chuchazo',
  'vuelta_redonda',
  'pase',
];

export type TranqueMode = 'winner_fixed' | 'pips_all' | 'pips_opposing' | 'none';
export type BonusMode = 'fixed' | 'multiplier' | 'none';

export interface Team {
  id: string;
  name: string;
  /** Display order on scoreboard (0 left, 1 right). Swap only changes this. */
  displayOrder: number;
}

export interface BonusRule {
  handType: HandType;
  mode: BonusMode;
  /** Fixed points added, or multiplier applied to base points */
  value: number;
  enabled: boolean;
}

export interface ScoringRules {
  preset: RegionalPreset;
  scoringMode: 'manual';
  specialBonusesEnabled: boolean;
  bonuses: BonusRule[];
  tranqueMode: TranqueMode;
  /** Fixed points when tranque awards a fixed bonus */
  tranqueFixedPoints: number;
}

export interface Hand {
  id: string;
  gameId: string;
  teamId: string;
  handNumber: number;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  /** Primary type (first selected bonus, or normal). Kept for older data. */
  handType: HandType;
  /** All special types selected for this hand (Dominada + Capicú, etc.). */
  handTypes: HandType[];
  createdAt: string;
  note?: string;
}

export interface Game {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: GameStatus;
  gameType: GameType;
  teams: Team[];
  /** Current winning target (may be edited mid-game with confirmation). */
  targetScore: number;
  /**
   * Target chosen when this game started.
   * Rematches and new rounds default to this — not mid-game edits.
   */
  initialTargetScore: number;
  scoringRules: ScoringRules;
  hands: Hand[];
  winnerId: string | null;
  schemaVersion: typeof SCHEMA_VERSION;
}

export interface Preferences {
  language: Language;
  theme: Theme;
  defaultTargetScore: number;
  defaultPreset: RegionalPreset;
  defaultTeamNames: [string, string];
  confirmReset: boolean;
  /** Short original victory jingle when a team wins. */
  victorySoundEnabled: boolean;
  schemaVersion: typeof SCHEMA_VERSION;
}

export interface AppData {
  schemaVersion: typeof SCHEMA_VERSION;
  games: Game[];
  activeGameId: string | null;
  preferences: Preferences;
}

export interface TeamScore {
  teamId: string;
  name: string;
  total: number;
  remaining: number;
  displayOrder: number;
}

export interface ScoreSummary {
  teams: TeamScore[];
  winnerId: string | null;
  isComplete: boolean;
  handCount: number;
}
