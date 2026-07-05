import Link from 'next/link';

type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  href?: string | null;
};

// Gradient hexagonal logo with stylized "G" — represents:
//  - Hexagon: structure, modularity
//  - Gradient indigo→purple→pink: brand colors
//  - "G": the first letter, recognizable
//  - Inner glow: depth, like a gem
export function Logo({ size = 32, showWordmark = true, href = '/' }: LogoProps) {
  const gradientId = `logo-gradient-${size}`;
  const glowId = `logo-glow-${size}`;

  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5865f2" />
          <stop offset="35%" stopColor="#833eb5" />
          <stop offset="70%" stopColor="#c13584" />
          <stop offset="100%" stopColor="#e1306c" />
        </linearGradient>
        <radialGradient id={glowId} cx="32" cy="32" r="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Hexagon shape */}
      <path
        d="M32 4 L56 18 L56 46 L32 60 L8 46 L8 18 Z"
        fill={`url(#${gradientId})`}
      />
      {/* Inner glow */}
      <circle cx="32" cy="32" r="14" fill={`url(#${glowId})`} />
      {/* G letter */}
      <path
        d="M40 24 H30 a8 8 0 0 0 0 16 H40 V32 H34"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  const content = (
    <div className="flex items-center gap-2.5">
      {svg}
      {showWordmark && (
        <span className="font-semibold tracking-tight text-gh-fg text-lg">
          G-Push
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }
  return content;
}