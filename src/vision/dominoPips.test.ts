import { describe, expect, it } from 'vitest';
import { countPipsFromMask } from './dominoPips';

function drawCircle(
  mask: Uint8Array,
  w: number,
  h: number,
  cx: number,
  cy: number,
  r: number,
) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) mask[y * w + x] = 1;
    }
  }
}

describe('countPipsFromMask', () => {
  it('counts distinct circular pip blobs', () => {
    const w = 80;
    const h = 80;
    const mask = new Uint8Array(w * h);
    // Double-three style: 3 pips on one half
    drawCircle(mask, w, h, 20, 20, 4);
    drawCircle(mask, w, h, 40, 20, 4);
    drawCircle(mask, w, h, 30, 35, 4);
    expect(countPipsFromMask(mask, w, h, 8, 80)).toBe(3);
  });

  it('ignores tiny noise speckles', () => {
    const w = 40;
    const h = 40;
    const mask = new Uint8Array(w * h);
    mask[5 * w + 5] = 1;
    mask[5 * w + 6] = 1;
    expect(countPipsFromMask(mask, w, h, 8, 80)).toBe(0);
  });

  it('counts a double-six style pattern of 6 pips', () => {
    const w = 100;
    const h = 100;
    const mask = new Uint8Array(w * h);
    const centers = [
      [25, 25],
      [50, 25],
      [75, 25],
      [25, 55],
      [50, 55],
      [75, 55],
    ] as const;
    for (const [cx, cy] of centers) drawCircle(mask, w, h, cx, cy, 5);
    expect(countPipsFromMask(mask, w, h, 10, 120)).toBe(6);
  });
});
