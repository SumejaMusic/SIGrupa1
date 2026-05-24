// src/components/StaffLayout.tsx
import { ReactNode, useState, useEffect } from "react";
import {
  Calendar, Users, AlertTriangle, XCircle,
  LogOut, ChevronLeft, Menu, Activity, Bell
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {  User, ChevronDown, Home,  Stethoscope } from "lucide-react";
interface Props {
  children: ReactNode;
}

export default function StaffLayout({ children }: Props) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [korisnik, setKorisnik] = useState<{ ime: string; prezime: string; uloga: string } | null>(null);

  useEffect(() => {
    const ucitaj = () => {
      const saved = localStorage.getItem("korisnik");
      try {
        setKorisnik(saved ? JSON.parse(saved) : null);
      } catch {
        setKorisnik(null);
      }
    };

    ucitaj();
    window.addEventListener("istekla-sesija", ucitaj);
    window.addEventListener("storage", ucitaj);

    return () => {
      window.removeEventListener("istekla-sesija", ucitaj);
      window.removeEventListener("storage", ucitaj);
    };
  }, [location.pathname]);

  const handleOdjava = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("korisnik");
    window.location.replace("/prijava");
  };

  const inicijali = korisnik
    ? `${korisnik.ime?.[0] ?? ""}${korisnik.prezime?.[0] ?? ""}`.toUpperCase()
    : "?";

  const menuItems = [
    { icon: Calendar, label: "Panel osoblja", href: "/osoblje-panel" },
    { icon: Home, label: "Naslovna", href: "/" },
    
    //{ icon: Stethoscope, label: "Odjeli", href: "/step1-odjeli" }, ne znam treba li za medicinsko osoblje
    { icon: User, label: "Profil", href: "#" },
  ];

  return (
    // 🌟 POPRAVAK: h-screen i overflow-hidden eliminišu trzanje čitave stranice na ekranu
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      {/* 🌟 POPRAVAK: Izbačen fixed i ml-64. Dodana glatka tranzicija sa min-w koji drži layout stabilnim */}
      <div
        className={`bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-64 opacity-100" : "w-0 opacity-0 overflow-hidden border-r-0"
        }`}
      >
        <div className="p-6 flex flex-col h-full min-w-[256px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 whitespace-nowrap">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity size={16} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-blue-900">SwiftMed</span>
          </Link>

          {/* Uloga badge (Zadržano kako si tražila!) */}
          <div className="mb-6 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-500 font-medium">Prijavljeni kao</p>
            <p className="text-sm font-semibold text-blue-800 truncate">
              {korisnik?.ime} {korisnik?.prezime}
            </p>
            <p className="text-xs text-blue-400 capitalize">
              {korisnik?.uloga?.toLowerCase().replace("_", " ") ?? "osoblje"}
            </p>
          </div>

          {/* Navigacija */}
          <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? location.pathname === "/"
                  : location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer: odjava + collapse */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 flex-shrink-0">
            <button
              onClick={handleOdjava}
              className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-sm font-medium whitespace-nowrap"
            >
              <LogOut size={18} className="flex-shrink-0" />
              Odjava
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        
        {/* Topbar (Čist, bez koraka i breadcrumbsa!) */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <Menu size={20} />
              </button>
            )}
            <h1 className="text-base font-semibold text-gray-800">
              Panel medicinskog osoblja
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm flex-shrink-0">
              {inicijali}
            </div>
          </div>
        </header>

        {/* Stranica */}
        {/* 🌟 POPRAVAK: Skrolovanje je izolovano samo ovdje, dok Topbar i Sidebar stoje fiksno */}
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
