import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAppData,
  loadAppData,
  migrateAppData,
  saveAppData,
  STORAGE_KEY,
  emptyAppData,
} from './persistence';
import { createGame, addPoints } from '../domain/game';

describe('persistence', () => {
  beforeEach(() => {
    clearAppData();
  });

  it('persists and reloads after save', () => {
    const data = emptyAppData();
    let game = createGame({ team1Name: 'Nosotros', team2Name: 'Ellos' });
    const r = addPoints(game, game.teams[0].id, 35);
    if ('error' in r) throw new Error(r.error);
    game = r.game;
    data.games = [game];
    data.activeGameId = game.id;

    expect(saveAppData(data).ok).toBe(true);
    const loaded = loadAppData();
    expect(loaded.activeGameId).toBe(game.id);
    expect(loaded.games[0].hands[0].totalPoints).toBe(35);
  });

  it('handles corrupted saved data', () => {
    localStorage.setItem(STORAGE_KEY, '{not-json');
    const data = loadAppData();
    expect(data.games).toHaveLength(1);
    expect(data.activeGameId).toBe(data.games[0].id);
    expect(data.games[0].targetScore).toBe(500);
    expect(data.preferences.language).toBe('es');
  });

  it('seeds a default scoreboard game on first launch', () => {
    const data = loadAppData();
    expect(data.games).toHaveLength(1);
    expect(data.activeGameId).toBe(data.games[0].id);
    expect(data.games[0].targetScore).toBe(500);
    expect(data.games[0].teams.map((t) => t.name)).toEqual([
      'Nosotros',
      'Ellos',
    ]);
  });

  it('defaults language to Spanish', () => {
    expect(emptyAppData().preferences.language).toBe('es');
    expect(migrateAppData({ preferences: {} }).preferences.language).toBe('es');
  });

  it('migrates incomplete objects safely', () => {
    const migrated = migrateAppData({
      games: [{ id: 'x' }],
      preferences: { language: 'en' },
    });
    expect(migrated.games).toHaveLength(0);
    expect(migrated.preferences.language).toBe('en');
  });
});
