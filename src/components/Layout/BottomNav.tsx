import { useEffect, useState } from 'react';
import {
  Download,
  History,
  Moon,
  PlusCircle,
  Settings,
  Sun,
  Trophy,
} from 'lucide-react';
import { useAppStore, type TabId } from '../../hooks/useAppStore';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { InstallAppSheet } from './InstallAppSheet';

const items: {
  id: TabId;
  icon: typeof Trophy;
  labelKey: keyof ReturnType<typeof useAppStore>['dict']['nav'];
}[] = [
  { id: 'scoreboard', icon: Trophy, labelKey: 'scoreboard' },
  { id: 'new', icon: PlusCircle, labelKey: 'newGame' },
  { id: 'history', icon: History, labelKey: 'history' },
  { id: 'settings', icon: Settings, labelKey: 'settings' },
];

function resolveTheme(theme: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  if (theme === 'light' || theme === 'dark') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function BottomNav() {
  const { tab, setTab, dict, data, updatePreferences } = useAppStore();
  const { installed, ios, promptInstall } = usePwaInstall();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<
    'ios' | 'unavailable' | 'installed'
  >('ios');
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>(() =>
    resolveTheme(data.preferences.theme),
  );

  useEffect(() => {
    setActiveTheme(resolveTheme(data.preferences.theme));
    if (data.preferences.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setActiveTheme(resolveTheme('system'));
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [data.preferences.theme]);

  const isDark = activeTheme === 'dark';

  const onInstall = async () => {
    if (installed) {
      setSheetMode('installed');
      setSheetOpen(true);
      return;
    }
    const outcome = await promptInstall();
    if (outcome === 'ios') {
      setSheetMode('ios');
      setSheetOpen(true);
      return;
    }
    if (outcome === 'unavailable') {
      setSheetMode(ios ? 'ios' : 'unavailable');
      setSheetOpen(true);
    }
  };

  const toggleTheme = () => {
    updatePreferences({ theme: isDark ? 'light' : 'dark' });
  };

  return (
    <>
      <nav className="bottom-nav" aria-label="Capicuu">
        <div className="bottom-nav__inner bottom-nav__inner--six">
          {items.map(({ id, icon: Icon, labelKey }) => (
            <button
              key={id}
              type="button"
              className="bottom-nav__btn"
              aria-current={tab === id ? 'page' : undefined}
              onClick={() => setTab(id)}
            >
              <Icon aria-hidden strokeWidth={2.25} />
              <span>{dict.nav[labelKey]}</span>
            </button>
          ))}
          <button
            type="button"
            className="bottom-nav__btn"
            onClick={toggleTheme}
            aria-label={isDark ? dict.nav.day : dict.nav.night}
            aria-pressed={isDark}
          >
            {isDark ? (
              <Sun aria-hidden strokeWidth={2.25} />
            ) : (
              <Moon aria-hidden strokeWidth={2.25} />
            )}
            <span>{isDark ? dict.nav.day : dict.nav.night}</span>
          </button>
          <button
            type="button"
            className="bottom-nav__btn"
            onClick={() => void onInstall()}
            aria-label={dict.nav.install}
          >
            <Download aria-hidden strokeWidth={2.25} />
            <span>{installed ? dict.nav.installed : dict.nav.install}</span>
          </button>
        </div>
      </nav>

      <InstallAppSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        mode={sheetMode}
      />
    </>
  );
}
