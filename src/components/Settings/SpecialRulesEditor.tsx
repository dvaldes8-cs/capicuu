import { useEffect, useRef } from 'react';
import {
  DEFAULT_BONUS_POINTS,
  disableSpecialBonuses,
  enableSpecialBonuses,
} from '../../domain/presets';
import {
  NUMERIC_BONUS_HAND_TYPES,
  type HandType,
  type ScoringRules,
} from '../../domain/types';
import { useAppStore } from '../../hooks/useAppStore';

type SpecialRulesEditorProps = {
  rules: ScoringRules;
  onChange: (rules: ScoringRules) => void;
};

/**
 * Special bonuses — fixed point values only (no multipliers).
 * The bonus list stays visible; inputs are disabled while the toggle is off.
 */
export function SpecialRulesEditor({
  rules,
  onChange,
}: SpecialRulesEditorProps) {
  const { dict } = useAppStore();
  const healed = useRef(false);
  const enabled = rules.specialBonusesEnabled;

  // Older games may have bonuses on with all zeros — seed defaults once.
  useEffect(() => {
    if (healed.current) return;
    if (!rules.specialBonusesEnabled) return;
    if (rules.bonuses.some((b) => b.value > 0)) return;
    healed.current = true;
    onChange(enableSpecialBonuses(rules));
  }, [rules, onChange]);

  const toggleEnabled = () => {
    onChange(
      rules.specialBonusesEnabled
        ? disableSpecialBonuses(rules)
        : enableSpecialBonuses(rules),
    );
  };

  const setBonusPoints = (handType: HandType, raw: string) => {
    if (!rules.specialBonusesEnabled) return;
    const cleaned = raw.replace(/\D/g, '').slice(0, 4);
    const value = cleaned === '' ? 0 : Math.floor(Number(cleaned));
    const points = Number.isFinite(value) ? Math.max(0, value) : 0;

    const existing = rules.bonuses.find((b) => b.handType === handType);
    const nextRule = {
      handType,
      mode: points > 0 ? ('fixed' as const) : ('none' as const),
      value: points,
      enabled: points > 0,
    };

    const bonuses = existing
      ? rules.bonuses.map((b) => (b.handType === handType ? nextRule : b))
      : [...rules.bonuses, nextRule];

    onChange({ ...rules, bonuses, specialBonusesEnabled: true });
  };

  const displayValue = (handType: HandType): string => {
    const bonus = rules.bonuses.find((b) => b.handType === handType);
    if (bonus && bonus.value > 0) return String(bonus.value);
    if (!enabled && handType in DEFAULT_BONUS_POINTS) {
      return String(
        DEFAULT_BONUS_POINTS[handType as keyof typeof DEFAULT_BONUS_POINTS],
      );
    }
    return '';
  };

  return (
    <div>
      <div className="settings-row">
        <label id="special-label">{dict.settings.specialRules}</label>
        <button
          type="button"
          className="toggle"
          role="switch"
          aria-checked={enabled}
          aria-labelledby="special-label"
          onClick={toggleEnabled}
        />
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        {dict.settings.specialRulesHint}
      </p>

      <div
        className={
          enabled ? 'bonus-numbers' : 'bonus-numbers bonus-numbers--disabled'
        }
        aria-disabled={!enabled}
      >
        <p className="bonus-numbers__hint">{dict.settings.specialRulesNumbers}</p>
        {NUMERIC_BONUS_HAND_TYPES.map((handType) => (
          <div key={handType} className="bonus-numbers__row">
            <label htmlFor={`bonus-${handType}`}>
              {dict.hands.types[handType]}
            </label>
            <input
              id={`bonus-${handType}`}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={displayValue(handType)}
              disabled={!enabled}
              aria-label={`${dict.hands.types[handType]} ${dict.hands.points}`}
              onChange={(e) => setBonusPoints(handType, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
