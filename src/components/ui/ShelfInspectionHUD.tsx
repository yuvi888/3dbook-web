'use client';

import { useEffect } from 'react';
import { BookshelfItem, BookItem } from '@/types/library';

interface ShelfInspectionHUDProps {
  inspectedShelf: BookshelfItem | null;
  selectedBook: BookItem | null;
  onExitInspection: () => void;
  onCloseBookDetail: () => void;
  scrollProgress: number;
}

export function ShelfInspectionHUD({
  inspectedShelf,
  selectedBook,
  onExitInspection,
  onCloseBookDetail,
  scrollProgress,
}: ShelfInspectionHUDProps) {
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
      {/* 1. INSPECTED SHELF CORNER CONTROLS (UNOBSTRUCTED CENTER)  */}
      {/* ========================================================= */}
      {inspectedShelf && (
        <>
          {/* Top-Left Museum Collection Badge */}
          <div className="fixed top-6 left-6 md:left-8 z-50 flex items-center gap-3 px-5 py-2.5 bg-neutral-950/85 backdrop-blur-xl border border-amber-500/40 rounded-full shadow-2xl text-white animate-in fade-in slide-in-from-top-3 duration-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-wider uppercase text-amber-200">
                {inspectedShelf.author}
              </span>
              <span className="text-[10px] text-amber-400/80 font-medium hidden sm:inline">
                {inspectedShelf.genre} • Museum Exhibition
              </span>
            </div>
          </div>

          {/* Top-Right Return to Corridor Button */}
          <button
            onClick={onExitInspection}
            className="fixed top-6 right-6 md:right-8 z-50 flex items-center gap-2.5 px-5 py-2.5 text-xs font-bold text-white bg-neutral-950/90 hover:bg-neutral-900 active:scale-95 border border-amber-500/60 hover:border-amber-400 rounded-full transition-all duration-300 shadow-2xl backdrop-blur-xl group cursor-pointer animate-in fade-in slide-in-from-top-3 duration-300"
          >
            <span className="text-amber-400 group-hover:-translate-x-1 transition-transform">←</span>
            <span>Corridor View</span>
          </button>
        </>
      )}

      {/* ========================================================= */}
      {/* 2. SELECTED BOOK DETAILS MODAL                            */}
      {/* ========================================================= */}
      {selectedBook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
          onClick={onCloseBookDetail}
        >
          <div
            className="relative w-full max-w-md bg-neutral-900 border border-white/20 rounded-2xl p-6 shadow-2xl text-white transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Color Accent Bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
              style={{ backgroundColor: selectedBook.color }}
            />

            <div className="flex items-start justify-between gap-4 mt-2 mb-4">
              <div>
                <span className="text-xs font-medium text-neutral-400 tracking-wider uppercase">
                  Selected Edition
                </span>
                <h3 className="text-2xl font-bold tracking-tight text-white mt-0.5">
                  {selectedBook.title}
                </h3>
              </div>
              <button
                onClick={onCloseBookDetail}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Metadata Pills */}
            <div className="flex items-center gap-3 mb-5 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-white/10 font-semibold text-amber-300">
                Published {selectedBook.year}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/10 text-neutral-300">
                {selectedBook.pages} pages
              </span>
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/30"
                style={{ backgroundColor: selectedBook.color }}
                title="Spine color"
              />
            </div>

            {/* Summary */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                Overview
              </h4>
              <p className="text-neutral-300 text-sm leading-relaxed">
                {selectedBook.summary}
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-xs text-neutral-400">
                Hover over other books to compare
              </span>
              <button
                onClick={onCloseBookDetail}
                className="px-4 py-2 text-xs font-semibold bg-white text-neutral-900 rounded-lg hover:bg-neutral-200 transition-colors"
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
          <div className="px-5 py-2.5 bg-neutral-900/80 backdrop-blur-md border border-white/15 rounded-full shadow-lg text-white/80 text-xs font-medium tracking-wide flex items-center gap-3 pointer-events-auto">
            <svg
              className="w-4 h-4 text-purple-400 animate-bounce"
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
            <span>Scroll to navigate curved library • Click any bookshelf to inspect</span>
          </div>

          {/* Corridor Progress Bar */}
          <div className="w-48 h-1 bg-neutral-300/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-150"
              style={{ width: `${Math.min(100, Math.max(0, scrollProgress * 100))}%` }}
            />
          </div>
        </div>
      )}
    </>
  );
}
