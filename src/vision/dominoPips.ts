/**
 * Client-side domino pip counter (lightweight, browser-only).
 *
 * Open-source references (Python/OpenCV, not runnable in this PWA as-is):
 * - itsCharlesAM/domino_dot_detector — SimpleBlobDetector
 * - DevinSigley/Domino-Assistant — per-tile OpenCV contours
 * - jjmlovesgit/pipcounter — HSV/contour (colored pips)
 *
 * Shipping full opencv.js (~10MB) would break Capicuu’s offline PWA budget, so
 * this ports the idea: dark circular blobs on ivory with gold rejection.
 * Photo CV is approximate — always confirm before scoring.
 */

export interface PipPoint {
  x: number;
  y: number;
  radius: number;
}

export interface PipScanResult {
  totalPips: number;
  pips: PipPoint[];
  confidence: number;
  width: number;
  height: number;
  previewDataUrl: string;
  inverted: boolean;
}

export interface ScanOptions {
  maxDimension?: number;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image_load_failed'));
    img.src = dataUrl;
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('image_read_failed'));
    reader.readAsDataURL(blob as never);
  });
}

function boxBlurGray(
  src: Float32Array,
  w: number,
  h: number,
  radius: number,
): Float32Array {
  if (radius <= 0) return src;
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let k = -radius; k <= radius; k++) {
        const xx = Math.min(w - 1, Math.max(0, x + k));
        sum += src[y * w + xx];
        count++;
      }
      tmp[y * w + x] = sum / count;
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let k = -radius; k <= radius; k++) {
        const yy = Math.min(h - 1, Math.max(0, y + k));
        sum += tmp[yy * w + x];
        count++;
      }
      out[y * w + x] = sum / count;
    }
  }
  return out;
}

function morphMask(
  mask: Uint8Array,
  w: number,
  h: number,
  radius: number,
  mode: 'dil' | 'ero',
): Uint8Array {
  let cur = mask;
  for (let pass = 0; pass < radius; pass++) {
    const tmp = new Uint8Array(w * h);
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let v = mode === 'dil' ? 0 : 1;
        for (let k = -1; k <= 1; k++) {
          const xx = Math.min(w - 1, Math.max(0, x + k));
          const m = cur[y * w + xx];
          if (mode === 'dil') v = v | m;
          else v = v & m;
        }
        tmp[y * w + x] = v;
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let v = mode === 'dil' ? 0 : 1;
        for (let k = -1; k <= 1; k++) {
          const yy = Math.min(h - 1, Math.max(0, y + k));
          const m = tmp[yy * w + x];
          if (mode === 'dil') v = v | m;
          else v = v & m;
        }
        out[y * w + x] = v;
      }
    }
    cur = out;
  }
  return cur;
}

function isGoldSpinner(avgR: number, avgG: number, avgB: number): boolean {
  const max = Math.max(avgR, avgG, avgB);
  const min = Math.min(avgR, avgG, avgB);
  if (max < 55) return false;
  const chroma = max - min;
  const warmth = (avgR + avgG) / 2 - avgB;
  return (
    chroma > 14 &&
    warmth > 8 &&
    avgR > 60 &&
    avgG > 40 &&
    avgR >= avgB * 0.95 &&
    avgG >= avgB * 0.8
  );
}

function estimateLightTiles(gray: Float32Array): boolean {
  let bright = 0;
  let veryBright = 0;
  let dark = 0;
  const step = Math.max(1, Math.floor(gray.length / 6000));
  for (let i = 0; i < gray.length; i += step) {
    if (gray[i] >= 200) veryBright++;
    if (gray[i] >= 160) bright++;
    if (gray[i] < 80) dark++;
  }
  const n = Math.ceil(gray.length / step);
  if (veryBright / n > 0.08 || bright / n > 0.15) return true;
  return dark < bright;
}

interface RawBlob {
  x: number;
  y: number;
  area: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  sumGray: number;
  sumR: number;
  sumG: number;
  sumB: number;
}

function labelDarkBlobs(
  mask: Uint8Array,
  w: number,
  h: number,
  gray: Float32Array,
  rgba: Uint8ClampedArray | Uint8Array,
  minArea: number,
  maxArea: number,
): RawBlob[] {
  const labels = new Int32Array(w * h);
  const stackX: number[] = [];
  const stackY: number[] = [];
  const blobs: RawBlob[] = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!mask[i] || labels[i]) continue;

      let area = 0;
      let sumX = 0;
      let sumY = 0;
      let sumGray = 0;
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;

      stackX.length = 0;
      stackY.length = 0;
      stackX.push(x);
      stackY.push(y);
      labels[i] = 1;

      while (stackX.length) {
        const cx = stackX.pop()!;
        const cy = stackY.pop()!;
        const ci = cy * w + cx;
        area++;
        sumX += cx;
        sumY += cy;
        sumGray += gray[ci];
        const pi = ci * 4;
        sumR += rgba[pi];
        sumG += rgba[pi + 1];
        sumB += rgba[pi + 2];
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const ni = ny * w + nx;
            if (!mask[ni] || labels[ni]) continue;
            labels[ni] = 1;
            stackX.push(nx);
            stackY.push(ny);
          }
        }
      }

      if (area < minArea || area > maxArea) continue;
      blobs.push({
        x: sumX / area,
        y: sumY / area,
        area,
        minX,
        maxX,
        minY,
        maxY,
        sumGray,
        sumR,
        sumG,
        sumB,
      });
    }
  }
  return blobs;
}

function passesPipShape(b: RawBlob): boolean {
  const bw = b.maxX - b.minX + 1;
  const bh = b.maxY - b.minY + 1;
  const aspect = bw / Math.max(1, bh);
  if (aspect < 0.5 || aspect > 2) return false;
  const fill = b.area / (bw * bh);
  if (fill < 0.4) return false;
  const radius = Math.sqrt(b.area / Math.PI);
  const circularity = b.area / Math.max(1e-6, Math.PI * radius * radius);
  // circularity of a filled disk ≈ 1; allow some JPEG noise
  if (circularity < 0.45 || circularity > 1.35) return false;
  // inertia proxy: bounding box shouldn't be a thin line
  const inertia = Math.min(bw, bh) / Math.max(bw, bh);
  if (inertia < 0.35) return false;
  return true;
}

/**
 * Ivory tiles: dark pip = DoG peak with bright ivory ring.
 * Same polarity idea as OpenCV dark SimpleBlobDetector, without the 10MB WASM.
 */
function detectIvoryPips(
  rgba: Uint8ClampedArray | Uint8Array,
  gray: Float32Array,
  w: number,
  h: number,
): PipPoint[] {
  const minDim = Math.min(w, h);
  const dogThr = 10;
  const grayMax = 80;
  const contrastMin = 50;
  const ivoryMin = 12;
  const ivoryThr = 180;
  const ringMin = 120;
  const nms = Math.max(10, Math.round(minDim / 43));
  const blurLarge = Math.max(3, Math.min(4, Math.round(minDim / 120)));

  const blurSmall = boxBlurGray(gray, w, h, 1);
  const blurBig = boxBlurGray(gray, w, h, blurLarge);
  const dog = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) dog[i] = blurBig[i] - blurSmall[i];

  const peaks: Array<PipPoint & { v: number }> = [];

  for (let y = 4; y < h - 4; y++) {
    for (let x = 4; x < w - 4; x++) {
      const i = y * w + x;
      if (gray[i] > grayMax) continue;
      const v = dog[i];
      if (v < dogThr) continue;

      let isMax = true;
      for (let dy = -2; dy <= 2 && isMax; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (!dx && !dy) continue;
          if (dog[(y + dy) * w + (x + dx)] > v) {
            isMax = false;
            break;
          }
        }
      }
      if (!isMax) continue;

      const pi = i * 4;
      if (isGoldSpinner(rgba[pi], rgba[pi + 1], rgba[pi + 2])) continue;

      let ivory = 0;
      for (let dy = -5; dy <= 5; dy++) {
        for (let dx = -5; dx <= 5; dx++) {
          if (gray[(y + dy) * w + (x + dx)] >= ivoryThr) ivory++;
        }
      }
      if (ivory < ivoryMin) continue;

      let coreSum = 0;
      let coreN = 0;
      let ringSum = 0;
      let ringN = 0;
      for (let dy = -5; dy <= 5; dy++) {
        for (let dx = -5; dx <= 5; dx++) {
          const d = Math.hypot(dx, dy);
          const g = gray[(y + dy) * w + (x + dx)];
          if (d <= 2.2) {
            coreSum += g;
            coreN++;
          } else if (d >= 2.5 && d <= 5) {
            ringSum += g;
            ringN++;
          }
        }
      }
      if (coreN < 3 || ringN < 8) continue;
      const ringAvg = ringSum / ringN;
      const contrast = ringAvg - coreSum / coreN;
      if (contrast < contrastMin) continue;
      if (ringAvg < ringMin) continue;

      peaks.push({
        x,
        y,
        radius: Math.max(2.5, Math.min(6, 2 + v / 35)),
        v,
      });
    }
  }

  peaks.sort((a, b) => b.v - a.v);
  const kept: PipPoint[] = [];
  for (const p of peaks) {
    if (kept.some((k) => Math.hypot(k.x - p.x, k.y - p.y) < nms)) continue;
    kept.push({ x: p.x, y: p.y, radius: p.radius });
  }
  return kept;
}

function detectDarkTilePips(
  rgba: Uint8ClampedArray | Uint8Array,
  gray: Float32Array,
  w: number,
  h: number,
): PipPoint[] {
  const minDim = Math.min(w, h);
  const blurR = Math.max(3, Math.round(minDim / 55));
  const blurred = boxBlurGray(gray, w, h, blurR);
  const contrast = new Float32Array(w * h);
  for (let i = 0; i < gray.length; i++) contrast[i] = gray[i] - blurred[i];

  const samples: number[] = [];
  for (let i = 0; i < contrast.length; i++) {
    if (gray[i] < 130) continue;
    if (contrast[i] > 4) samples.push(contrast[i]);
  }
  samples.sort((a, b) => a - b);
  const pct = samples.length
    ? samples[Math.min(samples.length - 1, Math.floor(samples.length * 0.55))]
    : 18;
  const threshold = Math.max(10, pct * 0.7);

  const rawMask = new Uint8Array(w * h);
  for (let i = 0; i < contrast.length; i++) {
    if (gray[i] < 145) continue;
    const pi = i * 4;
    if (isGoldSpinner(rgba[pi], rgba[pi + 1], rgba[pi + 2])) continue;
    rawMask[i] = contrast[i] >= threshold ? 1 : 0;
  }

  let cleaned = morphMask(rawMask, w, h, 1, 'ero');
  cleaned = morphMask(cleaned, w, h, 1, 'dil');

  const minArea = Math.max(4, Math.round((minDim / 160) ** 2));
  const maxArea = Math.round((minDim / 12) ** 2);
  const blobs = labelDarkBlobs(cleaned, w, h, gray, rgba, minArea, maxArea);
  const candidates: PipPoint[] = [];

  for (const b of blobs) {
    if (!passesPipShape(b)) continue;
    const avgR = b.sumR / b.area;
    const avgG = b.sumG / b.area;
    const avgB = b.sumB / b.area;
    if (isGoldSpinner(avgR, avgG, avgB)) continue;
    if (b.sumGray / b.area < 145) continue;
    candidates.push({
      x: b.x,
      y: b.y,
      radius: Math.max(2, Math.sqrt(b.area / Math.PI)),
    });
  }

  candidates.sort((a, b) => b.radius - a.radius);
  const kept: PipPoint[] = [];
  for (const pip of candidates) {
    if (
      kept.some(
        (k) =>
          Math.hypot(k.x - pip.x, k.y - pip.y) <
          Math.max(k.radius, pip.radius) * 1.65,
      )
    ) {
      continue;
    }
    kept.push(pip);
  }
  return kept;
}

export function detectPipsFromRgba(
  rgba: Uint8ClampedArray | Uint8Array,
  w: number,
  h: number,
): { pips: PipPoint[]; inverted: boolean; confidence: number } {
  const gray = new Float32Array(w * h);
  for (let p = 0, i = 0; p < w * h; p++, i += 4) {
    gray[p] = 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
  }

  const inverted = estimateLightTiles(gray);
  const kept = inverted
    ? detectIvoryPips(rgba, gray, w, h)
    : detectDarkTilePips(rgba, gray, w, h);

  const totalPips = kept.length;
  let confidence = 0.5;
  if (totalPips >= 4 && totalPips <= 120) confidence = 0.75;
  if (totalPips >= 10 && totalPips <= 80) confidence = 0.85;
  if (totalPips === 0) confidence = 0.15;
  if (totalPips > 140) confidence = 0.3;

  return { pips: kept, inverted, confidence };
}

export async function scanDominoPips(
  dataUrl: string,
  options: ScanOptions = {},
): Promise<PipScanResult> {
  const maxDimension = options.maxDimension ?? 1100;
  const img = await loadImage(dataUrl);

  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('canvas_unavailable');

  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  const detected = detectPipsFromRgba(data, w, h);

  ctx.drawImage(img, 0, 0, w, h);
  ctx.lineWidth = 2;
  for (const pip of detected.pips) {
    ctx.beginPath();
    ctx.arc(pip.x, pip.y, Math.max(4, pip.radius + 2), 0, Math.PI * 2);
    ctx.strokeStyle = '#D4A956';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pip.x, pip.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#D4A956';
    ctx.fill();
  }

  return {
    totalPips: detected.pips.length,
    pips: detected.pips,
    confidence: detected.confidence,
    width: w,
    height: h,
    previewDataUrl: canvas.toDataURL('image/jpeg', 0.85),
    inverted: detected.inverted,
  };
}

export function countPipsFromMask(
  mask: Uint8Array,
  w: number,
  h: number,
  minArea = 4,
  maxArea = 400,
): number {
  const gray = new Float32Array(w * h);
  const rgba = new Uint8Array(w * h * 4);
  const blobs = labelDarkBlobs(mask, w, h, gray, rgba, minArea, maxArea);
  return blobs.filter((b) => passesPipShape(b)).length;
}
