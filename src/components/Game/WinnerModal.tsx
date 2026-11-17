import { useEffect, useState } from 'react';
import { VolumeX } from 'lucide-react';
import { Logo } from '../Brand/Logo';
import { BottomSheet } from '../ui/BottomSheet';
import { SupportLink } from '../Settings/SupportSection';
import { useActiveSummary, useAppStore } from '../../hooks/useAppStore';
import { t } from '../../i18n';
import { hasBuyMeACoffee } from '../../config';
import {
  playVictoryJingle,
  stopVictoryJingle,
} from '../../audio/victoryJingle';
import { WinnerCelebration } from './WinnerCelebration';

export function WinnerModal() {
  const {
    activeGame,
    dict,
    data,
    winnerDismissed,
    dismissWinner,
    doRematch,
    setTab,
    updatePreferences,
  } = useAppStore();
  const summary = useActiveSummary();
  const [justMuted, setJustMuted] = useState(false);

  const open =
    !!activeGame &&
    !!summary?.isComplete &&
    !!summary.winnerId &&
    !winnerDismissed;

  const soundOn = data.preferences.victorySoundEnabled;

  useEffect(() => {
    if (!open) {
      stopVictoryJingle();
      setJustMuted(false);
      return;
    }
    if (!soundOn) return;

    void playVictoryJingle();
    return () => stopVictoryJingle();
  }, [open, soundOn, activeGame?.id, summary?.winnerId]);

  const muteForFuture = () => {
    stopVictoryJingle();
    updatePreferences({ victorySoundEnabled: false });
    setJustMuted(true);
  };

  if (!activeGame || !summary) return null;

  const winner = summary.teams.find((t) => t.teamId === summary.winnerId);
  const scores = summary.teams.map((t) => t.total).join(' — ');

  const celebrationSeed =
    (activeGame?.hands.length ?? 0) +
    (summary?.winnerId?.charCodeAt(0) ?? 1);

  return (
    <>
      <WinnerCelebration active={open} seed={celebrationSeed || 1} />
      <BottomSheet
        open={open}
        onClose={dismissWinner}
        title={dict.winner.title}
        centered
      >
      <div className="winner-screen">
        <div className="winner-screen__logo">
          <Logo size={72} />
        </div>
        <h2 aria-live="assertive">{dict.winner.title}</h2>
        <p className="winner-screen__team">
          {t(dict, dict.winner.won, { team: winner?.name ?? '' })}
        </p>
        <div className="winner-screen__score">{scores}</div>

        {soundOn && !justMuted && (
          <button
            type="button"
            className="btn btn--ghost btn--block winner-mute"
            onClick={muteForFuture}
          >
            <VolumeX size={18} aria-hidden />
            {dict.winner.muteMusic}
          </button>
        )}
        {justMuted && (
          <p className="winner-muted" role="status">
            {dict.winner.mutedSaved}
          </p>
        )}

        <div className="winner-actions">
          <button
            type="button"
            className="btn btn--primary btn--lg btn--block"
            onClick={doRematch}
          >
            {dict.winner.rematch}
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--block"
            onClick={dismissWinner}
          >
            {dict.winner.viewResults}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={() => {
              dismissWinner();
              setTab('new');
            }}
          >
            {dict.winner.newGame}
          </button>
          {hasBuyMeACoffee && (
            <SupportLink label={dict.winner.support} subtle />
          )}
        </div>
      </div>
      </BottomSheet>
    </>
  );
}
