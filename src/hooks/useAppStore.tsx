import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  abandonGame,
  addPoints,
  createGame,
  deleteHand,
  editHand,
  ensureActiveGame,
  rematch as rematchGame,
  swapTeamPositions,
  undoLastHand,
  updateTargetScore,
  type NewGameInput,
} from '../domain/game';
import { computeScoreSummary } from '../domain/scoring';
import type { AppData, Game, HandType, Preferences } from '../domain/types';
import {
  loadAppData,
  saveAppData,
  emptyAppData,
  defaultPreferences,
} from '../storage/persistence';
import { getDictionary, type Dictionary } from '../i18n';

export type TabId = 'scoreboard' | 'new' | 'history' | 'settings';

interface AppStore {
  data: AppData;
  activeGame: Game | null;
  dict: Dictionary;
  tab: TabId;
  setTab: (tab: TabId) => void;
  storageError: string | null;
  clearStorageError: () => void;
  startGame: (input?: NewGameInput) => void;
  resumeGame: (gameId: string) => void;
  deleteGame: (gameId: string) => void;
  awardPoints: (
    teamId: string,
    points: number,
    handType?: HandType | HandType[],
  ) => { ok: true } | { ok: false; error: string };
  undo: () => void;
  removeHand: (handId: string) => void;
  updateHand: (
    handId: string,
    updates: {
      teamId?: string;
      basePoints?: number;
      handType?: HandType | HandType[];
      handTypes?: HandType[];
    },
  ) => { ok: true } | { ok: false; error: string };
  swapTeams: () => void;
  setTargetScore: (targetScore: number) => { ok: true } | { ok: false; error: string };
  doRematch: () => void;
  rematchFromId: (gameId: string) => void;
  updatePreferences: (partial: Partial<Preferences>) => void;
  resetAllData: () => void;
  dismissWinner: () => void;
  winnerDismissed: boolean;
}

const AppStoreContext = createContext<AppStore | null>(null);

function persist(data: AppData): string | null {
  const result = saveAppData(data);
  return result.ok ? null : result.error ?? 'storage_error';
}

function resolveTheme(theme: Preferences['theme']): 'light' | 'dark' {
  if (theme === 'light' || theme === 'dark') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [tab, setTab] = useState<TabId>('scoreboard');
  const [storageError, setStorageError] = useState<string | null>(null);
  const [winnerDismissed, setWinnerDismissed] = useState(false);
  const submitLock = useRef(false);

  const activeGame =
    data.games.find((g) => g.id === data.activeGameId) ?? null;

  const dict = useMemo(
    () => getDictionary(data.preferences.language),
    [data.preferences.language],
  );

  const commit = useCallback((next: AppData) => {
    setData(next);
    const err = persist(next);
    setStorageError(err);
  }, []);

  // Theme application
  useEffect(() => {
    const apply = () => {
      document.documentElement.setAttribute(
        'data-theme',
        resolveTheme(data.preferences.theme),
      );
    };
    apply();
    if (data.preferences.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => apply();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [data.preferences.theme]);

  // Document language
  useEffect(() => {
    document.documentElement.lang = data.preferences.language;
  }, [data.preferences.language]);

  // Reset winner dismiss when game / winner changes
  useEffect(() => {
    setWinnerDismissed(false);
  }, [activeGame?.id, activeGame?.winnerId, activeGame?.hands.length]);

  const patchActiveGame = useCallback(
    (updater: (game: Game) => Game) => {
      setData((prev) => {
        if (!prev.activeGameId) return prev;
        const games = prev.games.map((g) =>
          g.id === prev.activeGameId ? updater(g) : g,
        );
        const next = { ...prev, games };
        const err = persist(next);
        setStorageError(err);
        return next;
      });
    },
    [],
  );

  const startGame = useCallback(
    (input?: NewGameInput) => {
      setData((prev) => {
        const prefs = prev.preferences;
        const game = createGame({
          team1Name: input?.team1Name ?? prefs.defaultTeamNames[0],
          team2Name: input?.team2Name ?? prefs.defaultTeamNames[1],
          targetScore: input?.targetScore ?? prefs.defaultTargetScore,
          preset: input?.preset ?? prefs.defaultPreset,
          scoringRules: input?.scoringRules,
        });

        // Preserve unfinished active game as abandoned only if it has hands;
        // otherwise remove empty draft.
        let games = prev.games.map((g) => {
          if (g.id === prev.activeGameId && g.status === 'active') {
            if (g.hands.length === 0) return null;
            return abandonGame(g);
          }
          return g;
        }).filter((g): g is Game => g !== null);

        games = [game, ...games];
        const next: AppData = {
          ...prev,
          games,
          activeGameId: game.id,
        };
        const err = persist(next);
        setStorageError(err);
        return next;
      });
      setWinnerDismissed(false);
      setTab('scoreboard');
    },
    [],
  );

  const resumeGame = useCallback((gameId: string) => {
    setData((prev) => {
      const games = prev.games.map((g) => {
        if (g.id === gameId && g.status === 'abandoned') {
          return { ...g, status: 'active' as const, updatedAt: new Date().toISOString() };
        }
        if (
          g.id === prev.activeGameId &&
          g.id !== gameId &&
          g.status === 'active' &&
          g.hands.length > 0
        ) {
          return abandonGame(g);
        }
        return g;
      });
      const next = { ...prev, games, activeGameId: gameId };
      const err = persist(next);
      setStorageError(err);
      return next;
    });
    setTab('scoreboard');
  }, []);

  const deleteGame = useCallback((gameId: string) => {
    setData((prev) => {
      const games = prev.games.filter((g) => g.id !== gameId);
      const activeGameId =
        prev.activeGameId === gameId
          ? games.find((g) => g.status === 'active')?.id ?? null
          : prev.activeGameId;
      const next = { ...prev, games, activeGameId };
      const err = persist(next);
      setStorageError(err);
      return next;
    });
  }, []);

  const awardPoints = useCallback(
    (
      teamId: string,
      points: number,
      handType: HandType | HandType[] = 'normal',
    ): { ok: true } | { ok: false; error: string } => {
      if (submitLock.current) return { ok: false, error: 'duplicate' };
      submitLock.current = true;
      window.setTimeout(() => {
        submitLock.current = false;
      }, 400);

      let result: { ok: true } | { ok: false; error: string } = {
        ok: false,
        error: 'no_game',
      };

      setData((prev) => {
        const game = prev.games.find((g) => g.id === prev.activeGameId);
        if (!game) {
          result = { ok: false, error: 'no_game' };
          return prev;
        }
        const outcome = addPoints(game, teamId, points, handType);
        if ('error' in outcome) {
          result = { ok: false, error: outcome.error };
          return prev;
        }
        result = { ok: true };
        const games = prev.games.map((g) =>
          g.id === game.id ? outcome.game : g,
        );
        const next = { ...prev, games };
        const err = persist(next);
        setStorageError(err);
        return next;
      });

      return result;
    },
    [],
  );

  const undo = useCallback(() => {
    patchActiveGame(undoLastHand);
  }, [patchActiveGame]);

  const removeHand = useCallback(
    (handId: string) => {
      patchActiveGame((g) => deleteHand(g, handId));
    },
    [patchActiveGame],
  );

  const updateHand = useCallback(
    (
      handId: string,
      updates: {
        teamId?: string;
        basePoints?: number;
        handType?: HandType | HandType[];
        handTypes?: HandType[];
      },
    ): { ok: true } | { ok: false; error: string } => {
      let result: { ok: true } | { ok: false; error: string } = {
        ok: false,
        error: 'no_game',
      };
      setData((prev) => {
        const game = prev.games.find((g) => g.id === prev.activeGameId);
        if (!game) return prev;
        const outcome = editHand(game, handId, updates);
        if ('error' in outcome) {
          result = { ok: false, error: outcome.error };
          return prev;
        }
        result = { ok: true };
        const games = prev.games.map((g) =>
          g.id === game.id ? outcome.game : g,
        );
        const next = { ...prev, games };
        const err = persist(next);
        setStorageError(err);
        return next;
      });
      return result;
    },
    [],
  );

  const swapTeams = useCallback(() => {
    patchActiveGame(swapTeamPositions);
  }, [patchActiveGame]);

  const setTargetScore = useCallback((targetScore: number) => {
    const target = Math.floor(targetScore);
    if (target < 1) return { ok: false as const, error: 'invalid' };
    let result: { ok: true } | { ok: false; error: string } = {
      ok: false,
      error: 'no_game',
    };
    setData((prev) => {
      const game = prev.games.find((g) => g.id === prev.activeGameId);
      if (!game) return prev;
      const updated = updateTargetScore(game, target);
      result = { ok: true };
      const games = prev.games.map((g) => (g.id === game.id ? updated : g));
      const next = { ...prev, games };
      const err = persist(next);
      setStorageError(err);
      return next;
    });
    return result;
  }, []);

  const doRematch = useCallback(() => {
    setData((prev) => {
      const current = prev.games.find((g) => g.id === prev.activeGameId);
      if (!current) return prev;
      const nextGame = rematchGame(current);
      const games = [nextGame, ...prev.games];
      const next = { ...prev, games, activeGameId: nextGame.id };
      const err = persist(next);
      setStorageError(err);
      return next;
    });
    setWinnerDismissed(false);
    setTab('scoreboard');
  }, []);

  const rematchFromId = useCallback((gameId: string) => {
    setData((prev) => {
      const current = prev.games.find((g) => g.id === gameId);
      if (!current) return prev;
      const nextGame = rematchGame(current);
      const games = [nextGame, ...prev.games];
      const next = { ...prev, games, activeGameId: nextGame.id };
      const err = persist(next);
      setStorageError(err);
      return next;
    });
    setWinnerDismissed(false);
    setTab('scoreboard');
  }, []);

  const updatePreferences = useCallback((partial: Partial<Preferences>) => {
    setData((prev) => {
      const next = {
        ...prev,
        preferences: { ...prev.preferences, ...partial },
      };
      const err = persist(next);
      setStorageError(err);
      return next;
    });
  }, []);

  const resetAllData = useCallback(() => {
    const next = ensureActiveGame({
      ...emptyAppData(),
      preferences: defaultPreferences(),
    });
    commit(next);
    setTab('scoreboard');
  }, [commit]);

  const value: AppStore = {
    data,
    activeGame,
    dict,
    tab,
    setTab,
    storageError,
    clearStorageError: () => setStorageError(null),
    startGame,
    resumeGame,
    deleteGame,
    awardPoints,
    undo,
    removeHand,
    updateHand,
    swapTeams,
    setTargetScore,
    doRematch,
    rematchFromId,
    updatePreferences,
    resetAllData,
    dismissWinner: () => setWinnerDismissed(true),
    winnerDismissed,
  };

  return (
    <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
  );
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider');
  return ctx;
}

export function useActiveSummary() {
  const { activeGame } = useAppStore();
  return useMemo(
    () => (activeGame ? computeScoreSummary(activeGame) : null),
    [activeGame],
  );
}
