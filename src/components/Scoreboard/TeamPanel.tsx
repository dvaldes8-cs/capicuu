import type { TeamScore } from '../../domain/types';
import { t } from '../../i18n';
import { useAppStore } from '../../hooks/useAppStore';

type TeamPanelProps = {
  team: TeamScore;
  selected: boolean;
  flash: boolean;
  onSelect: () => void;
  disabled?: boolean;
};

export function TeamPanel({
  team,
  selected,
  flash,
  onSelect,
  disabled,
}: TeamPanelProps) {
  const { dict } = useAppStore();
  const remainingLabel = t(dict, dict.scoreboard.toWin, { n: team.remaining });

  const className = [
    'team-panel',
    selected ? 'team-panel--selected' : '',
    flash ? 'team-panel--flash' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${team.name}: ${team.total}. ${remainingLabel}`}
    >
      <span className="team-panel__name">{team.name}</span>
      <span className="team-panel__score" aria-live="polite">
        {team.total}
      </span>
      <span className="team-panel__remaining">{remainingLabel}</span>
    </button>
  );
}
