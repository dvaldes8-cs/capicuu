import type {
  BonusRule,
  Game,
  Hand,
  HandType,
  ScoreSummary,
  ScoringRules,
  TeamScore,
} from './types';

export function getBonusRule(
  rules: ScoringRules,
  handType: HandType,
): BonusRule | undefined {
  if (!rules.specialBonusesEnabled || handType === 'normal') return undefined;
  const rule = rules.bonuses.find((b) => b.handType === handType);
  if (!rule) return undefined;
  // Treat a positive fixed value as active even if enabled was left false.
  if (rule.enabled) return rule;
  if (rule.mode === 'fixed' && rule.value > 0) return { ...rule, enabled: true };
  return undefined;
}

export function calculateBonusPoints(
  basePoints: number,
  handType: HandType,
  rules: ScoringRules,
): number {
  const rule = getBonusRule(rules, handType);
  if (!rule || rule.mode === 'none') return 0;
  if (rule.mode === 'fixed') return Math.max(0, Math.floor(rule.value));
  if (rule.mode === 'multiplier') {
    const mult = Math.max(0, rule.value);
    return Math.max(0, Math.floor(basePoints * mult) - basePoints);
  }
  return 0;
}

/** Unique special types only; empty / only-normal → ['normal']. */
export function normalizeHandTypes(
  types: readonly HandType[] | HandType | undefined,
): HandType[] {
  const list = Array.isArray(types)
    ? types
    : types
      ? [types]
      : [];
  const specials = [
    ...new Set(list.filter((t): t is HandType => t !== 'normal')),
  ];
  return specials.length > 0 ? specials : ['normal'];
}

export function primaryHandType(types: readonly HandType[]): HandType {
  return types.find((t) => t !== 'normal') ?? 'normal';
}

/** Sum bonuses for every selected special type (e.g. Dominada + Capicú). */
export function calculateBonusPointsForTypes(
  basePoints: number,
  handTypes: readonly HandType[],
  rules: ScoringRules,
): number {
  return normalizeHandTypes(handTypes)
    .filter((t) => t !== 'normal')
    .reduce(
      (sum, type) => sum + calculateBonusPoints(basePoints, type, rules),
      0,
    );
}

export function calculateHandTotal(
  basePoints: number,
  bonusPoints: number,
): number {
  return Math.max(0, Math.floor(basePoints) + Math.max(0, Math.floor(bonusPoints)));
}

export function getTeamTotal(game: Game, teamId: string): number {
  return game.hands
    .filter((h) => h.teamId === teamId)
    .reduce((sum, h) => sum + h.totalPoints, 0);
}

export function computeScoreSummary(game: Game): ScoreSummary {
  const teams: TeamScore[] = [...game.teams]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((team) => {
      const total = getTeamTotal(game, team.id);
      return {
        teamId: team.id,
        name: team.name,
        total,
        remaining: Math.max(0, game.targetScore - total),
        displayOrder: team.displayOrder,
      };
    });

  const winner = teams.find((t) => t.total >= game.targetScore);
  // If both somehow exceed, highest score wins; tie → first to reach by hand order
  let winnerId: string | null = null;
  if (winner) {
    const overTarget = teams.filter((t) => t.total >= game.targetScore);
    if (overTarget.length === 1) {
      winnerId = overTarget[0].teamId;
    } else if (overTarget.length > 1) {
      const max = Math.max(...overTarget.map((t) => t.total));
      const tied = overTarget.filter((t) => t.total === max);
      if (tied.length === 1) {
        winnerId = tied[0].teamId;
      } else {
        // First team that crossed the target chronologically
        winnerId = findFirstToTarget(game) ?? tied[0].teamId;
      }
    }
  }

  return {
    teams,
    winnerId,
    isComplete: winnerId !== null,
    handCount: game.hands.length,
  };
}

function findFirstToTarget(game: Game): string | null {
  const totals = new Map(game.teams.map((t) => [t.id, 0]));
  const sorted = [...game.hands].sort(
    (a, b) =>
      a.handNumber - b.handNumber ||
      a.createdAt.localeCompare(b.createdAt),
  );
  for (const hand of sorted) {
    const next = (totals.get(hand.teamId) ?? 0) + hand.totalPoints;
    totals.set(hand.teamId, next);
    if (next >= game.targetScore) return hand.teamId;
  }
  return null;
}

export function validatePoints(value: unknown): {
  ok: boolean;
  points: number;
  error?: string;
} {
  if (value === '' || value === null || value === undefined) {
    return { ok: false, points: 0, error: 'empty' };
  }
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return { ok: false, points: 0, error: 'invalid' };
  }
  if (n < 0) {
    return { ok: false, points: 0, error: 'negative' };
  }
  if (n > 9999) {
    return { ok: false, points: 0, error: 'too_large' };
  }
  return { ok: true, points: n };
}

export function applyWinnerStatus(game: Game): Game {
  const summary = computeScoreSummary(game);
  const status = summary.isComplete ? 'completed' : 'active';
  return {
    ...game,
    status,
    winnerId: summary.winnerId,
    updatedAt: new Date().toISOString(),
  };
}

export function recalculateFromHands(game: Game): Game {
  return applyWinnerStatus({
    ...game,
    hands: [...game.hands].sort(
      (a, b) =>
        a.handNumber - b.handNumber ||
        a.createdAt.localeCompare(b.createdAt),
    ),
  });
}

export function createHandRecord(input: {
  game: Game;
  teamId: string;
  basePoints: number;
  handType?: HandType;
  handTypes?: HandType[];
  note?: string;
  now?: string;
}): Hand {
  const { game, teamId, basePoints } = input;
  const handTypes = normalizeHandTypes(
    input.handTypes ?? input.handType ?? 'normal',
  );
  const handType = primaryHandType(handTypes);
  const bonusPoints = calculateBonusPointsForTypes(
    basePoints,
    handTypes,
    game.scoringRules,
  );
  const totalPoints = calculateHandTotal(basePoints, bonusPoints);
  const handNumber =
    game.hands.reduce((max, h) => Math.max(max, h.handNumber), 0) + 1;

  return {
    id: crypto.randomUUID(),
    gameId: game.id,
    teamId,
    handNumber,
    basePoints,
    bonusPoints,
    totalPoints,
    handType,
    handTypes,
    createdAt: input.now ?? new Date().toISOString(),
    note: input.note,
  };
}
