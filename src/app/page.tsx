'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import SmoothScroller from '@/components/SmoothScroller';

// Dynamic import for the 3D Library Scene (WebGL, no SSR)
const LibraryScene = dynamic(() => import('@/components/3d/LibraryScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-[#e9dfd0] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-amber-700 border-t-transparent rounded-full animate-spin mb-4" />
      <span className="text-amber-800/80 text-sm font-medium tracking-widest uppercase">
        Loading Sunlit Gallery...
      </span>
    </div>
  ),
});

export default function Home() {
  const [isInspecting, setIsInspecting] = useState(false);
  const heroOverlayRef = useRef<HTMLDivElement>(null);

  // Instant zero-React-rerender scroll driver for hero title (glides straight up immediately on slight scroll!)
  useEffect(() => {
    const syncHeroTransform = () => {
      if (!heroOverlayRef.current) return;
      if (isInspecting) {
        heroOverlayRef.current.style.opacity = '0';
        heroOverlayRef.current.style.visibility = 'hidden';
        return;
      }

      // Responds immediately within the first 90px of scroll (~1 light wheel flick)
      const p = Math.min(1, Math.max(0, window.scrollY / 90));
      const opacity = Math.max(0, 1 - p * 1.15);
      const translateY = -p * 280;
      const scale = 1 + p * 0.1;

      heroOverlayRef.current.style.visibility = opacity <= 0.01 ? 'hidden' : 'visible';
      heroOverlayRef.current.style.opacity = String(opacity);
      heroOverlayRef.current.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
    };

    syncHeroTransform();
    window.addEventListener('scroll', syncHeroTransform, { passive: true });
    return () => {
      window.removeEventListener('scroll', syncHeroTransform);
    };
  }, [isInspecting]);

  return (
    <main className="relative min-h-screen bg-[#e9dfd0] text-neutral-800 select-none">
      <SmoothScroller>
        {/* Minimalist Top Navigation — Hidden cleanly while inspecting a shelf */}
        <header
          className={`fixed top-0 left-0 w-full z-40 px-6 py-4 flex items-center justify-between pointer-events-none transition-opacity duration-300 ${
            isInspecting ? 'opacity-0 invisible' : 'opacity-100 visible'
          }`}
        >
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center shadow-lg border border-amber-600/40">
              <span className="text-white font-black text-sm tracking-tighter">Y</span>
            </div>
            <div>
              <h1 className="text-amber-900 font-extrabold text-sm tracking-wider uppercase">
                YSHELF
              </h1>
              <p className="text-[10px] text-amber-800/80 font-medium tracking-wide uppercase">
                3D Sunlit Gallery • Curated Book Collection
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 ${
              isInspecting ? 'pointer-events-none' : 'pointer-events-auto'
            }`}
          >
            <Link
              href="/viewer"
              className="px-3.5 py-1.5 rounded-full bg-amber-700 hover:bg-amber-800 text-white shadow-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>3D Model Studio</span>
              <span>↗</span>
            </Link>
            <span className="px-3.5 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-amber-300/50 text-[11px] font-semibold text-amber-800 shadow-lg">
              14 Curated Authors
            </span>
          </div>
        </header>

        {/* ============================================================== */}
        {/* STYLISH STACKED HERO WELCOME TITLE (Unified Font & Instant Up) */}
        {/* ============================================================== */}
        <div
          ref={heroOverlayRef}
          className="fixed inset-0 z-20 flex flex-col items-center justify-center pointer-events-none px-6 text-center will-change-transform transition-[transform,opacity] duration-150 ease-out"
        >
          <h2
            className="text-white text-center tracking-wide leading-[1.08]"
            style={{
              fontFamily: 'var(--font-display), Georgia, serif',
              textShadow:
                '0 8px 36px rgba(24, 14, 5, 0.52), 0 2px 12px rgba(24, 14, 5, 0.36)',
            }}
          >
            <span className="block text-4xl sm:text-5xl md:text-6xl font-semibold tracking-wider mb-1 sm:mb-2">
              Welcome to
            </span>
            <span className="block text-5xl sm:text-7xl md:text-8xl font-bold tracking-normal">
              Yshelf Books World
            </span>
          </h2>
          <div className="mt-5 w-28 h-[2px] bg-gradient-to-r from-transparent via-white/90 to-transparent shadow-sm" />
        </div>

        {/* ============================================================== */}
        {/* 3D SCENE: Fixed Fullscreen Canvas (Zero Scroll Re-renders!)    */}
        {/* ============================================================== */}
        <div className="fixed inset-0 w-full h-full">
          <LibraryScene onInspectionChange={setIsInspecting} />
        </div>

        {/* ============================================================== */}
        {/* SCROLL SPACER: 560vh Snappy & Smooth Gallery Scroll            */}
        {/* ============================================================== */}
        <div
          className="relative z-10 w-full pointer-events-none"
          style={{ height: '560vh' }}
        />
      </SmoothScroller>
    </main>
  );
}
