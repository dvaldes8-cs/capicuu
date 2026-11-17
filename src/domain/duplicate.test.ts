import { describe, expect, it } from 'vitest';
import { addPoints, createGame } from './game';

describe('duplicate-safe domain writes', () => {
  it('records distinct hands for sequential submissions', () => {
    let game = createGame();
    const teamId = game.teams[0].id;
    const first = addPoints(game, teamId, 10);
    if ('error' in first) throw new Error(first.error);
    game = first.game;
    const second = addPoints(game, teamId, 10);
    if ('error' in second) throw new Error(second.error);
    game = second.game;
    expect(game.hands).toHaveLength(2);
    expect(game.hands[0].id).not.toBe(game.hands[1].id);
    expect(first.hand.id).not.toBe(second.hand.id);
  });
});
