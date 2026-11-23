'use client';

import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';

interface PosterData {
  title: string;
  description: string;
  color: string;
}

interface PosterModalProps {
  poster: PosterData | null;
  onClose: () => void;
}

export default function PosterModal({ poster, onClose }: PosterModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const handleClose = useCallback(() => {
    if (!tlRef.current) {
      onClose();
      return;
    }
    // Reverse the animation, then call onClose
    tlRef.current.reverse();
    // Listen for reverse complete
    tlRef.current.eventCallback('onReverseComplete', () => {
      onClose();
    });
  }, [onClose]);

  useEffect(() => {
    if (!poster || !backdropRef.current || !contentRef.current) return;

    const tl = gsap.timeline();
    tlRef.current = tl;

    // Set initial states
    gsap.set(backdropRef.current, { opacity: 0 });
    gsap.set(contentRef.current, { opacity: 0, scale: 0.8 });

    // Backdrop fades in
    tl.to(backdropRef.current, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out',
    });

    // Content scales up and fades in
    tl.to(
      contentRef.current,
      {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: 'back.out(1.4)',
      },
      '-=0.1'
    );

    return () => {
      tl.kill();
    };
  }, [poster]);

  // Handle Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  if (!poster) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[70] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
      onClick={handleClose}
    >
      <div
        ref={contentRef}
        className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: '#fafafa' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header matching poster color */}
        <div
          className="w-full h-64 relative"
          style={{
            background: `linear-gradient(135deg, ${poster.color}, ${poster.color}99, ${poster.color}44)`,
          }}
        >
          {/* Decorative circles */}
          <div
            className="absolute top-8 right-8 w-24 h-24 rounded-full opacity-20"
            style={{ backgroundColor: '#ffffff' }}
          />
          <div
            className="absolute bottom-12 left-12 w-16 h-16 rounded-full opacity-15"
            style={{ backgroundColor: '#ffffff' }}
          />
          <div
            className="absolute top-16 left-1/3 w-32 h-32 rounded-full opacity-10"
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{poster.title}</h2>
          <p className="text-gray-600 leading-relaxed text-base">{poster.description}</p>

          <div className="mt-6 flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: poster.color }}
            />
            <span className="text-xs text-gray-400 uppercase tracking-widest">
              Digital Artwork
            </span>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
