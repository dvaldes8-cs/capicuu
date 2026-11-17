import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('PWA assets', () => {
  it('has a valid favicon svg', () => {
    const svg = readFileSync(join(process.cwd(), 'public/favicon.svg'), 'utf8');
    expect(svg).toContain('<svg');
    expect(svg).toContain('123D32');
  });

  it('vite config declares Capicuu manifest fields', () => {
    const config = readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf8');
    expect(config).toContain("name: 'Capicuu'");
    expect(config).toContain("display: 'standalone'");
    expect(config).toContain('icon-192.png');
    expect(config).toContain('icon-512.png');
    expect(config).toContain('maskable-512.png');
    expect(config).toContain('VitePWA');
  });
});
