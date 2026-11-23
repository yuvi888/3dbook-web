'use client';

const quickLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Services', href: '#services' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

const socials = [
  { letter: 'F', label: 'Facebook' },
  { letter: 'T', label: 'Twitter' },
  { letter: 'I', label: 'Instagram' },
  { letter: 'L', label: 'LinkedIn' },
];

export default function Footer() {
  return (
    <footer className="relative w-full py-16 px-6" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Logo & tagline */}
        <div>
          <h2 className="text-white text-2xl font-bold tracking-widest mb-4">VERTEX</h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Pushing the boundaries of digital experience through art, code, and imagination.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white/60 text-sm uppercase tracking-wider mb-4">Quick Links</h3>
          <ul className="flex flex-col gap-3">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-white/40 hover:text-purple-400 text-sm transition-colors duration-300"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Social */}
        <div>
          <h3 className="text-white/60 text-sm uppercase tracking-wider mb-4">Follow Us</h3>
          <div className="flex gap-4">
            {socials.map((s) => (
              <a
                key={s.letter}
                href="#"
                aria-label={s.label}
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:border-purple-500 hover:text-purple-400 transition-all duration-300"
              >
                <span className="text-sm font-semibold">{s.letter}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-white/30 text-xs">© 2024 VERTEX. All rights reserved.</p>
        <p className="text-white/20 text-xs italic">Built with passion and pixels</p>
      </div>
    </footer>
  );
}
