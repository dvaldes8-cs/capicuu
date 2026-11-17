import { useEffect, useId, type ReactNode } from 'react';

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  centered?: boolean;
  labelledBy?: string;
};

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  centered = false,
  labelledBy,
}: BottomSheetProps) {
  const titleId = useId();
  const labelId = labelledBy ?? titleId;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`sheet-backdrop${centered ? ' modal-center' : ''}`}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
      >
        {!centered && <div className="sheet__handle" aria-hidden />}
        <h2 className="sheet__title" id={titleId}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
