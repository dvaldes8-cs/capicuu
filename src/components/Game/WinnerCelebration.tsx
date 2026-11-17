import { useMemo, type CSSProperties } from 'react';

type Piece =
  | {
      kind: 'confetti';
      id: number;
      left: number;
      delay: number;
      duration: number;
      size: number;
      color: string;
      rotate: number;
      drift: number;
      shape: 'rect' | 'circle' | 'strip';
    }
  | {
      kind: 'domino';
      id: number;
      left: number;
      delay: number;
      duration: number;
      size: number;
      rotate: number;
      drift: number;
      topPips: number;
      bottomPips: number;
    };

const COLORS = [
  '#D4A956',
  '#123D32',
  '#F8F5ED',
  '#E8C98A',
  '#2d6b58',
  '#c45c4a',
  '#4a90c4',
  '#ffffff',
];

function pipPositions(count: number): Array<[number, number]> {
  // Relative positions inside a half (0–1)
  switch (count) {
    case 1:
      return [[0.5, 0.5]];
    case 2:
      return [
        [0.28, 0.28],
        [0.72, 0.72],
      ];
    case 3:
      return [
        [0.28, 0.28],
        [0.5, 0.5],
        [0.72, 0.72],
      ];
    case 4:
      return [
        [0.28, 0.28],
        [0.72, 0.28],
        [0.28, 0.72],
        [0.72, 0.72],
      ];
    case 5:
      return [
        [0.28, 0.28],
        [0.72, 0.28],
        [0.5, 0.5],
        [0.28, 0.72],
        [0.72, 0.72],
      ];
    case 6:
      return [
        [0.28, 0.22],
        [0.72, 0.22],
        [0.28, 0.5],
        [0.72, 0.5],
        [0.28, 0.78],
        [0.72, 0.78],
      ];
    default:
      return [];
  }
}

function MiniDomino({
  size,
  topPips,
  bottomPips,
}: {
  size: number;
  topPips: number;
  bottomPips: number;
}) {
  const w = size;
  const h = size * 1.85;
  const r = size * 0.12;
  const pipR = size * 0.08;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden
      className="victory-fall__domino-svg"
    >
      <rect
        x={1}
        y={1}
        width={w - 2}
        height={h - 2}
        rx={r}
        fill="#123D32"
        stroke="#D4A956"
        strokeWidth={1.5}
      />
      <line
        x1={4}
        y1={h / 2}
        x2={w - 4}
        y2={h / 2}
        stroke="#D4A956"
        strokeWidth={1.2}
      />
      {pipPositions(topPips).map(([px, py], i) => (
        <circle
          key={`t${i}`}
          cx={px * w}
          cy={py * (h / 2)}
          r={pipR}
          fill="#F8F5ED"
        />
      ))}
      {pipPositions(bottomPips).map(([px, py], i) => (
        <circle
          key={`b${i}`}
          cx={px * w}
          cy={h / 2 + py * (h / 2)}
          r={pipR}
          fill="#F8F5ED"
        />
      ))}
    </svg>
  );
}

function buildPieces(seed: number): Piece[] {
  // Deterministic-ish from seed so remounts of same win feel stable
  let s = seed || 1;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  const pieces: Piece[] = [];
  let id = 0;

  for (let i = 0; i < 36; i++) {
    pieces.push({
      kind: 'confetti',
      id: id++,
      left: rand() * 100,
      delay: rand() * 1.8,
      duration: 2.4 + rand() * 2.2,
      size: 6 + rand() * 10,
      color: COLORS[Math.floor(rand() * COLORS.length)],
      rotate: rand() * 720 - 360,
      drift: rand() * 80 - 40,
      shape: rand() > 0.66 ? 'circle' : rand() > 0.4 ? 'rect' : 'strip',
    });
  }

  for (let i = 0; i < 14; i++) {
    pieces.push({
      kind: 'domino',
      id: id++,
      left: rand() * 100,
      delay: rand() * 2,
      duration: 3 + rand() * 2.5,
      size: 18 + rand() * 14,
      rotate: rand() * 400 - 200,
      drift: rand() * 60 - 30,
      topPips: Math.floor(rand() * 7),
      bottomPips: Math.floor(rand() * 7),
    });
  }

  return pieces;
}

type WinnerCelebrationProps = {
  active: boolean;
  seed?: number;
};

export function WinnerCelebration({ active, seed = 1 }: WinnerCelebrationProps) {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pieces = useMemo(
    () => (active && !reduced ? buildPieces(seed) : []),
    [active, reduced, seed],
  );

  if (!active || reduced || pieces.length === 0) return null;

  return (
    <div className="victory-fall" aria-hidden>
      {pieces.map((p) => {
        const style = {
          left: `${p.left}%`,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
          '--drift': `${p.drift}px`,
          '--spin': `${p.rotate}deg`,
        } as CSSProperties;

        if (p.kind === 'confetti') {
          const shapeClass =
            p.shape === 'circle'
              ? 'victory-fall__confetti--circle'
              : p.shape === 'strip'
                ? 'victory-fall__confetti--strip'
                : 'victory-fall__confetti--rect';
          return (
            <span
              key={p.id}
              className={`victory-fall__piece victory-fall__confetti ${shapeClass}`}
              style={{
                ...style,
                width: p.shape === 'strip' ? p.size * 0.35 : p.size,
                height: p.shape === 'strip' ? p.size * 1.6 : p.size,
                background: p.color,
              }}
            />
          );
        }

        return (
          <span
            key={p.id}
            className="victory-fall__piece victory-fall__domino"
            style={style}
          >
            <MiniDomino
              size={p.size}
              topPips={p.topPips}
              bottomPips={p.bottomPips}
            />
          </span>
        );
      })}
    </div>
  );
}
