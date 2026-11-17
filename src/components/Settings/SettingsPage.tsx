import { TARGET_SCORE_OPTIONS } from '../../domain/presets';
import type { Language, Theme } from '../../domain/types';
import { APP_VERSION } from '../../config';
import { SupportSection } from './SupportSection';
import { useAppStore } from '../../hooks/useAppStore';
import { t } from '../../i18n';
import { Logo } from '../Brand/Logo';

function ChipGroup<T extends string | number>({
  label,
  value,
  options,
  getLabel,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  getLabel?: (option: T) => string;
  onChange: (option: T) => void;
}) {
  return (
    <section className="settings-section">
      <h2>{label}</h2>
      <div className="chip-row" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={String(option)}
            type="button"
            className="chip"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {getLabel ? getLabel(option) : option}
          </button>
        ))}
      </div>
    </section>
  );
}

export function SettingsPage() {
  const { data, dict, updatePreferences, resetAllData } = useAppStore();
  const prefs = data.preferences;

  return (
    <div>
      <h1 className="page-title">{dict.settings.title}</h1>

      <ChipGroup
        label={dict.settings.language}
        value={prefs.language}
        options={['es', 'en'] as const satisfies readonly Language[]}
        getLabel={(lang) => dict.settings.languages[lang]}
        onChange={(language) => updatePreferences({ language })}
      />

      <ChipGroup
        label={dict.settings.theme}
        value={prefs.theme}
        options={['light', 'dark', 'system'] as const satisfies readonly Theme[]}
        getLabel={(theme) => dict.settings.themes[theme]}
        onChange={(theme) => updatePreferences({ theme })}
      />

      <ChipGroup
        label={dict.settings.defaultTarget}
        value={prefs.defaultTargetScore}
        options={TARGET_SCORE_OPTIONS}
        onChange={(defaultTargetScore) =>
          updatePreferences({ defaultTargetScore })
        }
      />

      <section className="settings-section">
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
        <div className="about-brand">
          <Logo size={48} />
          <div>
            <strong>Capicuu</strong>
            <div className="about-brand__meta">
              {t(dict, dict.settings.version, { v: APP_VERSION })}
            </div>
          </div>
        </div>
        <p className="settings-hint">{dict.settings.aboutBody}</p>
      </section>

      <SupportSection />

      <button
        type="button"
        className="btn btn--danger btn--block settings-reset"
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
