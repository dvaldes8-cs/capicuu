import { Coffee } from 'lucide-react';
import { BUY_ME_A_COFFEE_URL, hasBuyMeACoffee } from '../../config';
import { useAppStore } from '../../hooks/useAppStore';

type SupportLinkProps = {
  label?: string;
  subtle?: boolean;
};

export function SupportLink({ label, subtle }: SupportLinkProps) {
  const { dict } = useAppStore();
  if (!hasBuyMeACoffee) return null;

  return (
    <a
      href={BUY_ME_A_COFFEE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={subtle ? 'btn btn--ghost btn--block' : 'btn btn--secondary btn--block'}
    >
      <Coffee size={18} aria-hidden />
      {label ?? dict.support.button}
    </a>
  );
}

export function SupportSection() {
  const { dict } = useAppStore();

  return (
    <section className="support-card" aria-labelledby="support-heading">
      <h3 id="support-heading">{dict.support.title}</h3>
      <p>{dict.support.body}</p>
      {hasBuyMeACoffee ? (
        <SupportLink />
      ) : (
        <p className="sr-only">Support link not configured.</p>
      )}
    </section>
  );
}
