/**
 * Lightweight confetti burst on push success. No external deps.
 *
 * Renders 80 colored squares that animate outward from the center
 * of the viewport, then fade out. ~300ms total animation.
 *
 * Pure CSS + a tiny component, no canvas or library needed.
 */

'use client';

import { useEffect, useState } from 'react';

const COLORS = [
  '#6366f1', // indigo
  '#a855f7', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
];

const PIECE_COUNT = 80;

interface Piece {
  id: number;
  x: number;       // starting position (% from left)
  y: number;       // starting position (% from top)
  rotate: number;  // initial rotation (deg)
  dx: number;      // end horizontal offset (px)
  dy: number;      // end vertical offset (px)
  rot: number;     // end rotation (deg)
  delay: number;   // ms before animation starts
  duration: number; // ms animation length
  size: number;    // px
  color: string;
}

function generatePieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, (_, i) => {
    // Start from top-center area
    const x = 30 + Math.random() * 40;
    const y = 30 + Math.random() * 20;

    // End position — random spread outward and downward
    const angle = Math.random() * Math.PI * 2;
    const distance = 200 + Math.random() * 400;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance + 200; // gravity-ish

    return {
      id: i,
      x,
      y,
      rotate: Math.random() * 360,
      dx,
      dy,
      rot: Math.random() * 1080 - 540,
      delay: Math.random() * 150,
      duration: 1800 + Math.random() * 800,
      size: 6 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  });
}

export function ConfettiBurst({ trigger }: { trigger: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (trigger > 0) {
      setPieces(generatePieces());
      const t = setTimeout(() => setPieces([]), 3000);
      return () => clearTimeout(t);
    }
  }, [trigger]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.4}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fly ${p.duration}ms cubic-bezier(0.1, 0.8, 0.3, 1) ${p.delay}ms forwards`,
            // Use CSS custom props for end position
            ['--dx' as any]: `${p.dx}px`,
            ['--dy' as any]: `${p.dy}px`,
            ['--rot' as any]: `${p.rot}deg`,
            opacity: 0,
          }}
        />
      ))}
      <style jsx global>{`
        @keyframes confetti-fly {
          0% {
            opacity: 1;
            transform: rotate(var(--rot, 0deg)) translate(0, 0);
          }
          100% {
            opacity: 0;
            transform: rotate(calc(var(--rot, 0deg) + 720deg)) translate(var(--dx, 100px), var(--dy, 200px));
          }
        }
      `}</style>
    </div>
  );
}