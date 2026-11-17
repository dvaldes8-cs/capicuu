import { describe, expect, it } from 'vitest';
import {
  createGame,
  addPoints,
  undoLastHand,
  deleteHand,
  editHand,
  rematch,
  swapTeamPositions,
  updateTargetScore,
} from './game';
import {
  calculateBonusPoints,
  calculateBonusPointsForTypes,
  computeScoreSummary,
  validatePoints,
} from './scoring';
import type { ScoringRules } from './types';
import { createScoringRules } from './presets';

describe('validatePoints', () => {
  it('accepts nonnegative integers', () => {
    expect(validatePoints(0)).toEqual({ ok: true, points: 0 });
    expect(validatePoints(25)).toEqual({ ok: true, points: 25 });
    expect(validatePoints('40')).toEqual({ ok: true, points: 40 });
  });

  it('rejects invalid numeric input', () => {
    expect(validatePoints('').ok).toBe(false);
    expect(validatePoints(-1).error).toBe('negative');
    expect(validatePoints(1.5).error).toBe('invalid');
    expect(validatePoints('abc').error).toBe('invalid');
    expect(validatePoints(10000).error).toBe('too_large');
  });
});

describe('game scoring', () => {
  it('creates a new game with defaults', () => {
    const game = createGame();
    expect(game.teams).toHaveLength(2);
    expect(game.teams[0].name).toBe('Nosotros');
    expect(game.teams[1].name).toBe('Ellos');
    expect(game.targetScore).toBe(200);
    expect(game.status).toBe('active');
    expect(game.hands).toHaveLength(0);
  });

  it('enters points for team A and B and calculates totals', () => {
    let game = createGame();
    const a = game.teams[0].id;
    const b = game.teams[1].id;

    const r1 = addPoints(game, a, 25);
    expect('error' in r1).toBe(false);
    if ('error' in r1) return;
    game = r1.game;

    const r2 = addPoints(game, b, 40);
    expect('error' in r2).toBe(false);
    if ('error' in r2) return;
    game = r2.game;

    const summary = computeScoreSummary(game);
    expect(summary.teams.find((t) => t.teamId === a)?.total).toBe(25);
    expect(summary.teams.find((t) => t.teamId === b)?.total).toBe(40);
    expect(summary.handCount).toBe(2);
  });

  it('detects a winner at default and custom targets', () => {
    let game = createGame({ targetScore: 100 });
    const a = game.teams[0].id;
    const r = addPoints(game, a, 100);
    if ('error' in r) throw new Error(r.error);
    game = r.game;
    expect(game.status).toBe('completed');
    expect(game.winnerId).toBe(a);

    let custom = createGame({ targetScore: 50 });
    const b = custom.teams[1].id;
    const r2 = addPoints(custom, b, 55);
    if ('error' in r2) throw new Error(r2.error);
    custom = r2.game;
    expect(custom.winnerId).toBe(b);
  });

  it('undoes the latest hand', () => {
    let game = createGame();
    const a = game.teams[0].id;
    const r1 = addPoints(game, a, 10);
    if ('error' in r1) throw new Error(r1.error);
    game = r1.game;
    const r2 = addPoints(game, a, 20);
    if ('error' in r2) throw new Error(r2.error);
    game = r2.game;
    game = undoLastHand(game);
    expect(computeScoreSummary(game).teams[0].total).toBe(10);
    expect(game.hands).toHaveLength(1);
  });

  it('edits and deletes entries and recalculates', () => {
    let game = createGame({ targetScore: 200 });
    const a = game.teams[0].id;
    const b = game.teams[1].id;
    const r1 = addPoints(game, a, 50);
    if ('error' in r1) throw new Error(r1.error);
    game = r1.game;
    const handId = r1.hand.id;

    const edited = editHand(game, handId, { basePoints: 30, teamId: b });
    if ('error' in edited) throw new Error(edited.error);
    game = edited.game;
    expect(computeScoreSummary(game).teams.find((t) => t.teamId === b)?.total).toBe(30);
    expect(computeScoreSummary(game).teams.find((t) => t.teamId === a)?.total).toBe(0);

    game = deleteHand(game, handId);
    expect(game.hands).toHaveLength(0);
    expect(computeScoreSummary(game).teams.every((t) => t.total === 0)).toBe(true);
  });

  it('corrects a winning hand and clears completion', () => {
    let game = createGame({ targetScore: 100 });
    const a = game.teams[0].id;
    const r = addPoints(game, a, 100);
    if ('error' in r) throw new Error(r.error);
    game = r.game;
    expect(game.status).toBe('completed');

    const fixed = editHand(game, r.hand.id, { basePoints: 80 });
    if ('error' in fixed) throw new Error(fixed.error);
    game = fixed.game;
    expect(game.status).toBe('active');
    expect(game.winnerId).toBeNull();
  });

  it('supports rematch preserving settings', () => {
    let game = createGame({
      team1Name: 'Casa',
      team2Name: 'Visita',
      targetScore: 150,
      preset: 'dominicano',
    });
    const a = game.teams[0].id;
    const r = addPoints(game, a, 20);
    if ('error' in r) throw new Error(r.error);
    game = r.game;

    const next = rematch(game);
    expect(next.id).not.toBe(game.id);
    expect(next.hands).toHaveLength(0);
    expect(next.targetScore).toBe(150);
    expect(next.initialTargetScore).toBe(150);
    expect(next.teams.map((t) => t.name).sort()).toEqual(['Casa', 'Visita'].sort());
    expect(next.scoringRules.preset).toBe('dominicano');
  });

  it('rematch uses initial target, not a mid-game target edit', () => {
    let game = createGame({ targetScore: 200 });
    expect(game.initialTargetScore).toBe(200);
    game = updateTargetScore(game, 500);
    expect(game.targetScore).toBe(500);
    expect(game.initialTargetScore).toBe(200);

    const next = rematch(game);
    expect(next.targetScore).toBe(200);
    expect(next.initialTargetScore).toBe(200);
  });

  it('swaps team positions without changing scores', () => {
    let game = createGame();
    const left = game.teams.find((t) => t.displayOrder === 0)!;
    const r = addPoints(game, left.id, 15);
    if ('error' in r) throw new Error(r.error);
    game = swapTeamPositions(r.game);
    const summary = computeScoreSummary(game);
    expect(summary.teams[0].total).toBe(0);
    expect(summary.teams[1].total).toBe(15);
    expect(summary.teams[1].teamId).toBe(left.id);
  });
});

describe('bonus rules', () => {
  it('does not add bonuses when disabled', () => {
    const rules = createScoringRules('puertorriqueno');
    expect(calculateBonusPoints(25, 'capicu', rules)).toBe(0);
  });

  it('applies configured fixed bonus', () => {
    const rules: ScoringRules = {
      ...createScoringRules('personalizado'),
      specialBonusesEnabled: true,
      bonuses: [
        {
          handType: 'capicu',
          mode: 'fixed',
          value: 25,
          enabled: true,
        },
      ],
    };
    expect(calculateBonusPoints(10, 'capicu', rules)).toBe(25);
    expect(calculateBonusPoints(10, 'normal', rules)).toBe(0);
  });

  it('stacks multiple fixed bonuses in one hand', () => {
    const rules: ScoringRules = {
      ...createScoringRules('personalizado'),
      specialBonusesEnabled: true,
      bonuses: [
        {
          handType: 'dominada',
          mode: 'fixed',
          value: 30,
          enabled: true,
        },
        {
          handType: 'capicu',
          mode: 'fixed',
          value: 50,
          enabled: true,
        },
      ],
    };
    expect(
      calculateBonusPointsForTypes(10, ['dominada', 'capicu'], rules),
    ).toBe(80);
  });

  it('applies fixed bonus even if enabled flag was left false', () => {
    const rules: ScoringRules = {
      ...createScoringRules('personalizado'),
      specialBonusesEnabled: true,
      bonuses: [
        {
          handType: 'dominada',
          mode: 'fixed',
          value: 30,
          enabled: false,
        },
      ],
    };
    expect(calculateBonusPoints(0, 'dominada', rules)).toBe(30);
  });

  it('applies multiplier bonus as extra points', () => {
    const rules: ScoringRules = {
      ...createScoringRules('personalizado'),
      specialBonusesEnabled: true,
      bonuses: [
        {
          handType: 'dominada',
          mode: 'multiplier',
          value: 2,
          enabled: true,
        },
      ],
    };
    // 2x means bonus = base (total becomes 2x)
    expect(calculateBonusPoints(20, 'dominada', rules)).toBe(20);
  });
});

describe('regional presets', () => {
  it('creates configurable presets without inventing bonuses', () => {
    for (const preset of ['puertorriqueno', 'dominicano', 'personalizado'] as const) {
      const rules = createScoringRules(preset);
      expect(rules.preset).toBe(preset);
      expect(rules.scoringMode).toBe('manual');
      expect(rules.specialBonusesEnabled).toBe(false);
    }
  });

  it('seeds editable default bonus points when enabling', async () => {
    const { enableSpecialBonuses, DEFAULT_BONUS_POINTS } = await import(
      './presets'
    );
    const rules = enableSpecialBonuses(createScoringRules('dominicano'));
    expect(rules.specialBonusesEnabled).toBe(true);
    expect(calculateBonusPoints(0, 'capicu', rules)).toBe(
      DEFAULT_BONUS_POINTS.capicu,
    );
    expect(calculateBonusPoints(0, 'pase', rules)).toBe(
      DEFAULT_BONUS_POINTS.pase,
    );
  });
});
