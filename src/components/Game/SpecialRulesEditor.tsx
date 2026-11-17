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

function parsePoints(raw: string): number {
  const cleaned = raw.replace(/\D/g, '').slice(0, 4);
  if (cleaned === '') return 0;
  const value = Math.floor(Number(cleaned));
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function displayPoints(handType: HandType, rules: ScoringRules): string {
  const bonus = rules.bonuses.find((b) => b.handType === handType);
  if (!bonus || bonus.value <= 0) return '';
  return String(bonus.value);
}

/** Toggle + editable fixed bonus points for a new game (defaults to 0). */
export function SpecialRulesEditor({
  rules,
  onChange,
}: SpecialRulesEditorProps) {
  const { dict } = useAppStore();
  const enabled = rules.specialBonusesEnabled;

  const setBonusPoints = (handType: HandType, raw: string) => {
    if (!enabled) return;
    const points = parsePoints(raw);
    const nextRule = {
      handType,
      mode: points > 0 ? ('fixed' as const) : ('none' as const),
      value: points,
      enabled: points > 0,
    };
    const bonuses = rules.bonuses.some((b) => b.handType === handType)
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
          aria-checked={enabled}
          aria-labelledby="special-label"
          onClick={() =>
            onChange(
              enabled
                ? disableSpecialBonuses(rules)
                : enableSpecialBonuses(rules),
            )
          }
        />
      </div>
      <p className="settings-hint">{dict.settings.specialRulesHint}</p>

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
              value={displayPoints(handType, rules)}
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
