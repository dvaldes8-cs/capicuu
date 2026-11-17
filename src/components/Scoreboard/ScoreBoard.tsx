import { useCallback, useState } from 'react';
import { Camera, History, Plus, Undo2 } from 'lucide-react';
import { Logo } from '../Brand/Logo';
import { Keypad } from './Keypad';
import { TeamPanel } from './TeamPanel';
import { TargetScoreBar } from './TargetScoreBar';
import { ScanDominosSheet } from './ScanDominosSheet';
import { HandHistorySheet } from '../Hands/HandHistorySheet';
import { BottomSheet } from '../ui/BottomSheet';
import { useActiveSummary, useAppStore } from '../../hooks/useAppStore';
import {
  NUMERIC_BONUS_HAND_TYPES,
  type HandType,
} from '../../domain/types';
import {
  calculateBonusPoints,
  calculateBonusPointsForTypes,
} from '../../domain/scoring';
import { t } from '../../i18n';

const QUICK_ADD_AMOUNTS = [10, 20, 30, 40, 50] as const;

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

/**
 * Flow: choose team → enter points → Añadir puntos.
 * Multiple special types (Dominada + Capicú) stack; +10…+50 chips stack the same way.
 */
export function ScoreBoard() {
  const {
    activeGame,
    dict,
    awardPoints,
    undo,
    setTab,
    storageError,
  } = useAppStore();
  const summary = useActiveSummary();

  const [amount, setAmount] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flashTeam, setFlashTeam] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [undoConfirmOpen, setUndoConfirmOpen] = useState(false);
  const [handTypes, setHandTypes] = useState<HandType[]>([]);
  const [quickAdds, setQuickAdds] = useState<number[]>([]);

  const configuredBonus = (type: HandType): number => {
    if (!activeGame || type === 'normal') return 0;
    return calculateBonusPoints(0, type, activeGame.scoringRules);
  };

  const hasConfiguredPills =
    !!activeGame?.scoringRules.specialBonusesEnabled &&
    NUMERIC_BONUS_HAND_TYPES.some((type) => configuredBonus(type) > 0);
  const showHandTypes = hasConfiguredPills;
  const showQuickAdd = !hasConfiguredPills;

  const basePoints = amount === '' ? 0 : Number(amount);
  const quickAddTotal = showQuickAdd
    ? quickAdds.reduce((sum, n) => sum + n, 0)
    : 0;
  const specialBonus =
    activeGame && showHandTypes
      ? calculateBonusPointsForTypes(
          basePoints,
          handTypes,
          activeGame.scoringRules,
        )
      : 0;
  /** Keypad base + quick chips; special types add on top when enabled. */
  const totalPoints = basePoints + quickAddTotal + specialBonus;
  const selectedTypeLabels = handTypes
    .map((type) => dict.hands.types[type])
    .join(' + ');

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1200);
  };

  const onAddPoints = useCallback(() => {
    if (!activeGame) return;
    if (!selectedTeamId) {
      setError(dict.scoreboard.selectTeamFirst);
      return;
    }
    const base = amount === '' ? 0 : Number(amount);
    const quickTotal = showQuickAdd
      ? quickAdds.reduce((sum, n) => sum + n, 0)
      : 0;
    const special = showHandTypes
      ? calculateBonusPointsForTypes(
          base,
          handTypes,
          activeGame.scoringRules,
        )
      : 0;
    if (base <= 0 && quickTotal <= 0 && special <= 0) {
      setError(dict.errors.empty);
      return;
    }
    // Quick chips fold into base; special hand types add their configured bonus.
    const points = base + quickTotal;
    const types: HandType[] = showHandTypes ? handTypes : ['normal'];
    const result = awardPoints(selectedTeamId, points, types);
    if (!result.ok) {
      const key = result.error as keyof typeof dict.errors;
      setError(dict.errors[key] ?? dict.errors.invalid);
      return;
    }
    const awarded = points + special;
    setAmount('');
    setHandTypes([]);
    setQuickAdds([]);
    setError(null);
    setFlashTeam(selectedTeamId);
    window.setTimeout(() => setFlashTeam(null), 550);
    showToast(
      t(dict, dict.scoreboard.recordedTotal, { n: awarded }),
    );
  }, [
    activeGame,
    amount,
    awardPoints,
    dict,
    handTypes,
    quickAdds,
    selectedTeamId,
    showHandTypes,
    showQuickAdd,
  ]);

  if (!activeGame || !summary) {
    return (
      <div className="empty-state">
        <Logo size={64} />
        <h1 className="page-title" style={{ marginTop: 16 }}>
          {dict.appName}
        </h1>
        <p>{dict.tagline}</p>
        <p style={{ marginBottom: 24 }}>{dict.secondaryTagline}</p>
        <button
          type="button"
          className="btn btn--primary btn--lg btn--block"
          onClick={() => setTab('new')}
        >
          {dict.newGame.title}
        </button>
      </div>
    );
  }

  const extraPoints = quickAddTotal + specialBonus;
  const canAdd = selectedTeamId !== null && (amount !== '' || extraPoints > 0);

  return (
    <>
      <header className="score-header">
        <div className="score-header__brand">
          <Logo size={36} />
          <h1>{dict.appName}</h1>
        </div>
        <TargetScoreBar />
      </header>

      <div className="score-teams">
        {summary.teams.map((team) => (
          <TeamPanel
            key={team.teamId}
            team={team}
            selected={selectedTeamId === team.teamId}
            flash={flashTeam === team.teamId}
            onSelect={() => {
              setSelectedTeamId(team.teamId);
              setError(null);
            }}
          />
        ))}
      </div>

      <p className="entry-hint">{dict.scoreboard.tapTeam}</p>

      <div className="entry-panel">
        <div className="entry-amount" aria-live="polite">
          {amount === '' && extraPoints <= 0 ? (
            <span className="entry-amount__hint">
              {dict.scoreboard.selectAmount}
            </span>
          ) : (
            <>
              {amount === '' ? 0 : amount}
              {quickAddTotal + specialBonus > 0 ? (
                <span className="entry-amount__bonus">
                  {' '}
                  +{quickAddTotal + specialBonus}
                </span>
              ) : null}
            </>
          )}
        </div>
        {quickAddTotal + specialBonus > 0 && (
          <p className="entry-hint entry-hint--bonus">
            {specialBonus > 0
              ? t(dict, dict.scoreboard.bonusIncluded, {
                  n: specialBonus,
                  type: selectedTypeLabels || dict.hands.types.normal,
                })
              : t(dict, dict.scoreboard.quickAddIncluded, {
                  n: quickAddTotal,
                })}
            {' · '}
            {t(dict, dict.scoreboard.totalPreview, { n: totalPoints })}
          </p>
        )}
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        {(storageError && (
          <p className="error-text" role="alert">
            {dict.errors[storageError as keyof typeof dict.errors] ??
              dict.errors.storage_error}
          </p>
        )) ||
          null}

        {showHandTypes && (
          <div
            className="chip-row chip-row--compact"
            role="group"
            aria-label={dict.scoreboard.handType}
          >
            {NUMERIC_BONUS_HAND_TYPES.map((type) => {
              const chipBonus = configuredBonus(type);
              if (chipBonus <= 0) return null;
              return (
                <button
                  key={type}
                  type="button"
                  className="chip chip--compact"
                  aria-pressed={handTypes.includes(type)}
                  onClick={() => {
                    setHandTypes((prev) => toggleInList(prev, type));
                    setError(null);
                  }}
                >
                  {dict.hands.types[type]} +{chipBonus}
                </button>
              );
            })}
          </div>
        )}

        {showQuickAdd && (
          <div
            className="chip-row"
            role="group"
            aria-label={dict.scoreboard.quickAdd}
          >
            {QUICK_ADD_AMOUNTS.map((n) => (
              <button
                key={n}
                type="button"
                className="chip"
                aria-pressed={quickAdds.includes(n)}
                onClick={() => {
                  setQuickAdds((prev) => toggleInList(prev, n));
                  setError(null);
                }}
              >
                +{n}
              </button>
            ))}
          </div>
        )}

        <Keypad
          value={amount}
          onChange={(v) => {
            setAmount(v);
            setError(null);
          }}
        />

        <button
          type="button"
          className="btn btn--primary btn--lg btn--block"
          onClick={onAddPoints}
          disabled={!canAdd}
        >
          <Plus size={22} aria-hidden />
          {totalPoints > 0
            ? t(dict, dict.scoreboard.awardTotal, { n: totalPoints })
            : dict.scoreboard.award}
        </button>

        <button
          type="button"
          className="btn btn--secondary btn--block"
          onClick={() => setScanOpen(true)}
        >
          <Camera size={18} aria-hidden />
          {dict.scoreboard.scan}
        </button>

        <div className="score-actions">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setUndoConfirmOpen(true)}
            disabled={activeGame.hands.length === 0}
          >
            <Undo2 size={18} aria-hidden />
            {dict.scoreboard.undo}
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setHistoryOpen(true)}
          >
            <History size={18} aria-hidden />
            {dict.scoreboard.history}
          </button>
        </div>
      </div>

      <BottomSheet
        open={undoConfirmOpen}
        onClose={() => setUndoConfirmOpen(false)}
        title={dict.scoreboard.undoConfirmTitle}
      >
        <p
          style={{
            marginTop: 0,
            marginBottom: 16,
            lineHeight: 1.5,
            color: 'var(--text-muted)',
          }}
        >
          {dict.scoreboard.undoConfirm}
        </p>
        <button
          type="button"
          className="btn btn--primary btn--block btn--lg"
          onClick={() => {
            setUndoConfirmOpen(false);
            undo();
          }}
        >
          <Undo2 size={20} aria-hidden />
          {dict.scoreboard.undoConfirmAction}
        </button>
        <button
          type="button"
          className="btn btn--secondary btn--block"
          style={{ marginTop: 8 }}
          onClick={() => setUndoConfirmOpen(false)}
        >
          {dict.common.cancel}
        </button>
      </BottomSheet>

      <HandHistorySheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

      <ScanDominosSheet
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onUsePoints={(pts) => {
          setAmount(String(pts));
          setError(null);
          showToast(dict.scan.pointsReady);
        }}
      />

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
