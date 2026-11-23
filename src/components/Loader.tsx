'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface LoaderProps {
  onComplete: () => void;
}

export default function Loader({ onComplete }: LoaderProps) {
  const loaderRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          onComplete();
        },
      });

      // Wrap "VERTEX" letters
      if (textRef.current) {
        const text = 'VERTEX';
        textRef.current.innerHTML = text
          .split('')
          .map((ch) => `<span class="inline-block opacity-0">${ch}</span>`)
          .join('');
        const letters = textRef.current.querySelectorAll('span');

        // Stagger letters in
        tl.to(letters, {
          opacity: 1,
          duration: 0.1,
          stagger: 0.12,
          ease: 'power2.out',
        });
      }

      // Progress bar fill + percentage counter
      const counter = { val: 0 };
      tl.to(
        counter,
        {
          val: 100,
          duration: 1.5,
          ease: 'power2.inOut',
          onUpdate: () => {
            const v = Math.round(counter.val);
            if (percentRef.current) percentRef.current.textContent = `${v}%`;
            if (barRef.current) barRef.current.style.width = `${v}%`;
          },
        },
        '+=0.3'
      );

      // Slide loader up to reveal page
      tl.to(loaderRef.current, {
        yPercent: -100,
        duration: 0.8,
        ease: 'power4.inOut',
        delay: 0.3,
      });
    }, loaderRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div
      ref={loaderRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
    >
      {/* Logo text */}
      <div
        ref={textRef}
        className="text-white text-5xl md:text-7xl font-bold tracking-[0.3em] mb-12"
      >
        VERTEX
      </div>

      {/* Progress bar */}
      <div className="w-48 md:w-64 h-[2px] bg-white/10 rounded-full overflow-hidden mb-4">
        <div
          ref={barRef}
          className="h-full bg-purple-500 rounded-full"
          style={{ width: '0%' }}
        />
      </div>

      {/* Percentage */}
      <span ref={percentRef} className="text-white/40 text-sm tracking-widest font-mono">
        0%
      </span>
    </div>
  );
}
