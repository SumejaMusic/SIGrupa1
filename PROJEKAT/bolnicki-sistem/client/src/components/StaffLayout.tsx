// src/components/StaffLayout.tsx
//
// Jednostavan layout za medicinski panel — samo sidebar + content.
// Nema koraka, nema breadcrumbs, nema progress bara.
// Kopiran sidebar pattern iz Layout.tsx ali bez svega vezanog za rezervacijski tok.

import { ReactNode, useState, useEffect } from "react";
import {
  Calendar, Users, AlertTriangle, XCircle,
  LogOut, ChevronLeft, Menu, Activity, Bell
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

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
    { icon: Calendar,      label: "Dnevni raspored",  href: "/osoblje" },
    { icon: Users,         label: "Pretraga pacijenta", href: "/osoblje/pretraga" },
    { icon: AlertTriangle, label: "Hitni termini",    href: "/osoblje/hitni" },
    { icon: XCircle,       label: "Otkazani termini", href: "/osoblje/otkazani" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <div
        className={`bg-white border-r border-gray-200 flex flex-col fixed h-screen z-50 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0 overflow-hidden border-r-0"
        }`}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 whitespace-nowrap">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity size={16} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-blue-900">SwiftMed</span>
          </Link>

          {/* Uloga badge */}
          <div className="mb-6 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-500 font-medium">Prijavljeni kao</p>
            <p className="text-sm font-semibold text-blue-800">
              {korisnik?.ime} {korisnik?.prezime}
            </p>
            <p className="text-xs text-blue-400 capitalize">
              {korisnik?.uloga?.toLowerCase().replace("_", " ") ?? "osoblje"}
            </p>
          </div>

          {/* Navigacija */}
          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              // Exact match za /osoblje, startsWith za podstranice
              const isActive =
                item.href === "/osoblje"
                  ? location.pathname === "/osoblje"
                  : location.pathname.startsWith(item.href);

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
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              onClick={handleOdjava}
              className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-sm font-medium whitespace-nowrap"
            >
              <LogOut size={18} className="flex-shrink-0" />
              Odjava
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                <Menu size={20} />
              </button>
            )}
            <h1 className="text-base font-semibold text-gray-800">
              Panel medicinskog osoblja
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {inicijali}
            </div>
          </div>
        </header>

        {/* Stranica */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}