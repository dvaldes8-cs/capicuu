import { Share } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { useAppStore } from '../../hooks/useAppStore';

type InstallAppSheetProps = {
  open: boolean;
  onClose: () => void;
  mode: 'ios' | 'unavailable' | 'installed';
};

export function InstallAppSheet({ open, onClose, mode }: InstallAppSheetProps) {
  const { dict } = useAppStore();

  const title =
    mode === 'installed'
      ? dict.install.installedTitle
      : dict.install.howTitle;

  const body =
    mode === 'installed'
      ? dict.install.alreadyInstalled
      : mode === 'ios'
        ? dict.install.iosSteps
        : dict.install.manualSteps;

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <p style={{ marginTop: 0, lineHeight: 1.5, color: 'var(--text-muted)' }}>
        {body}
      </p>
      {mode === 'ios' && (
        <p className="install-ios-tip">
          <Share size={18} aria-hidden />
          <span>{dict.install.iosShareHint}</span>
        </p>
      )}
      <button
        type="button"
        className="btn btn--primary btn--block btn--lg"
        onClick={onClose}
      >
        {dict.common.close}
      </button>
    </BottomSheet>
  );
}
