'use client';

import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

declare global {
  interface Window {
    __yshelfScroll?: number;
  }
}

export default function SmoothScroller({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.068,
      wheelMultiplier: 0.82,
      touchMultiplier: 1.15,
      smoothWheel: true,
    });

    window.__yshelfScroll = lenis.scroll ?? window.scrollY;

    const onScroll = () => {
      window.__yshelfScroll = lenis.scroll;
      ScrollTrigger.update();
    };
    lenis.on('scroll', onScroll);

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
      window.__yshelfScroll = lenis.scroll;
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off('scroll', onScroll);
      lenis.destroy();
      delete window.__yshelfScroll;
      gsap.ticker.remove(onTick);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return <>{children}</>;
}
