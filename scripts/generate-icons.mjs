/**
 * Generate PWA PNG icons from the Capicuu SVG logo.
 * Run: node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="96" fill="#123D32"/>
  <g transform="translate(256 256) rotate(-12) translate(-256 -256)">
    <rect x="128" y="72" width="256" height="368" rx="48" fill="#0D2923" stroke="#D4A956" stroke-width="16"/>
    <line x1="128" y1="256" x2="384" y2="256" stroke="#D4A956" stroke-width="12" stroke-linecap="round"/>
    <circle cx="188" cy="130" r="22" fill="#F8F5ED"/>
    <circle cx="324" cy="130" r="22" fill="#F8F5ED"/>
    <circle cx="256" cy="188" r="22" fill="#F8F5ED"/>
    <circle cx="188" cy="320" r="22" fill="#F8F5ED"/>
    <circle cx="324" cy="372" r="22" fill="#F8F5ED"/>
  </g>
</svg>
`;

const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" fill="#123D32"/>
  <g transform="translate(256 256) rotate(-12) translate(-256 -256)">
    <rect x="148" y="96" width="216" height="320" rx="40" fill="#0D2923" stroke="#D4A956" stroke-width="14"/>
    <line x1="148" y1="256" x2="364" y2="256" stroke="#D4A956" stroke-width="10" stroke-linecap="round"/>
    <circle cx="198" cy="148" r="18" fill="#F8F5ED"/>
    <circle cx="314" cy="148" r="18" fill="#F8F5ED"/>
    <circle cx="256" cy="198" r="18" fill="#F8F5ED"/>
    <circle cx="198" cy="310" r="18" fill="#F8F5ED"/>
    <circle cx="314" cy="354" r="18" fill="#F8F5ED"/>
  </g>
</svg>
`;

const appleSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" fill="none">
  <rect width="180" height="180" rx="40" fill="#123D32"/>
  <g transform="translate(90 90) rotate(-12) translate(-90 -90)">
    <rect x="42" y="24" width="96" height="132" rx="18" fill="#0D2923" stroke="#D4A956" stroke-width="6"/>
    <line x1="42" y1="90" x2="138" y2="90" stroke="#D4A956" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="64" cy="46" r="8" fill="#F8F5ED"/>
    <circle cx="116" cy="46" r="8" fill="#F8F5ED"/>
    <circle cx="90" cy="66" r="8" fill="#F8F5ED"/>
    <circle cx="64" cy="112" r="8" fill="#F8F5ED"/>
    <circle cx="116" cy="132" r="8" fill="#F8F5ED"/>
  </g>
</svg>
`;

async function writePng(name, svg, size) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(outDir, name));
  console.log('Wrote', name);
}

await writePng('icon-192.png', iconSvg, 192);
await writePng('icon-512.png', iconSvg, 512);
await writePng('maskable-512.png', maskableSvg, 512);
await writePng('apple-touch-icon.png', appleSvg, 180);
console.log('Done.');
