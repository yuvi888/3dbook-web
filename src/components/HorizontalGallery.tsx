'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const GALLERY_ITEMS = [
  { title: 'Architecture', subtitle: 'Modern Design', color: '#1a1a2e' },
  { title: 'Nature', subtitle: 'Raw Beauty', color: '#16213e' },
  { title: 'Technology', subtitle: 'Future Forward', color: '#0f3460' },
  { title: 'Fashion', subtitle: 'Bold Statements', color: '#533483' },
  { title: 'Abstract', subtitle: 'Pure Form', color: '#e94560' },
  { title: 'Portrait', subtitle: 'Human Stories', color: '#1a1a2e' },
];

export default function HorizontalGallery() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const totalScrollWidth = track.scrollWidth - window.innerWidth;

    const tween = gsap.to(track, {
      x: -totalScrollWidth,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        pin: true,
        scrub: 1,
        end: () => `+=${totalScrollWidth}`,
        invalidateOnRefresh: true,
      },
    });

    // Parallax on inner content
    const cards = track.querySelectorAll('.gallery-card-inner');
    cards.forEach((card) => {
      gsap.fromTo(
        card,
        { x: -30 },
        {
          x: 30,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            scrub: 1,
          },
        }
      );
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === section) st.kill();
      });
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      <div ref={trackRef} className="flex gap-8 px-12 py-20 items-center h-screen">
        {GALLERY_ITEMS.map((item, i) => (
          <div
            key={i}
            className="group flex-shrink-0 w-[400px] aspect-square rounded-2xl relative overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${item.color}, ${item.color}cc, ${item.color}66)`,
            }}
          >
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Parallax inner content */}
            <div className="gallery-card-inner absolute inset-0 flex flex-col justify-end p-8">
              <span className="text-white/60 text-sm font-light tracking-widest uppercase mb-2">
                {item.subtitle}
              </span>
              <h3 className="text-white text-3xl font-bold tracking-tight">
                {item.title}
              </h3>

              {/* Decorative line */}
              <div className="mt-4 w-12 h-[2px] bg-white/40 group-hover:w-20 transition-all duration-500" />
            </div>

            {/* Decorative circle */}
            <div
              className="absolute top-8 right-8 w-16 h-16 rounded-full border border-white/20 group-hover:scale-125 transition-transform duration-500"
              style={{
                background: `radial-gradient(circle, ${item.color}00, ${item.color}44)`,
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
