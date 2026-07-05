'use client';

import { useState } from 'react';

type Avatar3DProps = {
  seed: string;
  size?: number;
  className?: string;
};

// 3D-ish avatar generated from DiceBear's "bottts" style.
// Uses their free SVG API — no library needed, no API key.
export function Avatar3D({ seed, size = 64, className = '' }: Avatar3DProps) {
  const [error, setError] = useState(false);
  const url = `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear&backgroundColor=5865f2,833eb5,c13584,e1306c&radius=20`;

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-brand-500 to-pink-500 text-white font-bold rounded-2xl ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {seed[0]?.toUpperCase() || '?'}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={seed}
      width={size}
      height={size}
      className={`rounded-2xl ${className}`}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}

// A row of overlapping 3D avatars (for "social proof" sections)
export function AvatarStack({
  seeds,
  size = 40,
}: {
  seeds: string[];
  size?: number;
}) {
  return (
    <div className="flex -space-x-3">
      {seeds.map((seed, i) => (
        <div
          key={seed}
          className="ring-2 ring-gh-bg rounded-2xl"
          style={{ zIndex: seeds.length - i }}
        >
          <Avatar3D seed={seed} size={size} />
        </div>
      ))}
    </div>
  );
}