'use client';

import { useEffect, useRef } from 'react';
import { BookshelfItem, BookItem } from '@/types/library';

interface ShelfInspectionHUDProps {
  inspectedShelf: BookshelfItem | null;
  selectedBook: BookItem | null;
  hoveredBook: BookItem | null;
  onExitInspection: () => void;
  onCloseBookDetail: () => void;
}

export function ShelfInspectionHUD({
  inspectedShelf,
  selectedBook,
  hoveredBook,
  onExitInspection,
  onCloseBookDetail,
}: ShelfInspectionHUDProps) {
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Sync progress bar width directly with sub-pixel Lenis scroll at display refresh rate
  useEffect(() => {
    let rafId = 0;
    const syncProgress = () => {
      if (progressBarRef.current) {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const scrollY = (window as { __yshelfScroll?: number }).__yshelfScroll ?? window.scrollY;
        const pct = Math.min(100, Math.max(0, (scrollY / maxScroll) * 100));
        progressBarRef.current.style.width = `${pct.toFixed(3)}%`;
      }
      rafId = window.requestAnimationFrame(syncProgress);
    };
    rafId = window.requestAnimationFrame(syncProgress);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [inspectedShelf]);

  // Allow Esc key to exit inspection or close book detail
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedBook) {
          onCloseBookDetail();
        } else if (inspectedShelf) {
          onExitInspection();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBook, inspectedShelf, onExitInspection, onCloseBookDetail]);

  return (
    <>
      {/* ========================================================= */}
      {/* 1. INSPECTED SHELF OVERLAY CONTROLS (Zero Header Overlap) */}
      {/* ========================================================= */}
      {inspectedShelf && (
        <>
          {/* Top-Left Author Exhibition Badge */}
          <div className="fixed top-5 left-6 md:left-8 z-50 flex items-center gap-3 px-5 py-2.5 bg-white/95 backdrop-blur-xl border border-amber-300/70 rounded-full shadow-2xl text-neutral-800 animate-in fade-in slide-in-from-top-3 duration-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-wider uppercase text-amber-950">
                {inspectedShelf.author}
              </span>
              <span className="text-[10px] text-amber-700/90 font-semibold hidden sm:inline">
                {inspectedShelf.genre} • Curated Shelf Exhibit
              </span>
            </div>
          </div>

          {/* Side-Docked Live Book Preview Card (Shows ONLY when hovering a book!) */}
          {hoveredBook && !selectedBook && (
            <aside className="fixed right-5 md:right-8 top-1/2 -translate-y-1/2 z-50 w-72 bg-white/95 backdrop-blur-xl border border-amber-300/70 rounded-2xl p-5 shadow-[0_24px_60px_rgba(25,15,5,0.28)] text-neutral-800 pointer-events-none animate-in fade-in slide-in-from-right-4 duration-200">
              <div
                className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
                style={{ backgroundColor: hoveredBook.color }}
              />
              <div className="flex items-center gap-2 mb-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800">
                  Book Preview
                </span>
              </div>
              <h3 className="text-lg font-extrabold tracking-tight text-neutral-950 leading-snug">
                {hoveredBook.title}
              </h3>
              <p className="text-xs font-semibold text-amber-700 mt-0.5 mb-3">
                {inspectedShelf.author}
              </p>

              <div className="flex items-center gap-2 mb-3 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-amber-50 font-semibold text-amber-900 border border-amber-200">
                  {hoveredBook.year}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-medium">
                  {hoveredBook.pages} pages
                </span>
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed line-clamp-4">
                {hoveredBook.summary}
              </p>

              <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between text-[10px] font-semibold text-amber-800/80">
                <span>Click volume for full overview</span>
                <span>→</span>
              </div>
            </aside>
          )}

          {/* Side prompt hint while inspecting shelf without hovering a book */}
          {!hoveredBook && !selectedBook && (
            <div className="fixed right-6 bottom-7 z-50 hidden md:flex items-center gap-2 px-4 py-2 bg-white/85 backdrop-blur-md border border-amber-300/60 rounded-full shadow-lg text-[11px] font-semibold text-neutral-700 pointer-events-none">
              <span className="text-amber-600">✦</span>
              <span>Hover any 3D book to pop up & preview details</span>
            </div>
          )}

          {/* Unobstructed Prominent Bottom-Center Back to Corridor Button */}
          <button
            onClick={onExitInspection}
            className="fixed bottom-7 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-6 py-3 text-xs font-bold tracking-wide text-white bg-amber-900 hover:bg-amber-800 active:scale-95 border border-amber-400/50 rounded-full transition-all duration-300 shadow-[0_12px_36px_rgba(30,18,6,0.38)] group cursor-pointer animate-in fade-in slide-in-from-bottom-3 duration-300"
          >
            <span className="text-amber-300 group-hover:-translate-x-1 transition-transform text-sm">
              ←
            </span>
            <span>Back to Corridor</span>
          </button>
        </>
      )}

      {/* ========================================================= */}
      {/* 2. SELECTED BOOK FULL DETAILS MODAL                       */}
      {/* ========================================================= */}
      {selectedBook && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/35 backdrop-blur-md animate-in fade-in duration-300"
          onClick={onCloseBookDetail}
        >
          <div
            className="relative w-full max-w-md bg-white border border-amber-200/70 rounded-2xl p-6 shadow-2xl text-neutral-800 transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Color Accent Bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
              style={{ backgroundColor: selectedBook.color }}
            />

            <div className="flex items-start justify-between gap-4 mt-2 mb-4">
              <div>
                <span className="text-xs font-medium text-amber-700 tracking-wider uppercase">
                  Selected Edition
                </span>
                <h3 className="text-2xl font-bold tracking-tight text-neutral-900 mt-0.5">
                  {selectedBook.title}
                </h3>
              </div>
              <button
                onClick={onCloseBookDetail}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-700 transition-colors cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Metadata Pills */}
            <div className="flex items-center gap-3 mb-5 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-amber-50 font-semibold text-amber-800 border border-amber-200/60">
                Published {selectedBook.year}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-600">
                {selectedBook.pages} pages
              </span>
              <span
                className="w-3.5 h-3.5 rounded-full border border-neutral-300"
                style={{ backgroundColor: selectedBook.color }}
                title="Spine color"
              />
            </div>

            {/* Summary */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1.5">
                Overview
              </h4>
              <p className="text-neutral-600 text-sm leading-relaxed">
                {selectedBook.summary}
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
              <span className="text-xs text-neutral-400">
                Hover other books on the shelf to compare
              </span>
              <button
                onClick={onCloseBookDetail}
                className="px-4 py-2 text-xs font-semibold bg-amber-800 text-white rounded-lg hover:bg-amber-700 transition-colors cursor-pointer"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. BOTTOM CORRIDOR NAVIGATION & HINTS                     */}
      {/* ========================================================= */}
      {!inspectedShelf && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center gap-2">
          <div className="px-5 py-2.5 bg-white/85 backdrop-blur-md border border-amber-200/50 rounded-full shadow-lg text-neutral-700 text-xs font-medium tracking-wide flex items-center gap-3 pointer-events-auto">
            <svg
              className="w-4 h-4 text-amber-600 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            <span>Scroll to explore gallery • Click any bookshelf to inspect</span>
          </div>

          {/* Corridor Progress Bar */}
          <div className="w-48 h-1 bg-amber-200/50 rounded-full overflow-hidden">
            <div
              ref={progressBarRef}
              className="h-full bg-gradient-to-r from-amber-700 to-amber-500 rounded-full"
              style={{ width: '0%' }}
            />
          </div>
        </div>
      )}
    </>
  );
}
