import { getTeamTotal } from '../../domain/scoring';
import { ShareResultButton } from '../Game/ShareResultButton';
import { SupportSection } from '../Settings/SupportSection';
import { useAppStore } from '../../hooks/useAppStore';
import { t } from '../../i18n';

function formatDate(iso: string, lang: string): string {
  try {
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-PR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function GameHistoryPage() {
  const { data, dict, resumeGame, deleteGame, rematchFromId, setTab } =
    useAppStore();

  const games = [...data.games].sort(
    (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  );

  const statusLabel = (status: string) => {
    if (status === 'completed') return dict.history.completed;
    if (status === 'active') return dict.history.active;
    return dict.history.abandoned;
  };

  return (
    <div>
      <h1 className="page-title">{dict.history.title}</h1>

      {games.length === 0 ? (
        <p className="empty-state">{dict.history.empty}</p>
      ) : (
        <ul className="history-list">
          {games.map((game) => {
            const ordered = [...game.teams].sort(
              (a, b) => a.displayOrder - b.displayOrder,
            );
            const s1 = getTeamTotal(game, ordered[0].id);
            const s2 = getTeamTotal(game, ordered[1].id);
            const winner = game.winnerId
              ? game.teams.find((t) => t.id === game.winnerId)?.name
              : null;

            return (
              <li key={game.id} className="history-card">
                <div className="history-card__scores">
                  {ordered[0].name} {s1} — {ordered[1].name} {s2}
                </div>
                <div className="history-card__meta">
                  {formatDate(game.updatedAt, data.preferences.language)}
                  {' · '}
                  {statusLabel(game.status)}
                  {' · '}
                  {t(dict, dict.history.hands, { n: game.hands.length })}
                  {winner
                    ? ` · ${t(dict, dict.history.winner, { team: winner })}`
                    : ''}
                </div>
                <div className="history-card__actions">
                  {(game.status === 'active' ||
                    game.status === 'abandoned') && (
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => resumeGame(game.id)}
                    >
                      {dict.history.resume}
                    </button>
                  )}
                  {game.status === 'completed' && (
                    <>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => rematchFromId(game.id)}
                      >
                        {dict.history.rematch}
                      </button>
                      <ShareResultButton
                        winnerName={winner ?? ''}
                        teams={ordered.map((team) => ({
                          name: team.name,
                          score: getTeamTotal(game, team.id),
                        }))}
                        className="btn btn--secondary"
                      />
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => {
                          resumeGame(game.id);
                          setTab('scoreboard');
                        }}
                      >
                        {dict.winner.viewResults}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={() => {
                      if (window.confirm(dict.history.deleteConfirm)) {
                        deleteGame(game.id);
                      }
                    }}
                  >
                    {dict.history.delete}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <SupportSection />
    </div>
  );
}
