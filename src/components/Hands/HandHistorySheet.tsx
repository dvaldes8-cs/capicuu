import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { handsNewestFirst } from '../../domain/game';
import {
  NUMERIC_BONUS_HAND_TYPES,
  type Hand,
  type HandType,
} from '../../domain/types';
import { normalizeHandTypes } from '../../domain/scoring';
import { t } from '../../i18n';
import { useAppStore } from '../../hooks/useAppStore';

type HandHistorySheetProps = {
  open: boolean;
  onClose: () => void;
};

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function formatHandTypes(
  types: HandType[],
  labels: Record<HandType, string>,
): string {
  const specials = types.filter((type) => type !== 'normal');
  if (specials.length === 0) return labels.normal;
  return specials.map((type) => labels[type]).join(' + ');
}

export function HandHistorySheet({ open, onClose }: HandHistorySheetProps) {
  const { activeGame, dict, removeHand, updateHand } = useAppStore();
  const [editing, setEditing] = useState<Hand | null>(null);
  const [editPoints, setEditPoints] = useState('');
  const [editTeamId, setEditTeamId] = useState('');
  const [editTypes, setEditTypes] = useState<HandType[]>([]);
  const [editError, setEditError] = useState<string | null>(null);

  if (!activeGame) return null;

  const hands = handsNewestFirst(activeGame);
  const teamName = (id: string) =>
    activeGame.teams.find((t) => t.id === id)?.name ?? '';
  const bonusesOn = activeGame.scoringRules.specialBonusesEnabled;

  const openEdit = (hand: Hand) => {
    setEditing(hand);
    setEditPoints(String(hand.basePoints));
    setEditTeamId(hand.teamId);
    setEditTypes(
      normalizeHandTypes(hand.handTypes ?? hand.handType).filter(
        (type) => type !== 'normal',
      ),
    );
    setEditError(null);
  };

  const saveEdit = () => {
    if (!editing) return;
    const result = updateHand(editing.id, {
      teamId: editTeamId,
      basePoints: Number(editPoints),
      handTypes: editTypes,
    });
    if (!result.ok) {
      const key = result.error as keyof typeof dict.errors;
      setEditError(dict.errors[key] ?? dict.errors.invalid);
      return;
    }
    setEditing(null);
  };

  return (
    <>
      <BottomSheet
        open={open && !editing}
        onClose={onClose}
        title={dict.hands.title}
      >
        {hands.length === 0 ? (
          <p className="empty-state">{dict.hands.empty}</p>
        ) : (
          <ul className="hand-list">
            {hands.map((hand) => {
              const types = normalizeHandTypes(
                hand.handTypes ?? hand.handType,
              );
              return (
                <li key={hand.id} className="hand-item">
                  <div className="hand-item__meta">
                    <span className="hand-item__title">
                      {t(dict, dict.hands.hand, { n: hand.handNumber })} —{' '}
                      {teamName(hand.teamId)}
                    </span>
                    <span className="hand-item__sub">
                      {formatHandTypes(types, dict.hands.types)}
                      {hand.bonusPoints > 0
                        ? ` · +${hand.bonusPoints} bonus`
                        : ''}
                    </span>
                  </div>
                  <span className="hand-item__pts">+{hand.totalPoints}</span>
                  <div className="hand-item__actions">
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={dict.hands.edit}
                      onClick={() => openEdit(hand)}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={dict.hands.delete}
                      onClick={() => removeHand(hand.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </BottomSheet>

      <BottomSheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title={dict.hands.edit}
      >
        {editing && (
          <>
            <div className="field">
              <label htmlFor="edit-team">{dict.hands.team}</label>
              <select
                id="edit-team"
                value={editTeamId}
                onChange={(e) => setEditTeamId(e.target.value)}
              >
                {activeGame.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="edit-points">{dict.hands.points}</label>
              <input
                id="edit-points"
                inputMode="numeric"
                pattern="[0-9]*"
                value={editPoints}
                onChange={(e) =>
                  setEditPoints(e.target.value.replace(/\D/g, '').slice(0, 4))
                }
              />
            </div>
            {bonusesOn && (
              <div className="field">
                <label>{dict.scoreboard.handType}</label>
                <div
                  className="chip-row"
                  role="group"
                  aria-label={dict.scoreboard.handType}
                >
                  <button
                    type="button"
                    className="chip"
                    aria-pressed={editTypes.length === 0}
                    onClick={() => setEditTypes([])}
                  >
                    {dict.hands.types.normal}
                  </button>
                  {NUMERIC_BONUS_HAND_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className="chip"
                      aria-pressed={editTypes.includes(type)}
                      onClick={() =>
                        setEditTypes((prev) => toggleInList(prev, type))
                      }
                    >
                      {dict.hands.types[type]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {editError && (
              <p className="error-text" role="alert">
                {editError}
              </p>
            )}
            <button
              type="button"
              className="btn btn--primary btn--block btn--lg"
              onClick={saveEdit}
            >
              {dict.hands.save}
            </button>
          </>
        )}
      </BottomSheet>
    </>
  );
}
