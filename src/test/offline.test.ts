import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { addPoints, createGame } from '../domain/game';
import { saveAppData, loadAppData, emptyAppData, clearAppData } from '../storage/persistence';

describe('offline scorekeeping', () => {
  it('records scores using only local storage (no network)', () => {
    clearAppData();
    let game = createGame();
    const result = addPoints(game, game.teams[0].id, 42);
    if ('error' in result) throw new Error(result.error);
    game = result.game;

    const data = emptyAppData();
    data.games = [game];
    data.activeGameId = game.id;
    expect(saveAppData(data).ok).toBe(true);

    const reloaded = loadAppData();
    expect(reloaded.games[0].hands[0].totalPoints).toBe(42);
  });

  it('registers a service worker in the app entry', () => {
    const main = readFileSync(join(process.cwd(), 'src/main.tsx'), 'utf8');
    expect(main).toContain('virtual:pwa-register');
    expect(main).toContain('registerSW');
  });
});
