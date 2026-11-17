import { useEffect, useRef } from 'react';
import {
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
 * Enabling seeds editable defaults; selecting a type on the board adds them.
 */
export function SpecialRulesEditor({
  rules,
  onChange,
}: SpecialRulesEditorProps) {
  const { dict } = useAppStore();
  const healed = useRef(false);

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

  return (
    <div>
      <div className="settings-row">
        <label id="special-label">{dict.settings.specialRules}</label>
        <button
          type="button"
          className="toggle"
          role="switch"
          aria-checked={rules.specialBonusesEnabled}
          aria-labelledby="special-label"
          onClick={toggleEnabled}
        />
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        {dict.settings.specialRulesHint}
      </p>

      {rules.specialBonusesEnabled && (
        <div className="bonus-numbers">
          <p className="bonus-numbers__hint">{dict.settings.specialRulesNumbers}</p>
          {NUMERIC_BONUS_HAND_TYPES.map((handType) => {
            const bonus = rules.bonuses.find((b) => b.handType === handType);
            const value =
              bonus && bonus.value > 0 ? String(bonus.value) : '';

            return (
              <div key={handType} className="bonus-numbers__row">
                <label htmlFor={`bonus-${handType}`}>
                  {dict.hands.types[handType]}
                </label>
                <input
                  id={`bonus-${handType}`}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  value={value}
                  aria-label={`${dict.hands.types[handType]} ${dict.hands.points}`}
                  onChange={(e) => setBonusPoints(handType, e.target.value)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
