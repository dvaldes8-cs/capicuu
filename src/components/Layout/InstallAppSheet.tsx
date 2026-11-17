import { useState } from 'react';
import { Check, Copy, Share2, Share, Smartphone } from 'lucide-react';
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

function appUrl(): string {
  if (typeof window === 'undefined') return '';
  const { origin, pathname } = window.location;
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return `${origin}${path}`;
}

export function InstallAppSheet({
  open,
  onClose,
  platform,
  canPrompt,
  onPromptInstall,
}: InstallAppSheetProps) {
  const { dict } = useAppStore();
  const [copied, setCopied] = useState(false);
  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const onCopy = async () => {
    const url = appUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt(dict.install.copyLink, url);
    }
  };

  const onShare = async () => {
    const url = appUrl();
    try {
      await navigator.share({
        title: dict.appName,
        text: dict.install.shareText,
        url,
      });
    } catch {
      /* user cancelled or share failed */
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={dict.install.howTitle}>
      <p className="install-intro">{dict.install.intro}</p>

      <div className="install-share-row">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => void onCopy()}
        >
          {copied ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
          {copied ? dict.install.linkCopied : dict.install.copyLink}
        </button>
        {canNativeShare && (
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => void onShare()}
          >
            <Share2 size={18} aria-hidden />
            {dict.install.shareLink}
          </button>
        )}
      </div>

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
