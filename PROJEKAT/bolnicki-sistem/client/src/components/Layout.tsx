import { ReactNode, useState, useEffect } from "react"; // Dodan useEffect
import { Bell, User, ChevronDown, Home, Calendar, Stethoscope, LogOut, ChevronLeft, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { apiUrl } from '../lib/api';
// 2. Inicijalizuj socket koristeći funkciju apiUrl
const socket = io(apiUrl('/'));

interface LayoutProps {
  children: ReactNode;
  step: number;
  totalSteps: number;
  breadcrumbs: string[];
  
}

export default function Layout({ children, step, totalSteps, breadcrumbs }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 1. Postavljamo korisnika kao STATE da bi React mogao osvježiti UI
  const [korisnik, setKorisnik] = useState<{ ime: string; prezime: string } | null>(null);
useEffect(() => {
  const handlePageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      // Force reload ako se korisnik vratio preko 'Back' dugmeta
      window.location.reload();
    }
  };

  window.addEventListener('pageshow', handlePageShow);

  return () => {
    window.removeEventListener('pageshow', handlePageShow);
  };
}, []);
  useEffect(() => {
    const ucitajKorisnika = () => {
      const saved = localStorage.getItem("korisnik");
      if (saved) {
        try {
          setKorisnik(JSON.parse(saved));
        } catch {
          setKorisnik(null);
        }
      } else {
        setKorisnik(null);
      }
    };

    // Učitaj odmah pri mountu
    ucitajKorisnika();

    // 2. Slušaj Socket.io događaj (ispravljeno)
    // Ne koristimo 'message' i addEventListener, već .on('naziv_eventa')
    const handleLoginSuccess = (data: any) => {
      console.log("Primljeno obavještenje o prijavi:", data);
      ucitajKorisnika();
    };

    socket.on('LOGIN_SUCCESS', handleLoginSuccess);

    // 3. Slušaj lokalne signale (istekla-sesija smo dodali u PrijavaPage)
    window.addEventListener('istekla-sesija', ucitajKorisnika);
    window.addEventListener('storage', ucitajKorisnika); // Za promjene u drugim tabovima bez socketa

    return () => {
      // Čišćenje (cleanup)
      socket.off('LOGIN_SUCCESS', handleLoginSuccess);
      window.removeEventListener('istekla-sesija', ucitajKorisnika);
      window.removeEventListener('storage', ucitajKorisnika);
    };
  }, [location.pathname]);

  // 2. Funkcija za ručnu odjavu koja poštuje NFR-14 (briše historiju)
  const handleOdjava = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("korisnik");
    window.location.replace('/prijava'); 
  };

  // 3. Računanje inicijala
  const inicijali = korisnik
    ? `${korisnik.ime?.[0] ?? ""}${korisnik.prezime?.[0] ?? ""}`.toUpperCase()
    : "?";

  const menuItems = [
    { icon: Home, label: "Naslovna", href: "/" },
    { icon: Calendar, label: "Moje Rezervacije", href: "/moje-rezervacije" },
    { icon: Stethoscope, label: "Odjeli", href: "/step1-odjeli" },
    { icon: User, label: "Profil", href: "#" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* SIDEBAR */}
      <div className={`bg-white border-r border-gray-200 flex flex-col fixed h-screen z-50 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0 overflow-hidden border-r-0"
        }`}
      >
        <div className="p-6 flex flex-col h-full">
          <Link to="/" className="flex items-center gap-2 mb-8 whitespace-nowrap">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              SM
            </div>
            <span className="text-xl font-bold tracking-tight text-blue-900">SwiftMed</span>
          </Link>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${
                    isActive ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {/* OVDJE DODANA FUNKCIJA ZA ODJAVU */}
            <button 
              onClick={handleOdjava}
              className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
            >
              <LogOut size={18} className="flex-shrink-0" />
              Odjava
            </button>

            <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                  <Menu size={20} />
                </button>
              )}
              <span className="font-bold text-gray-900 text-sm">KORAK {step}/{totalSteps}</span>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <Bell size={20} className="text-gray-700" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {inicijali}
                </div>
                <ChevronDown size={16} className="text-gray-700" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm flex-wrap">
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {idx > 0 && <span className="text-gray-400">&gt;</span>}
                <span className={idx + 1 === step ? "text-blue-600 font-semibold" : "text-gray-500"}>
                  {crumb}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}