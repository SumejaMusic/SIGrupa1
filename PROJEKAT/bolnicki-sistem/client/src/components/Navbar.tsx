import { useState, useEffect } from 'react';

import { Activity, Menu, X, LogOut, User } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import { useLocation } from 'react-router-dom'; // Dodaj ovo
// Na samom vrhu fajla, izvan komponente Navbar:
import { io } from "socket.io-client";
import { apiUrl } from '../lib/api';

const socket = io(apiUrl('/')); // Koristiš '/' da dobiješ bazni URL bez greške


export default function Navbar() {

 

  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);

  const [korisnik, setKorisnik] = useState<{ ime: string; prezime: string; uloga: string } | null>(null);



  const location = useLocation();



  const ucitajPodatke = () => {

    const podaci = localStorage.getItem('korisnik');

    setKorisnik(podaci ? JSON.parse(podaci) : null);

  };



  useEffect(() => {
  ucitajPodatke(); // Tvoja funkcija koja radi JSON.parse(localStorage.getItem('korisnik'))

  // Slušaj događaje koje smo definisali u PrijavaPage
  const handleLogin = () => ucitajPodatke();
  
  socket.on('LOGIN_SUCCESS', handleLogin);
  socket.on('REFRESH_USER', handleLogin);

  // Lokalni event koji smo ručno ispalili u PrijavaPage
  window.addEventListener('istekla-sesija', ucitajPodatke);

  return () => {
    socket.off('LOGIN_SUCCESS', handleLogin);
    socket.off('REFRESH_USER', handleLogin);
    window.removeEventListener('istekla-sesija', ucitajPodatke);
  };
}, [location.pathname]);

 

  useEffect(() => {

    const handleScroll = () => setScrolled(window.scrollY > 20);

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);

  }, []);



  // 1. Dodaj ovaj useEffect koji sluša "storage" event





  useEffect(() => {

    const handleScroll = () => setScrolled(window.scrollY > 20);

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);

  }, []);



  useEffect(() => {

    const osvjeziKorisnika = () => {

      const podaci = localStorage.getItem('korisnik');

      setKorisnik(podaci ? JSON.parse(podaci) : null);

    };



    // Inicijalno učitavanje pri mount-u

    osvjeziKorisnika();



    // Slušanje evenata za promjene

    window.addEventListener('storage', osvjeziKorisnika);

    window.addEventListener('istekla-sesija', osvjeziKorisnika);



    return () => {

      window.removeEventListener('storage', osvjeziKorisnika);

      window.removeEventListener('istekla-sesija', osvjeziKorisnika);

    };

  }, []);



  const odjava = () => {

    localStorage.removeItem('token');

    localStorage.removeItem('korisnik');

    setKorisnik(null);

    navigate('/');

  };



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

            <Activity className={`w-5 h-5 text-white`} />

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

          {korisnik ? (

            <>

              <button
                onClick={() => navigate('/profil')}
                className={`flex items-center gap-2 text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity ${scrolled ? 'text-gray-700' : 'text-white'}`}
              >
                <User className="w-4 h-4" />
                {korisnik.ime} {korisnik.prezime}
              </button>

              {/* Navigacija prema ulozi */}
              {korisnik.uloga === 'PACIJENT' && (
                <button
                  onClick={() => navigate('/moje-rezervacije')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    scrolled
                      ? 'text-blue-700 border border-blue-200 hover:bg-blue-50'
                      : 'text-white border border-white/30 hover:bg-white/10'
                  }`}
                >
                  Moje Rezervacije
                </button>
              )}
              {korisnik.uloga === 'DOKTOR' && (
                <button
                  onClick={() => navigate('/doktor-rezervacije')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    scrolled
                      ? 'text-blue-700 border border-blue-200 hover:bg-blue-50'
                      : 'text-white border border-white/30 hover:bg-white/10'
                  }`}
                >
                  Doktor Panel
                </button>
              )}
              {korisnik.uloga === 'MEDICINSKO_OSOBLJE' && (
                <button
                  onClick={() => navigate('/osoblje-panel')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    scrolled
                      ? 'text-blue-700 border border-blue-200 hover:bg-blue-50'
                      : 'text-white border border-white/30 hover:bg-white/10'
                  }`}
                >
                  Panel osoblja
                </button>
              )}
              {(korisnik.uloga === 'ADMINISTRATOR' || korisnik.uloga === 'VLASNIK') && (
                  <button
                    onClick={() => navigate(korisnik.uloga === 'VLASNIK' ? '/menadzment' : '/admin')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      scrolled
                        ? 'text-purple-700 border border-purple-200 hover:bg-purple-50'
                        : 'text-white border border-white/30 hover:bg-white/10'
                    }`}
                  >
                    {korisnik.uloga === 'VLASNIK' ? 'Menadžment Panel' : 'Admin Panel'}
                  </button>
                )}

              <button

                onClick={odjava}

                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${

                  scrolled

                    ? 'text-red-600 border border-red-200 hover:bg-red-50'

                    : 'text-white border border-white/30 hover:bg-white/10'

                }`}

              >

                <LogOut className="w-4 h-4" />

                Odjava

              </button>

            </>

          ) : (

            <>

              <button

                onClick={() => navigate('/prijava')}

                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${

                  scrolled

                    ? 'text-blue-700 border border-blue-200 hover:bg-blue-50'

                    : 'text-white border border-white/30 hover:bg-white/10'

                }`}

              >

                Prijava

              </button>

              <button

                onClick={() => navigate('/registracija')}

                className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"

              >

                Registracija

              </button>

            </>

          )}

        </div>



        {/* Mobile menu toggle */}

        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>

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

          <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">

            {korisnik ? (

              <>
                {korisnik.uloga === 'PACIJENT' && (
                  <button onClick={() => { navigate('/moje-rezervacije'); setMenuOpen(false); }} className="flex-1 py-2 rounded-lg text-sm font-medium text-blue-700 border border-blue-200 hover:bg-blue-50">
                    Moje Rezervacije
                  </button>
                )}
                {korisnik.uloga === 'DOKTOR' && (
                  <button onClick={() => { navigate('/doktor-rezervacije'); setMenuOpen(false); }} className="flex-1 py-2 rounded-lg text-sm font-medium text-blue-700 border border-blue-200 hover:bg-blue-50">
                    Doktor Panel
                  </button>
                )}
                {korisnik.uloga === 'MEDICINSKO_OSOBLJE' && (
                  <button onClick={() => { navigate('/osoblje-panel'); setMenuOpen(false); }} className="flex-1 py-2 rounded-lg text-sm font-medium text-blue-700 border border-blue-200 hover:bg-blue-50">
                    Panel osoblja
                  </button>
                )}
                {(korisnik.uloga === 'ADMINISTRATOR' || korisnik.uloga === 'VLASNIK') && (
                  <button
                    onClick={() => { navigate(korisnik.uloga === 'VLASNIK' ? '/menadzment' : '/admin'); setMenuOpen(false); }}
                    className="flex-1 py-2 rounded-lg text-sm font-medium text-purple-700 border border-purple-200 hover:bg-purple-50"
                  >
                    {korisnik.uloga === 'VLASNIK' ? 'Menadžment Panel' : 'Admin Panel'}
                  </button>
                )}
                <button onClick={odjava} className="flex-1 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50">

                Odjava

              </button>
              </>

            ) : (

              <>

                <button onClick={() => navigate('/prijava')} className="flex-1 py-2 rounded-lg text-sm font-medium text-blue-700 border border-blue-200 hover:bg-blue-50">Prijava</button>

                <button onClick={() => navigate('/registracija')} className="flex-1 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800">Registracija</button>

              </>

            )}

          </div>

        </div>

      )}

    </nav>

  );

}
