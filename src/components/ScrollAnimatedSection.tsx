'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type Animation = 'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight' | 'scale';

interface ScrollAnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: Animation;
}

const ANIMATION_MAP: Record<Animation, { from: gsap.TweenVars; to: gsap.TweenVars }> = {
  fadeUp: {
    from: { opacity: 0, y: 60 },
    to: { opacity: 1, y: 0 },
  },
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  slideLeft: {
    from: { opacity: 0, x: 100 },
    to: { opacity: 1, x: 0 },
  },
  slideRight: {
    from: { opacity: 0, x: -100 },
    to: { opacity: 1, x: 0 },
  },
  scale: {
    from: { opacity: 0, scale: 0.8 },
    to: { opacity: 1, scale: 1 },
  },
};

export default function ScrollAnimatedSection({
  children,
  className = '',
  animation = 'fadeUp',
}: ScrollAnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { from, to } = ANIMATION_MAP[animation];

    const tween = gsap.fromTo(el, from, {
      ...to,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        end: 'top 20%',
        toggleActions: 'play none none reverse',
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [animation]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
