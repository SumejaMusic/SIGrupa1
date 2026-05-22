import {
  ChevronLeft,
  Calendar,
  Activity,
  Home,
  LogOut,
  User
} from "lucide-react";

import { Link } from "react-router-dom";
import { odjava } from "../utils/auth";

export function Sidebar({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const items = [
    { icon: Home, label: "Naslovna", href: "/" },
    { icon: Calendar, label: "Moje rezervacije", href: "/doktor-rezervacije", active: true },
    { icon: User, label: "Profil", href: "#" },
  ];

  return (
    <div className={`bg-white/95 backdrop-blur border-r border-gray-200 flex flex-col fixed h-screen z-50 transition-all duration-300 shadow-sm ${open ? "w-64" : "w-0 overflow-hidden"}`}>
      <div className="p-5 flex flex-col h-full">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 mb-8 whitespace-nowrap group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-700 transition-colors">
            <Activity size={16} color="#fff" />
          </div>
          <span className="font-bold text-lg text-blue-900 tracking-tight">SwiftMed</span>
        </Link>

        {/* Nav items */}
        <nav className="flex-1 space-y-0.5">
          {items.map(item => (
            <Link
              key={item.href}
              to={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all
                ${item.active
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }
              `}
            >
              <item.icon
                size={17}
                className={`flex-shrink-0 ${item.active ? "text-blue-600" : "text-gray-400"}`}
              />
              {item.label}
              {item.active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={odjava}
            className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl text-sm whitespace-nowrap transition-colors"
          >
            <LogOut size={15} /> Odjava
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            title="Zatvori sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}