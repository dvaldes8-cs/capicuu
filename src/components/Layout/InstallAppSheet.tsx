import { Share, Smartphone } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { useAppStore } from '../../hooks/useAppStore';
import type { InstallPlatform } from '../../hooks/usePwaInstall';

type InstallAppSheetProps = {
  open: boolean;
  onClose: () => void;
  platform: InstallPlatform;
  canPrompt: boolean;
  onPromptInstall: () => Promise<void>;
};

export function InstallAppSheet({
  open,
  onClose,
  platform,
  canPrompt,
  onPromptInstall,
}: InstallAppSheetProps) {
  const { dict } = useAppStore();

  return (
    <BottomSheet open={open} onClose={onClose} title={dict.install.howTitle}>
      <p className="install-intro">{dict.install.intro}</p>

      <section
        className={
          platform === 'ios'
            ? 'install-platform install-platform--active'
            : 'install-platform'
        }
      >
        <h3 className="install-platform__title">
          <Smartphone size={18} aria-hidden />
          {dict.install.iphoneTitle}
          {platform === 'ios' ? (
            <span className="install-platform__badge">
              {dict.install.thisDevice}
            </span>
          ) : null}
        </h3>
        <ol className="install-steps">
          <li>{dict.install.iphoneStep1}</li>
          <li>{dict.install.iphoneStep2}</li>
          <li>{dict.install.iphoneStep3}</li>
        </ol>
        <p className="install-ios-tip">
          <Share size={18} aria-hidden />
          <span>{dict.install.iosShareHint}</span>
        </p>
      </section>

      <section
        className={
          platform === 'android'
            ? 'install-platform install-platform--active'
            : 'install-platform'
        }
      >
        <h3 className="install-platform__title">
          <Smartphone size={18} aria-hidden />
          {dict.install.androidTitle}
          {platform === 'android' ? (
            <span className="install-platform__badge">
              {dict.install.thisDevice}
            </span>
          ) : null}
        </h3>
        <ol className="install-steps">
          <li>{dict.install.androidStep1}</li>
          <li>{dict.install.androidStep2}</li>
          <li>{dict.install.androidStep3}</li>
        </ol>
      </section>

      {canPrompt && (
        <button
          type="button"
          className="btn btn--primary btn--block btn--lg"
          onClick={() => void onPromptInstall()}
        >
          {dict.install.installNow}
        </button>
      )}
      <button
        type="button"
        className={
          canPrompt
            ? 'btn btn--secondary btn--block'
            : 'btn btn--primary btn--block btn--lg'
        }
        onClick={onClose}
        style={canPrompt ? { marginTop: 8 } : undefined}
      >
        {dict.common.close}
      </button>
    </BottomSheet>
  );
}
