type LogoProps = {
  size?: number;
  variant?: 'color' | 'dark' | 'mono';
  className?: string;
  decorative?: boolean;
};

/** Inline Capicuu 3|2 domino mark — works in light/dark without asset fetches. */
export function Logo({
  size = 40,
  variant = 'color',
  className,
  decorative = true,
}: LogoProps) {
  const isDark = variant === 'dark';
  const isMono = variant === 'mono';
  const tile = isDark ? '#F8F5ED' : isMono ? 'none' : '#123D32';
  const stroke = isMono ? 'currentColor' : '#D4A956';
  const pip = isDark ? '#123D32' : isMono ? 'currentColor' : '#F8F5ED';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      width={size}
      height={size}
      className={className}
      fill="none"
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative}
      aria-label={decorative ? undefined : 'Capicuu'}
    >
      <g transform="rotate(-12 64 64)">
        <rect
          x="28"
          y="18"
          width="72"
          height="92"
          rx="14"
          fill={tile}
          stroke={stroke}
          strokeWidth={isMono ? 5 : 4}
        />
        <line
          x1="28"
          y1="64"
          x2="100"
          y2="64"
          stroke={stroke}
          strokeWidth={isMono ? 4 : 3}
          strokeLinecap="round"
        />
        <circle cx="48" cy="34" r="6" fill={pip} />
        <circle cx="80" cy="34" r="6" fill={pip} />
        <circle cx="64" cy="48" r="6" fill={pip} />
        <circle cx="48" cy="80" r="6" fill={pip} />
        <circle cx="80" cy="94" r="6" fill={pip} />
      </g>
    </svg>
  );
}
