import { useEffect, useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import { useAppStore } from '../../hooks/useAppStore';

const DISMISS_KEY = 'capicuu:install-banner-dismissed';

type InstallBannerProps = {
  onAdd: () => void;
};

export function InstallBanner({ onAdd }: InstallBannerProps) {
  const { dict } = useAppStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      /* ignore */
    }
    const timer = window.setTimeout(() => setVisible(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="install-banner" role="region" aria-label={dict.install.bannerTitle}>
      <div className="install-banner__body">
        <Smartphone size={22} aria-hidden className="install-banner__icon" />
        <div className="install-banner__text">
          <strong>{dict.install.bannerTitle}</strong>
          <span>{dict.install.bannerBody}</span>
        </div>
      </div>
      <div className="install-banner__actions">
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={onAdd}
        >
          {dict.install.bannerCta}
        </button>
        <button
          type="button"
          className="install-banner__close"
          onClick={dismiss}
          aria-label={dict.common.close}
        >
          <X size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}
