import { SCHEMA_VERSION, type AppData, type Game, type HandType, type Preferences } from '../domain/types';
import { ensureActiveGame } from '../domain/game';
import { createScoringRules, DEFAULT_TARGET_SCORE } from '../domain/presets';
import { normalizeHandTypes } from '../domain/scoring';
import { DEFAULT_LANGUAGE, normalizeLanguage } from '../i18n/language';

export const STORAGE_KEY = 'capicuu:v1';

export function defaultPreferences(): Preferences {
  return {
    language: DEFAULT_LANGUAGE,
    theme: 'system',
    defaultTargetScore: DEFAULT_TARGET_SCORE,
    defaultPreset: 'puertorriqueno',
    defaultTeamNames: ['Nosotros', 'Ellos'],
    confirmReset: true,
    victorySoundEnabled: true,
    schemaVersion: SCHEMA_VERSION,
  };
}

export function emptyAppData(): AppData {
  return {
    schemaVersion: SCHEMA_VERSION,
    games: [],
    activeGameId: null,
    preferences: defaultPreferences(),
  };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Migrate / sanitize persisted data. Never throw — return safe defaults on corruption. */
export function migrateAppData(raw: unknown): AppData {
  const fallback = emptyAppData();
  if (!isObject(raw)) return fallback;

  try {
    const prefsRaw = isObject(raw.preferences) ? raw.preferences : {};
    const preferences: Preferences = {
      ...defaultPreferences(),
      language: normalizeLanguage(prefsRaw.language),
      theme:
        prefsRaw.theme === 'light' ||
        prefsRaw.theme === 'dark' ||
        prefsRaw.theme === 'system'
          ? prefsRaw.theme
          : 'system',
      defaultTargetScore:
        typeof prefsRaw.defaultTargetScore === 'number' &&
        prefsRaw.defaultTargetScore > 0
          ? Math.floor(prefsRaw.defaultTargetScore)
          : DEFAULT_TARGET_SCORE,
      defaultPreset:
        prefsRaw.defaultPreset === 'dominicano' ||
        prefsRaw.defaultPreset === 'personalizado' ||
        prefsRaw.defaultPreset === 'puertorriqueno'
          ? prefsRaw.defaultPreset
          : 'puertorriqueno',
      defaultTeamNames: Array.isArray(prefsRaw.defaultTeamNames)
        ? [
            String(prefsRaw.defaultTeamNames[0] || 'Nosotros').slice(0, 24),
            String(prefsRaw.defaultTeamNames[1] || 'Ellos').slice(0, 24),
          ]
        : ['Nosotros', 'Ellos'],
      confirmReset:
        typeof prefsRaw.confirmReset === 'boolean'
          ? prefsRaw.confirmReset
          : true,
      victorySoundEnabled:
        typeof prefsRaw.victorySoundEnabled === 'boolean'
          ? prefsRaw.victorySoundEnabled
          : true,
      schemaVersion: SCHEMA_VERSION,
    };

    const games: Game[] = Array.isArray(raw.games)
      ? raw.games
          .filter(isObject)
          .map((g) => sanitizeGame(g))
          .filter((g): g is Game => g !== null)
      : [];

    const activeGameId =
      typeof raw.activeGameId === 'string' &&
      games.some((g) => g.id === raw.activeGameId)
        ? raw.activeGameId
        : games.find((g) => g.status === 'active')?.id ?? null;

    return {
      schemaVersion: SCHEMA_VERSION,
      games,
      activeGameId,
      preferences,
    };
  } catch {
    return fallback;
  }
}

function mergeScoringRules(raw: Record<string, unknown>): Game['scoringRules'] {
  const base = createScoringRules(
    raw.preset === 'dominicano' ||
      raw.preset === 'personalizado' ||
      raw.preset === 'puertorriqueno'
      ? raw.preset
      : 'personalizado',
  );
  const rawBonuses = Array.isArray(raw.bonuses) ? raw.bonuses : [];
  const bonuses = base.bonuses.map((slot) => {
    const match = rawBonuses.find(
      (b) =>
        isObject(b) &&
        b.handType === slot.handType,
    );
    if (!match || !isObject(match)) return slot;
    const value = Math.max(0, Math.floor(Number(match.value) || 0));
    const enabled = Boolean(match.enabled) && value > 0;
    return {
      handType: slot.handType,
      mode: enabled ? ('fixed' as const) : ('none' as const),
      value,
      enabled,
    };
  });

  return {
    ...base,
    specialBonusesEnabled: Boolean(raw.specialBonusesEnabled),
    bonuses,
    scoringMode: 'manual',
  };
}

function sanitizeGame(raw: Record<string, unknown>): Game | null {
  try {
    if (typeof raw.id !== 'string') return null;
    const teams = Array.isArray(raw.teams)
      ? raw.teams.filter(isObject).map((t, i) => ({
          id: String(t.id ?? crypto.randomUUID()),
          name: String(t.name ?? (i === 0 ? 'Nosotros' : 'Ellos')).slice(0, 24),
          displayOrder:
            typeof t.displayOrder === 'number' ? t.displayOrder : i,
        }))
      : null;
    if (!teams || teams.length < 2) return null;

    const hands = Array.isArray(raw.hands)
      ? raw.hands.filter(isObject).map((h) => {
          const handType = (
            typeof h.handType === 'string' ? h.handType : 'normal'
          ) as HandType;
          const fromArray = Array.isArray(h.handTypes)
            ? (h.handTypes.filter(
                (t): t is HandType => typeof t === 'string',
              ) as HandType[])
            : undefined;
          const handTypes = normalizeHandTypes(fromArray ?? handType);
          return {
            id: String(h.id ?? crypto.randomUUID()),
            gameId: String(h.gameId ?? raw.id),
            teamId: String(h.teamId ?? teams[0].id),
            handNumber: Number(h.handNumber) || 0,
            basePoints: Math.max(0, Math.floor(Number(h.basePoints) || 0)),
            bonusPoints: Math.max(0, Math.floor(Number(h.bonusPoints) || 0)),
            totalPoints: Math.max(0, Math.floor(Number(h.totalPoints) || 0)),
            handType: handTypes.find((t) => t !== 'normal') ?? handType,
            handTypes,
            createdAt:
              typeof h.createdAt === 'string'
                ? h.createdAt
                : new Date().toISOString(),
            note: typeof h.note === 'string' ? h.note : undefined,
          };
        })
      : [];

    const status =
      raw.status === 'completed' ||
      raw.status === 'abandoned' ||
      raw.status === 'active'
        ? raw.status
        : 'active';

    return {
      id: raw.id,
      createdAt:
        typeof raw.createdAt === 'string'
          ? raw.createdAt
          : new Date().toISOString(),
      updatedAt:
        typeof raw.updatedAt === 'string'
          ? raw.updatedAt
          : new Date().toISOString(),
      status,
      gameType: 'parejas',
      teams,
      targetScore:
        typeof raw.targetScore === 'number' && raw.targetScore > 0
          ? Math.floor(raw.targetScore)
          : DEFAULT_TARGET_SCORE,
      initialTargetScore:
        typeof raw.initialTargetScore === 'number' &&
        raw.initialTargetScore > 0
          ? Math.floor(raw.initialTargetScore)
          : typeof raw.targetScore === 'number' && raw.targetScore > 0
            ? Math.floor(raw.targetScore)
            : DEFAULT_TARGET_SCORE,
      scoringRules: isObject(raw.scoringRules)
        ? mergeScoringRules(raw.scoringRules)
        : createScoringRules('puertorriqueno'),
      hands,
      winnerId: typeof raw.winnerId === 'string' ? raw.winnerId : null,
      schemaVersion: SCHEMA_VERSION,
    };
  } catch {
    return null;
  }
}

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const base = raw ? migrateAppData(JSON.parse(raw)) : emptyAppData();
    const seeded = ensureActiveGame(base);
    if (seeded !== base) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      } catch {
        /* ignore quota on first seed */
      }
    }
    return seeded;
  } catch {
    const seeded = ensureActiveGame(emptyAppData());
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    } catch {
      /* ignore */
    }
    return seeded;
  }
}

export function saveAppData(data: AppData): { ok: boolean; error?: string } {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { ok: true };
  } catch (e) {
    const message =
      e instanceof DOMException && e.name === 'QuotaExceededError'
        ? 'storage_full'
        : 'storage_error';
    return { ok: false, error: message };
  }
}

export function clearAppData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
