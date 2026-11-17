import {
  NUMERIC_BONUS_HAND_TYPES,
  type BonusRule,
  type HandType,
  type RegionalPreset,
  type ScoringRules,
} from './types';

/** Starting fixed points when special bonuses are turned on (editable). */
export const DEFAULT_BONUS_POINTS: Record<
  Exclude<HandType, 'normal' | 'personalizado'>,
  number
> = {
  dominada: 30,
  capicu: 25,
  tranque: 20,
  chuchazo: 15,
  vuelta_redonda: 10,
  pase: 5,
};

const emptyBonuses = (): BonusRule[] =>
  NUMERIC_BONUS_HAND_TYPES.map((handType) => ({
    handType,
    mode: 'none' as const,
    value: 0,
    enabled: false,
  }));

function defaultBonuses(): BonusRule[] {
  return NUMERIC_BONUS_HAND_TYPES.map((handType) => {
    const value =
      handType in DEFAULT_BONUS_POINTS
        ? DEFAULT_BONUS_POINTS[
            handType as keyof typeof DEFAULT_BONUS_POINTS
          ]
        : 0;
    return {
      handType,
      mode: value > 0 ? ('fixed' as const) : ('none' as const),
      value,
      enabled: value > 0,
    };
  });
}

/**
 * Turn special bonuses on and seed default point values when none are set.
 * Keeps any values the user already entered.
 */
export function enableSpecialBonuses(rules: ScoringRules): ScoringRules {
  const hasConfigured = rules.bonuses.some((b) => b.value > 0);
  return {
    ...rules,
    specialBonusesEnabled: true,
    bonuses: hasConfigured
      ? rules.bonuses.map((b) =>
          b.value > 0
            ? { ...b, mode: 'fixed' as const, enabled: true }
            : b,
        )
      : defaultBonuses(),
  };
}

export function disableSpecialBonuses(rules: ScoringRules): ScoringRules {
  return { ...rules, specialBonusesEnabled: false };
}

/**
 * Regional presets are starting points only.
 * Bonuses stay off until enabled; enabling seeds editable defaults.
 * Manual scoring is always the default path.
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

export const DEFAULT_TARGET_SCORE = 200;
