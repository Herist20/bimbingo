'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface MarqueeProps {
  children: React.ReactNode;
  /** Detik per loop full. Default 28. */
  duration?: number;
  /** Direction. */
  reverse?: boolean;
  className?: string;
}

export function Marquee({ children, duration = 28, reverse = false, className }: MarqueeProps) {
  return (
    <div
      className={cn('group relative overflow-hidden', className)}
      style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}
    >
      <div
        className="flex w-max items-stretch gap-12 will-change-transform"
        style={{
          animation: `marquee ${duration}s linear infinite`,
          animationDirection: reverse ? 'reverse' : 'normal',
        }}
      >
        <div className="flex shrink-0 items-stretch gap-12">{children}</div>
        <div aria-hidden className="flex shrink-0 items-stretch gap-12">
          {children}
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .group:hover :global(div[style*='animation']) {
          animation-play-state: paused !important;
        }
      `}</style>
    </div>
  );
}
