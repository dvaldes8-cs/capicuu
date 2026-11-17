import {
  NUMERIC_BONUS_HAND_TYPES,
  type BonusRule,
  type RegionalPreset,
  type ScoringRules,
} from './types';

const emptyBonuses = (): BonusRule[] =>
  NUMERIC_BONUS_HAND_TYPES.map((handType) => ({
    handType,
    mode: 'none' as const,
    value: 0,
    enabled: false,
  }));

/** Turn special bonuses on; values stay at 0 until the user edits them. */
export function enableSpecialBonuses(rules: ScoringRules): ScoringRules {
  return {
    ...rules,
    specialBonusesEnabled: true,
    bonuses: rules.bonuses.length > 0 ? rules.bonuses : emptyBonuses(),
  };
}

export function disableSpecialBonuses(rules: ScoringRules): ScoringRules {
  return { ...rules, specialBonusesEnabled: false };
}

/**
 * Regional presets are starting points only.
 * Bonuses stay off (all 0) until enabled and filled in by the user.
 */
export function createScoringRules(preset: RegionalPreset): ScoringRules {
  return {
    preset,
    scoringMode: 'manual',
    specialBonusesEnabled: false,
    bonuses: emptyBonuses(),
    tranqueMode: 'none',
    tranqueFixedPoints: 0,
  };
}

export const TARGET_SCORE_OPTIONS = [100, 150, 200, 300, 500] as const;

export const DEFAULT_TARGET_SCORE = 500;
