import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ArrowRight, ClipboardList, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate } from "react-router-dom"; // Dodaj ovo u import
import { getUserRole } from "../utils/auth";
export default function HeroSection() {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate(); // Inicijalizacija navigacije
  const handleProtectedNavigation = (targetPath: string) => {
  const token = localStorage.getItem("token");
  if (!token) {
    navigate("/prijava");
    return;
  }

  if (targetPath === "/moje-rezervacije") {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const uloga = payload.uloga; // "DOKTOR" ili "PACIJENT"
      navigate(uloga === "DOKTOR" ? "/doktor-rezervacije" : "/moje-rezervacije");
    } catch {
      navigate("/moje-rezervacije");
    }
    return;
  }

  navigate(targetPath);
};
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 5);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const stepTitles = [
    'Odaberite odjel',
    'Izaberite doktora',
    'Vrsta pregleda',
    'Odaberite termin',
    'Potvrdi rezervaciju',
  ];

  const stepDescriptions = [
    'Pregledajte dostupne odjele bolnice i odaberite specijalizaciju.',
    'Pogledajte listu doktora sa kvalifikacijama i dostupnošću.',
    'Odaberite vrstu pregleda: preventivni, hitni ili kontrolni.',
    'Vidite sve slobodne termine na kalendaru.',
    'Termin je rezervisan! Potvrda je poslana email-om.',
  ];

  const progressSteps = ['01', '02', '03', '04', '05'];

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background image */}
      <div className="absolute inset-0">
        <img

          src="/slikaRezervacije.png"

  
          alt="Doktor sa pacijentom"
          className="w-full h-full object-cover"
        />
        <div className="hero-overlay absolute inset-0" />
      </div>

      {/* Decorative circles */}
      <div className="absolute top-1/4 right-12 w-72 h-72 rounded-full bg-blue-400/10 border border-blue-300/20 animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute bottom-1/4 right-32 w-40 h-40 rounded-full bg-cyan-400/10 border border-cyan-300/15 animate-float" style={{ animationDelay: '1.5s' }} />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            {/* Top info bar */}
            <div className="animate-fade-in inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 mb-6">
              <span className="text-xs text-white/70">Brzo. Jednostavno. Sigurno.</span>
            </div>

            <h1 className="animate-fade-in delay-100 text-5xl md:text-6xl font-bold text-white leading-tight mb-5">
              Zakažite pregled<br />
              <span className="text-cyan-300">u nekoliko klikova</span>
            </h1>

            <p className="animate-fade-in delay-200 text-lg text-white/80 leading-relaxed mb-8 max-w-xl">
              Odaberite odjel, pronađite doktora, zakažite termin — sve online. Bez čekanja, bez poziva, bez stresa.
            </p>

           <div className="animate-fade-in delay-300 flex flex-wrap gap-4">
  {/* Glavno dugme za zakazivanje */}
  <button 
    onClick={() => handleProtectedNavigation("/step1-odjeli")}
    className="cta-button flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-xl shadow-lg transition-all"
  >
    <CalendarCheck className="w-5 h-5" />
    Zakažite pregled
    <ArrowRight className="w-4 h-4" />
  </button>

  {/* Dugme za moje rezervacije */}
  <button 
    onClick={() => handleProtectedNavigation("/moje-rezervacije")}
    className="cta-button flex items-center gap-2.5 bg-white/10 hover:bg-white/18 backdrop-blur-sm border border-white/25 text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-200"
  >
    <ClipboardList className="w-5 h-5" />
    Moje rezervacije
  </button>
</div>
          </div>

          {/* Right: Animated process visualization */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-md">
              {/* Process animation container */}
              <div className="relative h-96 flex items-center justify-center">
                {/* Progress indicators */}
                <div className="absolute top-0 left-0 right-0 flex justify-between px-2">
                  {progressSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-1 transition-all duration-500 ${
                        idx <= activeStep ? 'opacity-100' : 'opacity-40'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full transition-all duration-500 ${
                          idx <= activeStep ? 'bg-cyan-400' : 'bg-gray-400'
                        }`}
                      />
                    </div>
                  ))}
                </div>

                {/* Animated step card */}
                <div className="w-full px-4">
                  <div className="relative h-64 flex items-center justify-center perspective">
                    {progressSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className={`absolute w-full transition-all duration-700 transform ${
                          idx === activeStep
                            ? 'opacity-100 scale-100 translate-y-0'
                            : idx < activeStep
                            ? 'opacity-0 scale-95 -translate-y-8'
                            : 'opacity-0 scale-95 translate-y-8'
                        }`}
                      >
                        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl text-center">
                          {/* Icon */}
                          <div className="mb-6 flex justify-center">
                            {idx === 0 && (
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center animate-bounce">
                                <svg className="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                            )}
                            {idx === 1 && (
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center animate-pulse">
                                <svg className="w-8 h-8 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                            {idx === 2 && (
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
                                <svg className="w-8 h-8 text-sky-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            )}
                            {idx === 3 && (
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center animate-bounce">
                                <svg className="w-8 h-8 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            {idx === 4 && (
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center scale-pulse-animation">
                                <CheckCircle2 className="w-8 h-8 text-green-700" />
                              </div>
                            )}
                          </div>

                          {/* Title */}
                          <span className="inline-block text-cyan-600 text-xs font-semibold uppercase tracking-widest mb-2">
                            Korak {step}
                          </span>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {stepTitles[idx]}
                          </h3>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {stepDescriptions[idx]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation dots */}
              <div className="flex justify-center gap-2 mt-8">
                {progressSteps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeStep === idx
                        ? 'bg-white w-8'
                        : 'bg-white/40 w-2 hover:bg-white/60'
                    }`}
                    aria-label={`Go to step ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-fade-in delay-800">
        <span className="text-white/50 text-xs">Saznajte više</span>
        <div className="w-5 h-8 border-2 border-white/30 rounded-full flex items-start justify-center pt-1.5">
          <div className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
