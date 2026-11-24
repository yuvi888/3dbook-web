'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Link from 'next/link';

import SmoothScroller from '@/components/SmoothScroller';

// Dynamic import for the 3D Library Scene (WebGL, no SSR)
const LibraryScene = dynamic(() => import('@/components/3d/LibraryScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-[#f5f0e8] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-amber-700 border-t-transparent rounded-full animate-spin mb-4" />
      <span className="text-amber-800/80 text-sm font-medium tracking-widest uppercase">
        Loading Sunlit Gallery...
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
    <main className="relative min-h-screen bg-[#f5f0e8] text-neutral-800 select-none">
      <SmoothScroller>
        {/* Minimalist Top Navigation — Light Theme */}
        <header className="fixed top-0 left-0 w-full z-40 px-6 py-4 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center shadow-lg border border-amber-600/40">
              <span className="text-white font-black text-sm tracking-tighter">Y</span>
            </div>
            <div>
              <h1 className="text-amber-900 font-extrabold text-sm tracking-wider uppercase">
                YSHELF
              </h1>
              <p className="text-[10px] text-amber-700/70 font-medium tracking-wide uppercase">
                3D Sunlit Gallery • Curated Book Collection
              </p>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <Link
              href="/viewer"
              className="px-3.5 py-1.5 rounded-full bg-amber-700 hover:bg-amber-800 text-white shadow-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>3D Model Studio</span>
              <span>↗</span>
            </Link>
            <span className="px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-amber-300/50 text-[11px] font-semibold text-amber-800 shadow-lg">
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
