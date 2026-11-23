'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const bgTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Background decorative text
      gsap.fromTo(
        bgTextRef.current,
        { x: '-10%' },
        {
          x: '10%',
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        }
      );

      // Left side – number + heading
      gsap.from(numberRef.current, {
        opacity: 0,
        y: 60,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      });

      gsap.from(headingRef.current, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        delay: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      });

      // Right side – paragraphs
      const paragraphs = textRef.current?.querySelectorAll('p');
      if (paragraphs) {
        gsap.from(paragraphs, {
          opacity: 0,
          y: 30,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: textRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative w-full py-32 px-6 overflow-hidden"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      {/* Background decorative text */}
      <div
        ref={bgTextRef}
        className="absolute top-1/2 left-0 -translate-y-1/2 whitespace-nowrap text-[12rem] md:text-[20rem] font-bold text-white/[0.02] pointer-events-none select-none leading-none"
      >
        ABOUT VERTEX
      </div>

      <div className="relative max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
        {/* Left – Number + Heading */}
        <div>
          <span
            ref={numberRef}
            className="block text-8xl md:text-9xl font-bold text-white/10 leading-none mb-4"
          >
            01
          </span>
          <h2
            ref={headingRef}
            className="text-4xl md:text-5xl font-bold text-white leading-tight"
          >
            About Our
            <br />
            <span className="text-purple-500">Vision</span>
          </h2>
        </div>

        {/* Right – Description */}
        <div ref={textRef} className="flex flex-col gap-6 pt-4 md:pt-16">
          <p className="text-white/60 text-lg leading-relaxed">
            We are a collective of designers, developers, and dreamers pushing the boundaries of
            digital experience. Our work lives at the intersection of art and technology, creating
            immersive worlds that captivate and inspire.
          </p>
          <p className="text-white/40 text-base leading-relaxed">
            Every project begins with curiosity and a commitment to craft. We believe that the
            digital canvas is limitless — and we&apos;re here to prove it, one pixel at a time.
          </p>
          <p className="text-white/40 text-base leading-relaxed">
            From interactive 3D environments to precision-engineered interfaces, we transform ideas
            into experiences that move people.
          </p>
        </div>
      </div>
    </section>
  );
}
