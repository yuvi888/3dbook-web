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
    <div className="w-full h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
      <span className="text-neutral-500 text-sm font-medium tracking-widest uppercase">
        Loading 3D Archive...
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
    <main className="relative min-h-screen bg-[#f8fafc] text-neutral-900 select-none">
      <SmoothScroller>
        {/* Minimalist Top Navigation */}
        <header className="fixed top-0 left-0 w-full z-40 px-6 py-4 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm tracking-tighter">V</span>
            </div>
            <div>
              <h1 className="text-neutral-900 font-extrabold text-sm tracking-wider uppercase">
                VERTEX ARCHIVE
              </h1>
              <p className="text-[10px] text-neutral-400 font-medium tracking-wide uppercase">
                3D Interactive Curved Library
              </p>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/80 backdrop-blur-md border border-neutral-200 text-[11px] font-semibold text-neutral-700 shadow-sm">
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
