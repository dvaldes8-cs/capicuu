import { useState } from 'react';
import { createScoringRules, TARGET_SCORE_OPTIONS } from '../../domain/presets';
import type { ScoringRules } from '../../domain/types';
import { useAppStore } from '../../hooks/useAppStore';
import { SpecialRulesEditor } from '../Settings/SpecialRulesEditor';

export function NewGamePage() {
  const { dict, data, activeGame, startGame, setTab } = useAppStore();
  const prefs = data.preferences;

  const [team1, setTeam1] = useState(prefs.defaultTeamNames[0]);
  const [team2, setTeam2] = useState(prefs.defaultTeamNames[1]);
  const [target, setTarget] = useState(prefs.defaultTargetScore);
  const [custom, setCustom] = useState('');
  const [useCustom, setUseCustom] = useState(
    !TARGET_SCORE_OPTIONS.includes(
      prefs.defaultTargetScore as (typeof TARGET_SCORE_OPTIONS)[number],
    ),
  );
  const [rules, setRules] = useState<ScoringRules>(() =>
    createScoringRules(prefs.defaultPreset),
  );

  const hasActive =
    !!activeGame &&
    activeGame.status === 'active' &&
    activeGame.hands.length > 0;

  const resolvedTarget = useCustom
    ? Math.max(1, Math.floor(Number(custom) || 0))
    : target;

  const onStart = () => {
    if (useCustom && (!custom || Number(custom) < 1)) return;
    startGame({
      team1Name: team1,
      team2Name: team2,
      targetScore: resolvedTarget,
      preset: prefs.defaultPreset,
      scoringRules: { ...rules, preset: prefs.defaultPreset },
    });
  };

  return (
    <div>
      <h1 className="page-title">{dict.newGame.title}</h1>

      {hasActive && (
        <div
          className="support-card"
          style={{ marginTop: 0, marginBottom: 16 }}
          role="status"
        >
          <p style={{ margin: '0 0 12px' }}>{dict.newGame.activeWarning}</p>
          <button
            type="button"
            className="btn btn--secondary btn--block"
            onClick={() => setTab('scoreboard')}
          >
            {dict.newGame.continueActive}
          </button>
        </div>
      )}

      <div className="field">
        <label htmlFor="team1">{dict.newGame.team1}</label>
        <input
          id="team1"
          value={team1}
          maxLength={24}
          onChange={(e) => setTeam1(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="field">
        <label htmlFor="team2">{dict.newGame.team2}</label>
        <input
          id="team2"
          value={team2}
          maxLength={24}
          onChange={(e) => setTeam2(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="field">
        <span id="target-label">{dict.newGame.target}</span>
        <div className="chip-row" role="group" aria-labelledby="target-label">
          {TARGET_SCORE_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              className="chip"
              aria-pressed={!useCustom && target === n}
              onClick={() => {
                setUseCustom(false);
                setTarget(n);
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
          <input
            style={{ marginTop: 8 }}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="200"
            value={custom}
            onChange={(e) =>
              setCustom(e.target.value.replace(/\D/g, '').slice(0, 5))
            }
            aria-label={dict.newGame.customTarget}
          />
        )}
      </div>

      <section className="settings-section">
        <SpecialRulesEditor rules={rules} onChange={setRules} />
      </section>

      <button
        type="button"
        className="btn btn--primary btn--lg btn--block"
        onClick={onStart}
        disabled={useCustom && resolvedTarget < 1}
      >
        {dict.newGame.start}
      </button>
    </div>
  );
}
