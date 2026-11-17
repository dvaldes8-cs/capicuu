import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  usePwaInstall,
  type InstallPlatform,
} from '../../hooks/usePwaInstall';
import { InstallAppSheet } from './InstallAppSheet';
import { InstallBanner } from './InstallBanner';

type InstallContextValue = {
  showInstall: boolean;
  platform: InstallPlatform;
  openInstall: () => void;
};

const InstallContext = createContext<InstallContextValue | null>(null);

export function InstallProvider({ children }: { children: ReactNode }) {
  const { platform, canPrompt, showInstall, promptInstall } = usePwaInstall();
  const [sheetOpen, setSheetOpen] = useState(false);

  const openInstall = useCallback(() => setSheetOpen(true), []);

  const onPromptInstall = useCallback(async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') setSheetOpen(false);
  }, [promptInstall]);

  const value = useMemo(
    () => ({ showInstall, platform, openInstall }),
    [showInstall, platform, openInstall],
  );

  return (
    <InstallContext.Provider value={value}>
      {children}
      {showInstall && (
        <InstallBanner onAdd={openInstall} />
      )}
      <InstallAppSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        platform={platform}
        canPrompt={canPrompt}
        onPromptInstall={onPromptInstall}
      />
    </InstallContext.Provider>
  );
}

export function useInstall(): InstallContextValue {
  const ctx = useContext(InstallContext);
  if (!ctx) {
    throw new Error('useInstall must be used within InstallProvider');
  }
  return ctx;
}
