'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    title: '3D Experiences',
    description: 'Immersive three-dimensional worlds that push creative boundaries',
    color: '#8B5CF6',
    icon: (
      <svg viewBox="0 0 40 40" className="w-10 h-10">
        <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="6" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  },
  {
    title: 'Motion Design',
    description: 'Fluid animations that bring interfaces to life',
    color: '#3B82F6',
    icon: (
      <svg viewBox="0 0 40 40" className="w-10 h-10">
        <polygon points="20,4 36,36 4,36" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: 'Web Development',
    description: 'Cutting-edge websites built with modern technologies',
    color: '#14B8A6',
    icon: (
      <svg viewBox="0 0 40 40" className="w-10 h-10">
        <rect x="6" y="6" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" rx="2" />
      </svg>
    ),
  },
  {
    title: 'Brand Identity',
    description: 'Visual systems that communicate your unique story',
    color: '#F59E0B',
    icon: (
      <svg viewBox="0 0 40 40" className="w-10 h-10">
        <polygon
          points="20,2 26.2,14.6 40,16.6 30,26.3 32.4,40 20,33.4 7.6,40 10,26.3 0,16.6 13.8,14.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
];

export default function ServicesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animations
      gsap.from('.services-number', {
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

      gsap.from('.services-heading', {
        opacity: 0,
        y: 40,
        duration: 0.8,
        delay: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      });

      // Cards stagger
      const cards = cardsRef.current?.querySelectorAll('.service-card');
      if (cards) {
        gsap.from(cards, {
          opacity: 0,
          y: 50,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cardsRef.current,
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
      id="services"
      className="relative w-full py-32 px-6"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-20">
          <span className="services-number block text-8xl md:text-9xl font-bold text-white/10 leading-none mb-4">
            02
          </span>
          <h2 className="services-heading text-4xl md:text-5xl font-bold text-white leading-tight">
            What We <span className="text-purple-500">Do</span>
          </h2>
        </div>

        {/* Cards grid */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="service-card group relative overflow-hidden rounded-xl p-8 transition-all duration-500 cursor-pointer"
              style={{
                backgroundColor: '#111111',
                borderLeft: `3px solid ${service.color}`,
              }}
            >
              {/* Hover gradient bg */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, ${service.color}15 0%, transparent 60%)`,
                }}
              />

              <div className="relative z-10">
                <div className="mb-6" style={{ color: service.color }}>
                  {service.icon}
                </div>
                <h3 className="text-white text-xl font-semibold mb-3">{service.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
