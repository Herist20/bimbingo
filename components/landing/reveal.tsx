'use client';

import * as React from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface RevealProps {
  children: React.ReactNode;
  /** Stagger semua direct child (jika container) atau pakai single fade. */
  stagger?: boolean;
  /** Delay awal sebelum animation start (detik). */
  delay?: number;
  /** Override durasi default. */
  duration?: number;
  /** Pakai pada hero (animate on mount, not scroll). */
  immediate?: boolean;
  /** Translasi awal vertikal (px). Default 24. */
  y?: number;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof React.JSX.IntrinsicElements;
}

export function Reveal({
  children,
  stagger = false,
  delay = 0,
  duration = 0.9,
  immediate = false,
  y = 24,
  className,
  style,
  as = 'div',
}: RevealProps) {
  const ref = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      gsap.set(el.querySelectorAll<HTMLElement>(stagger ? ':scope > *' : ':scope'), {
        opacity: 1,
        y: 0,
      });
      return;
    }

    const targets = stagger
      ? Array.from(el.querySelectorAll<HTMLElement>(':scope > *'))
      : [el];

    gsap.set(targets, { opacity: 0, y });

    const tween = gsap.to(targets, {
      opacity: 1,
      y: 0,
      duration,
      delay,
      ease: 'power3.out',
      stagger: stagger ? 0.08 : 0,
      ...(immediate
        ? {}
        : {
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }),
    });

    return () => {
      tween.kill();
      if (tween.scrollTrigger) tween.scrollTrigger.kill();
    };
  }, [stagger, delay, duration, immediate, y]);

  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      style={{ willChange: 'transform, opacity', ...style }}
    >
      {children}
    </Tag>
  );
}
