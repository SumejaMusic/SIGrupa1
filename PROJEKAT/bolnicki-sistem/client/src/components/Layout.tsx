import { ReactNode, useState } from "react";
import { Bell, User, ChevronDown, Home, Calendar, Stethoscope, LogOut, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
  step: number;
  totalSteps: number;
  breadcrumbs: string[];
}

export default function Layout({ children, step, totalSteps, breadcrumbs }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { icon: Home, label: "Naslovna", href: "/" },
    { icon: Calendar, label: "Moje Rezervacije", href: "/moje-rezervacije" },
    { icon: Stethoscope, label: "Odjeli", href: "/step1-odjeli" },
    { icon: User, label: "Profil", href: "#" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* SIDEBAR */}
      <div
        className={`bg-white border-r border-gray-200 flex flex-col fixed h-screen z-50 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0 overflow-hidden border-r-0"
        }`}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 whitespace-nowrap">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              SM
            </div>
            <span className="text-xl font-bold tracking-tight text-blue-900">SwiftMed</span>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Odjava + Toggle dugme */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium whitespace-nowrap">
              <LogOut size={18} className="flex-shrink-0" />
              Odjava
            </button>

            {/* Zatvori sidebar */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              title="Zatvori meni"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        {/* TOP HEADER */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between mb-4">

            <div className="flex items-center gap-3">
              {/* Otvori sidebar dugme — vidljivo samo kad je zatvoren */}
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                  title="Otvori meni"
                >
                  <Menu size={20} />
                </button>
              )}
              <span className="font-bold text-gray-900 text-sm">KORAK {step}/{totalSteps}</span>
            </div>

            {/* Notifikacije i profil */}
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell size={20} className="text-gray-700" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  M
                </div>
                <ChevronDown size={16} className="text-gray-700" />
              </button>
            </div>
          </div>

          {/* Breadcrumb */}
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

          {/* Progress bar */}
          <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}