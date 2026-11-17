import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { appPublicUrl, shareResult } from '../../share/shareResult';
import { t } from '../../i18n';
import { useAppStore } from '../../hooks/useAppStore';

type TeamScore = {
  name: string;
  score: number;
};

type ShareResultButtonProps = {
  winnerName: string;
  teams: TeamScore[];
  className?: string;
};

export function ShareResultButton({
  winnerName,
  teams,
  className = 'btn btn--secondary btn--block',
}: ShareResultButtonProps) {
  const { dict } = useAppStore();
  const [copied, setCopied] = useState(false);

  const scores = teams.map((t) => `${t.name} ${t.score}`).join(' — ');

  const onShare = async () => {
    const url = appPublicUrl();
    const text = t(dict, dict.winner.shareText, {
      winner: winnerName,
      scores,
    });
    const outcome = await shareResult({
      title: dict.winner.title,
      text,
      url,
    });
    if (outcome === 'copied') {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button type="button" className={className} onClick={() => void onShare()}>
      {copied ? (
        <>
          <Check size={18} aria-hidden />
          {dict.winner.shareCopied}
        </>
      ) : (
        <>
          <Share2 size={18} aria-hidden />
          {dict.winner.share}
        </>
      )}
    </button>
  );
}
