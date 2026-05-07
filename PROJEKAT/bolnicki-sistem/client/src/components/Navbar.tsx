import { useState, useEffect } from 'react';
import { Activity, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Početna', href: '#hero' },
    { label: 'O nama', href: '#prednosti' },
    { label: 'Usluge', href: '#kako-radi' },
    { label: 'Kontakt', href: '#doktori' },
  ];

  const handleNavClick = (href: string) => {
    const element = document.querySelector(href);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${scrolled ? 'bg-blue-700' : 'bg-white/20 backdrop-blur-sm'}`}>
            <Activity className={`w-5 h-5 ${scrolled ? 'text-white' : 'text-white'}`} />
          </div>
          <span className={`text-xl font-bold tracking-tight ${scrolled ? 'text-blue-900' : 'text-white'}`}>
            SwiftMed
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.href)}
              className={`nav-link text-sm font-medium ${scrolled ? 'text-gray-600 hover:text-blue-700' : 'text-white/90 hover:text-white'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              scrolled
                ? 'text-blue-700 border border-blue-200 hover:bg-blue-50'
                : 'text-white border border-white/30 hover:bg-white/10'
            }`}
          >
            Prijava
          </button>
          <button className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800 transition-all duration-200 shadow-sm hover:shadow-md">
            Registracija
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen
            ? <X className={`w-6 h-6 ${scrolled ? 'text-gray-700' : 'text-white'}`} />
            : <Menu className={`w-6 h-6 ${scrolled ? 'text-gray-700' : 'text-white'}`} />
          }
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-lg mt-1 px-6 py-4 flex flex-col gap-4">
          {navLinks.map((item) => (
            <button key={item.label} onClick={() => handleNavClick(item.href)} className="text-gray-700 font-medium hover:text-blue-700">{item.label}</button>
          ))}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button className="flex-1 py-2 rounded-lg text-sm font-medium text-blue-700 border border-blue-200 hover:bg-blue-50">Prijava</button>
            <button className="flex-1 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800">Registracija</button>
          </div>
        </div>
      )}
    </nav>
  );
}
