import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { TARGET_SCORE_OPTIONS } from '../../domain/presets';
import { BottomSheet } from '../ui/BottomSheet';
import { useAppStore } from '../../hooks/useAppStore';
import { t } from '../../i18n';

export function TargetScoreBar() {
  const { activeGame, dict, setTargetScore } = useAppStore();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (!activeGame) return null;

  const current = activeGame.targetScore;
  const initial = activeGame.initialTargetScore || current;

  const openEditor = () => {
    const isPreset = TARGET_SCORE_OPTIONS.includes(
      current as (typeof TARGET_SCORE_OPTIONS)[number],
    );
    setUseCustom(!isPreset);
    setDraft(String(current));
    setConfirming(false);
    setOpen(true);
  };

  const resolved = useCustom
    ? Math.floor(Number(draft) || 0)
    : Math.floor(Number(draft) || 0);

  const canProceed = resolved >= 1 && resolved !== current;

  const requestChange = () => {
    if (!canProceed) return;
    setConfirming(true);
  };

  const applyChange = () => {
    if (!canProceed) return;
    const result = setTargetScore(resolved);
    if (result.ok) {
      setOpen(false);
      setConfirming(false);
    }
  };

  return (
    <>
      <div className="target-bar">
        <button
          type="button"
          className="target-bar__btn"
          onClick={openEditor}
          aria-label={dict.scoreboard.editTarget}
        >
          <span className="target-bar__label">
            {t(dict, dict.scoreboard.matchTo, { score: current })}
          </span>
          <Pencil size={16} aria-hidden className="target-bar__icon" />
        </button>
      </div>

      <BottomSheet
        open={open}
        onClose={() => {
          setOpen(false);
          setConfirming(false);
        }}
        title={
          confirming
            ? dict.common.confirm
            : dict.scoreboard.editTargetTitle
        }
      >
        {!confirming ? (
          <>
            <div className="chip-row" role="group" aria-label={dict.scoreboard.editTarget}>
              {TARGET_SCORE_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className="chip"
                  aria-pressed={!useCustom && Number(draft) === n}
                  onClick={() => {
                    setUseCustom(false);
                    setDraft(String(n));
                  }}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                className="chip"
                aria-pressed={useCustom}
                onClick={() => setUseCustom(true)}
              >
                {dict.newGame.customTarget}
              </button>
            </div>
            {useCustom && (
              <div className="field" style={{ marginTop: 12 }}>
                <label htmlFor="edit-target-custom">
                  {dict.newGame.customTarget}
                </label>
                <input
                  id="edit-target-custom"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={draft}
                  onChange={(e) =>
                    setDraft(e.target.value.replace(/\D/g, '').slice(0, 5))
                  }
                />
              </div>
            )}
            <button
              type="button"
              className="btn btn--primary btn--lg btn--block"
              style={{ marginTop: 16 }}
              disabled={!canProceed}
              onClick={requestChange}
            >
              {dict.scoreboard.editTarget}
            </button>
          </>
        ) : (
          <>
            <p style={{ marginTop: 0, lineHeight: 1.45 }}>
              {t(dict, dict.scoreboard.editTargetConfirm, {
                from: current,
                to: resolved,
                initial,
              })}
            </p>
            <button
              type="button"
              className="btn btn--primary btn--lg btn--block"
              onClick={applyChange}
            >
              {dict.scoreboard.editTargetSave}
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--block"
              style={{ marginTop: 8 }}
              onClick={() => setConfirming(false)}
            >
              {dict.common.cancel}
            </button>
          </>
        )}
      </BottomSheet>
    </>
  );
}
