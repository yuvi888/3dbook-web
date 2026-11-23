'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import SmoothScroller from '@/components/SmoothScroller';

// Dynamic import for the 3D Library Scene (WebGL, no SSR)
const LibraryScene = dynamic(() => import('@/components/3d/LibraryScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-[#120b06] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
      <span className="text-amber-200/80 text-sm font-medium tracking-widest uppercase">
        Loading 3D Wooden Archive...
      </span>
    </div>
  ),
});

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const corridorContainerRef = useRef<HTMLDivElement>(null);

  // ScrollTrigger to drive camera progress along the curved tunnel
  useEffect(() => {
    const timer = setTimeout(() => {
      const trigger = ScrollTrigger.create({
        trigger: corridorContainerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8,
        onUpdate: (self) => {
          setScrollProgress(self.progress);
        },
      });

      return () => {
        trigger.kill();
      };
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative min-h-screen bg-[#120b06] text-neutral-100 select-none">
      <SmoothScroller>
        {/* Minimalist Top Navigation */}
        <header className="fixed top-0 left-0 w-full z-40 px-6 py-4 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center shadow-lg border border-amber-500/40">
              <span className="text-white font-black text-sm tracking-tighter">Y</span>
            </div>
            <div>
              <h1 className="text-amber-100 font-extrabold text-sm tracking-wider uppercase">
                YSHELF
              </h1>
              <p className="text-[10px] text-amber-400/70 font-medium tracking-wide uppercase">
                3D Curved Wooden Library • Wall-Mounted Exhibits
              </p>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-neutral-900/80 backdrop-blur-md border border-amber-500/30 text-[11px] font-semibold text-amber-200 shadow-lg">
              7 Curated Authors
            </span>
          </div>
        </header>

        {/* ============================================================== */}
        {/* 3D SCENE: Fixed Fullscreen Canvas                              */}
        {/* ============================================================== */}
        <div className="fixed inset-0 w-full h-full z-0">
          <LibraryScene scrollProgress={scrollProgress} />
        </div>

        {/* ============================================================== */}
        {/* SCROLL SPACER: 500vh Drives ScrollTrigger Smooth Navigation    */}
        {/* ============================================================== */}
        <div
          ref={corridorContainerRef}
          className="relative z-10 w-full pointer-events-none"
          style={{ height: '500vh' }}
        />
      </SmoothScroller>
    </main>
  );
}
