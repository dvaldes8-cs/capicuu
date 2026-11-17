import { createScoringRules, DEFAULT_TARGET_SCORE } from './presets';
import {
  applyWinnerStatus,
  calculateBonusPointsForTypes,
  calculateHandTotal,
  createHandRecord,
  normalizeHandTypes,
  primaryHandType,
  recalculateFromHands,
  validatePoints,
} from './scoring';
import {
  SCHEMA_VERSION,
  type AppData,
  type Game,
  type Hand,
  type HandType,
  type RegionalPreset,
  type ScoringRules,
  type Team,
} from './types';

export interface NewGameInput {
  team1Name?: string;
  team2Name?: string;
  targetScore?: number;
  preset?: RegionalPreset;
  scoringRules?: ScoringRules;
}

export function createGame(input: NewGameInput = {}): Game {
  const now = new Date().toISOString();
  const team1: Team = {
    id: crypto.randomUUID(),
    name: (input.team1Name?.trim() || 'Nosotros').slice(0, 24),
    displayOrder: 0,
  };
  const team2: Team = {
    id: crypto.randomUUID(),
    name: (input.team2Name?.trim() || 'Ellos').slice(0, 24),
    displayOrder: 1,
  };
  const target =
    input.targetScore && input.targetScore > 0
      ? Math.floor(input.targetScore)
      : DEFAULT_TARGET_SCORE;

  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: 'active',
    gameType: 'parejas',
    teams: [team1, team2],
    targetScore: target,
    initialTargetScore: target,
    scoringRules:
      input.scoringRules ??
      createScoringRules(input.preset ?? 'puertorriqueno'),
    hands: [],
    winnerId: null,
    schemaVersion: SCHEMA_VERSION,
  };
}

/**
 * Always keep an active scoreboard game ready (defaults to partida a 500).
 * Used on first launch and whenever no active game is selected.
 */
export function ensureActiveGame(data: AppData): AppData {
  if (
    data.activeGameId &&
    data.games.some((g) => g.id === data.activeGameId)
  ) {
    return data;
  }

  const existingActive = data.games.find((g) => g.status === 'active');
  if (existingActive) {
    return { ...data, activeGameId: existingActive.id };
  }

  const prefs = data.preferences;
  const game = createGame({
    team1Name: prefs.defaultTeamNames[0],
    team2Name: prefs.defaultTeamNames[1],
    targetScore: prefs.defaultTargetScore || DEFAULT_TARGET_SCORE,
    preset: prefs.defaultPreset,
  });

  return {
    ...data,
    games: [game, ...data.games],
    activeGameId: game.id,
  };
}

export function addPoints(
  game: Game,
  teamId: string,
  rawPoints: unknown,
  handType: HandType | HandType[] = 'normal',
): { game: Game; hand: Hand } | { error: string } {
  const team = game.teams.find((t) => t.id === teamId);
  if (!team) return { error: 'team_not_found' };

  const validated = validatePoints(rawPoints);
  if (!validated.ok) return { error: validated.error ?? 'invalid' };

  const handTypes = normalizeHandTypes(handType);
  const hand = createHandRecord({
    game,
    teamId,
    basePoints: validated.points,
    handTypes,
  });

  return {
    game: recalculateFromHands({
      ...game,
      hands: [...game.hands, hand],
    }),
    hand,
  };
}

export function undoLastHand(game: Game): Game {
  if (game.hands.length === 0) return game;
  const sorted = [...game.hands].sort(
    (a, b) =>
      b.handNumber - a.handNumber ||
      b.createdAt.localeCompare(a.createdAt),
  );
  const lastId = sorted[0].id;
  return recalculateFromHands({
    ...game,
    hands: game.hands.filter((h) => h.id !== lastId),
  });
}

export function deleteHand(game: Game, handId: string): Game {
  return recalculateFromHands({
    ...game,
    hands: game.hands.filter((h) => h.id !== handId),
  });
}

export function editHand(
  game: Game,
  handId: string,
  updates: {
    teamId?: string;
    basePoints?: number;
    handType?: HandType | HandType[];
    handTypes?: HandType[];
  },
): { game: Game } | { error: string } {
  const idx = game.hands.findIndex((h) => h.id === handId);
  if (idx === -1) return { error: 'hand_not_found' };

  const existing = game.hands[idx];
  const teamId = updates.teamId ?? existing.teamId;
  if (!game.teams.some((t) => t.id === teamId)) {
    return { error: 'team_not_found' };
  }

  const basePoints =
    updates.basePoints !== undefined
      ? updates.basePoints
      : existing.basePoints;
  const validated = validatePoints(basePoints);
  if (!validated.ok) return { error: validated.error ?? 'invalid' };

  const handTypes = normalizeHandTypes(
    updates.handTypes ??
      updates.handType ??
      existing.handTypes ??
      existing.handType,
  );
  const handType = primaryHandType(handTypes);
  const bonusPoints = calculateBonusPointsForTypes(
    validated.points,
    handTypes,
    game.scoringRules,
  );
  const totalPoints = calculateHandTotal(validated.points, bonusPoints);

  const hands = game.hands.map((h, i) =>
    i === idx
      ? {
          ...h,
          teamId,
          basePoints: validated.points,
          bonusPoints,
          totalPoints,
          handType,
          handTypes,
        }
      : h,
  );

  return { game: recalculateFromHands({ ...game, hands }) };
}

/** Swap display positions without altering scoring history. */
export function swapTeamPositions(game: Game): Game {
  return {
    ...game,
    teams: game.teams.map((t) => ({
      ...t,
      displayOrder: t.displayOrder === 0 ? 1 : 0,
    })),
    updatedAt: new Date().toISOString(),
  };
}

export function rematch(game: Game): Game {
  const now = new Date().toISOString();
  // Always restart from the target entered at the beginning of this match,
  // not a mid-game edit of the winning score.
  const startTarget = game.initialTargetScore || game.targetScore;
  return {
    ...createGame({
      team1Name: game.teams.find((t) => t.displayOrder === 0)?.name,
      team2Name: game.teams.find((t) => t.displayOrder === 1)?.name,
      targetScore: startTarget,
      scoringRules: structuredClone(game.scoringRules),
    }),
    // Preserve original display order names even if swapped
    teams: game.teams
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((t, i) => ({
        id: crypto.randomUUID(),
        name: t.name,
        displayOrder: i,
      })),
    createdAt: now,
    updatedAt: now,
  };
}

export function abandonGame(game: Game): Game {
  if (game.status === 'completed') return game;
  return applyWinnerStatus({
    ...game,
    status: 'abandoned',
    updatedAt: new Date().toISOString(),
  });
}

export function renameTeams(
  game: Game,
  names: { teamId: string; name: string }[],
): Game {
  return {
    ...game,
    teams: game.teams.map((t) => {
      const match = names.find((n) => n.teamId === t.id);
      if (!match) return t;
      return { ...t, name: match.name.trim().slice(0, 24) || t.name };
    }),
    updatedAt: new Date().toISOString(),
  };
}

export function updateTargetScore(game: Game, targetScore: number): Game {
  const target = Math.floor(targetScore);
  if (target < 1) return game;
  // Only current target changes — initialTargetScore stays for rematches.
  return recalculateFromHands({
    ...game,
    targetScore: target,
  });
}

export function handsNewestFirst(game: Game): Hand[] {
  return [...game.hands].sort(
    (a, b) =>
      b.handNumber - a.handNumber ||
      b.createdAt.localeCompare(a.createdAt),
  );
}
