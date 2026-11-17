import { TARGET_SCORE_OPTIONS } from '../../domain/presets';
import type { Language, RegionalPreset, Theme } from '../../domain/types';
import { APP_VERSION } from '../../config';
import { SupportSection } from './SupportSection';
import { SpecialRulesEditor } from './SpecialRulesEditor';
import { useAppStore } from '../../hooks/useAppStore';
import { t } from '../../i18n';
import { Logo } from '../Brand/Logo';

export function SettingsPage() {
  const {
    data,
    dict,
    activeGame,
    updatePreferences,
    updateActiveScoringRules,
    resetAllData,
  } = useAppStore();
  const prefs = data.preferences;

  return (
    <div>
      <h1 className="page-title">{dict.settings.title}</h1>

      <section className="settings-section">
        <h2>{dict.settings.language}</h2>
        <div className="chip-row" role="group" aria-label={dict.settings.language}>
          {(['es', 'en'] as Language[]).map((lang) => (
            <button
              key={lang}
              type="button"
              className="chip"
              aria-pressed={prefs.language === lang}
              onClick={() => updatePreferences({ language: lang })}
            >
              {dict.settings.languages[lang]}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2>{dict.settings.theme}</h2>
        <div className="chip-row" role="group" aria-label={dict.settings.theme}>
          {(['light', 'dark', 'system'] as Theme[]).map((theme) => (
            <button
              key={theme}
              type="button"
              className="chip"
              aria-pressed={prefs.theme === theme}
              onClick={() => updatePreferences({ theme })}
            >
              {dict.settings.themes[theme]}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2>{dict.settings.defaultTarget}</h2>
        <div className="chip-row" role="group">
          {TARGET_SCORE_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              className="chip"
              aria-pressed={prefs.defaultTargetScore === n}
              onClick={() => updatePreferences({ defaultTargetScore: n })}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2>{dict.settings.defaultPreset}</h2>
        <div className="chip-row" role="group">
          {(
            ['puertorriqueno', 'dominicano', 'personalizado'] as RegionalPreset[]
          ).map((p) => (
            <button
              key={p}
              type="button"
              className="chip"
              aria-pressed={prefs.defaultPreset === p}
              onClick={() => updatePreferences({ defaultPreset: p })}
            >
              {dict.newGame.presets[p]}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2>{dict.settings.specialRules}</h2>
        {activeGame ? (
          <SpecialRulesEditor
            rules={activeGame.scoringRules}
            onChange={updateActiveScoringRules}
          />
        ) : (
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              marginTop: 0,
            }}
          >
            {dict.settings.specialRulesNoGame}
          </p>
        )}
      </section>

      <section className="settings-section">
        <div className="settings-row">
          <label id="vib-label">{dict.settings.vibration}</label>
          <button
            type="button"
            className="toggle"
            role="switch"
            aria-checked={prefs.vibrationEnabled}
            aria-labelledby="vib-label"
            onClick={() =>
              updatePreferences({ vibrationEnabled: !prefs.vibrationEnabled })
            }
          />
        </div>
        <div className="settings-row">
          <label id="victory-sound-label">{dict.settings.victorySound}</label>
          <button
            type="button"
            className="toggle"
            role="switch"
            aria-checked={prefs.victorySoundEnabled}
            aria-labelledby="victory-sound-label"
            onClick={() =>
              updatePreferences({
                victorySoundEnabled: !prefs.victorySoundEnabled,
              })
            }
          />
        </div>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            margin: '0 0 8px',
          }}
        >
          {dict.settings.victorySoundHint}
        </p>
        <div className="settings-row">
          <label id="confirm-label">{dict.settings.confirmReset}</label>
          <button
            type="button"
            className="toggle"
            role="switch"
            aria-checked={prefs.confirmReset}
            aria-labelledby="confirm-label"
            onClick={() =>
              updatePreferences({ confirmReset: !prefs.confirmReset })
            }
          />
        </div>
      </section>

      <section className="settings-section">
        <h2>{dict.settings.about}</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <Logo size={48} />
          <div>
            <strong>Capicuu</strong>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {t(dict, dict.settings.version, { v: APP_VERSION })}
            </div>
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
          {dict.settings.aboutBody}
        </p>
      </section>

      <SupportSection />

      <button
        type="button"
        className="btn btn--danger btn--block"
        style={{ marginTop: 24 }}
        onClick={() => {
          const ok = prefs.confirmReset
            ? window.confirm(dict.settings.resetConfirm)
            : true;
          if (ok) resetAllData();
        }}
      >
        {dict.settings.resetData}
      </button>
    </div>
  );
}
