'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Wrap each character in a span for stagger animation
      const wrapChars = (el: HTMLElement) => {
        const text = el.textContent || '';
        el.innerHTML = text
          .split('')
          .map((ch) =>
            ch === ' '
              ? '<span class="inline-block">&nbsp;</span>'
              : `<span class="inline-block opacity-0 translate-y-full">${ch}</span>`
          )
          .join('');
        return el.querySelectorAll('span');
      };

      const chars1 = line1Ref.current ? wrapChars(line1Ref.current) : [];
      const chars2 = line2Ref.current ? wrapChars(line2Ref.current) : [];

      const tl = gsap.timeline({ delay: 2.5 }); // wait for loader

      tl.to(chars1, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.04,
        ease: 'power3.out',
      })
        .to(
          chars2,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.04,
            ease: 'power3.out',
          },
          '-=0.3'
        )
        .fromTo(
          subtitleRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
          '-=0.2'
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="home"
      className="relative h-screen w-full flex flex-col items-center justify-center z-10 pointer-events-none select-none"
    >
      {/* Main heading */}
      <div className="text-center pointer-events-none">
        <div
          ref={line1Ref}
          className="text-white text-7xl md:text-9xl font-bold tracking-tight leading-none overflow-hidden"
        >
          ENTER THE
        </div>
        <div
          ref={line2Ref}
          className="text-white text-7xl md:text-9xl font-bold tracking-tight leading-none overflow-hidden mt-2"
        >
          DIMENSION
        </div>
      </div>

      {/* Subtitle + bouncing arrow */}
      <div ref={subtitleRef} className="mt-12 flex flex-col items-center gap-4 opacity-0">
        <p className="text-white/60 text-sm md:text-base tracking-widest uppercase">
          Scroll to explore the gallery
        </p>
        <svg
          className="w-6 h-6 text-white/50 animate-bounce"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Bottom gradient overlay – fades hero into dark content below */}
      <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
    </section>
  );
}
