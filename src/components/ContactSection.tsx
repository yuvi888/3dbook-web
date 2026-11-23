'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.contact-heading', {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      });

      gsap.from('.contact-subtitle', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        delay: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      });

      gsap.from('.contact-cta', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        delay: 0.35,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      });

      gsap.from('.contact-email', {
        opacity: 0,
        duration: 0.8,
        delay: 0.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative w-full py-40 px-6 overflow-hidden"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      {/* Decorative animated gradient orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] pointer-events-none animate-pulse"
        style={{
          background: 'radial-gradient(circle, #8B5CF6 0%, #3B82F6 50%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h2 className="contact-heading text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
          Let&apos;s Create
          <br />
          <span className="text-purple-500">Together</span>
        </h2>

        <p className="contact-subtitle text-white/50 text-lg md:text-xl mb-12 max-w-xl mx-auto">
          Ready to bring your vision to life? Let&apos;s talk.
        </p>

        <div className="contact-cta mb-10">
          <a
            href="mailto:hello@vertex.studio"
            className="inline-block relative px-10 py-4 text-white text-lg font-semibold tracking-wider uppercase border-2 border-purple-500 rounded-full overflow-hidden group transition-colors duration-500 hover:text-white"
          >
            <span className="absolute inset-0 bg-purple-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
            <span className="relative z-10">Get In Touch</span>
          </a>
        </div>

        <p className="contact-email text-white/30 text-sm tracking-widest">
          hello@vertex.studio
        </p>
      </div>
    </section>
  );
}
