import {
  ChevronLeft,
  Calendar,
  Activity,
  Home,
  LogOut,
  User
} from "lucide-react";

import { Link } from "react-router-dom";

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
    <div className={`bg-white border-r border-gray-200 flex flex-col fixed h-screen z-50 transition-all duration-300 ${open ? "w-60" : "w-0 overflow-hidden"}`}>
      <div className="p-5 flex flex-col h-full">
        <Link to="/" className="flex items-center gap-2 mb-8 whitespace-nowrap">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Activity size={16} color="#fff" />
          </div>
          <span className="font-bold text-lg text-blue-900">SwiftMed</span>
        </Link>
        <nav className="flex-1 space-y-1">
          {items.map(item => (
            <Link key={item.href} to={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap transition-colors ${item.active ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
              <item.icon size={17} className="flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm whitespace-nowrap">
            <LogOut size={16} /> Odjava
          </button>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}