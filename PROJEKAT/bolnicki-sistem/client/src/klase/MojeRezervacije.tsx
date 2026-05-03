import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, User, ArrowLeft, AlertCircle, Calendar, MapPin, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Home, Calendar as CalendarIcon, Stethoscope, LogOut, Menu } from "lucide-react";

interface Rezervacija {
  id: number;
  datum: string;
  vrijeme: number;
  doktor: string;
  tip: "hitni" | "preventivni" | "kontrolni";
  komentar?: string;
  soba: string;
}

// ─── Sidebar ───────────────────────────────────────────────────────────────
function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();
  const menuItems = [
    { icon: Home, label: "Naslovna", href: "/" },
    { icon: CalendarIcon, label: "Moje Rezervacije", href: "/moje-rezervacije" },
    { icon: Stethoscope, label: "Odjeli", href: "/step1-odjeli" },
    { icon: User, label: "Profil", href: "#" },
  ];
  
  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col fixed h-screen z-50 transition-all duration-300 ${
        open ? "w-64" : "w-0 overflow-hidden border-r-0"
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
          <button className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium whitespace-nowrap">
            <LogOut size={18} className="flex-shrink-0" />
            Odjava
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            title="Zatvori meni"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Glavni komponent ───────────────────────────────────────────────────────
const MojeRezervacije = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1));
  const [selectedDate, setSelectedDate] = useState<string | null>("2026-05-14");
  const [detaljiRez, setDetaljiRez] = useState<Rezervacija | null>(null);

  const [rezervacije, setRezervacije] = useState<Rezervacija[]>([
    { id: 1, datum: "2026-05-05", vrijeme: 830, doktor: "Dr. Amira Hadžić", tip: "kontrolni", komentar: "Kardiologija - Kontrolni pregled", soba: "Ambulanta K-1" },
    { id: 2, datum: "2026-05-07", vrijeme: 1415, doktor: "Dr. Miloš Đurić", tip: "hitni", komentar: "Kardiologija - EKG", soba: "Ambulanta K-3" },
    { id: 3, datum: "2026-05-12", vrijeme: 900, doktor: "Dr. Marko Vujović", tip: "preventivni", komentar: "Opšta medicina - Preventivni pregled", soba: "Ordinacija O-2" },
    { id: 4, datum: "2026-05-14", vrijeme: 830, doktor: "Dr. Amira Hadžić", tip: "kontrolni", komentar: "Kardiologija - Kontrolni pregled", soba: "Ambulanta K-1" },
    { id: 5, datum: "2026-05-14", vrijeme: 1415, doktor: "Dr. Miloš Đurić", tip: "hitni", komentar: "Kardiologija - EKG", soba: "Ambulanta K-3" },
    { id: 6, datum: "2026-05-14", vrijeme: 1100, doktor: "Dr. Ana Nikolić", tip: "preventivni", komentar: "Pneumologija - Kontrola", soba: "Ordinacija P-1" },
    { id: 7, datum: "2026-05-15", vrijeme: 1000, doktor: "Dr. Selma Kovač", tip: "kontrolni", komentar: "Neurologija - Kontrola", soba: "Ambulanta N-2" },
    { id: 8, datum: "2026-05-15", vrijeme: 1400, doktor: "Dr. Emir Bašić", tip: "preventivni", komentar: "Interna - Pregled", soba: "Ordinacija I-1" },
    { id: 9, datum: "2026-05-21", vrijeme: 1400, doktor: "Dr. Petar Jovanović", tip: "hitni", komentar: "Neurologija - Hitna konsultacija", soba: "Ambulanta N-1" },
    { id: 10, datum: "2026-05-21", vrijeme: 900, doktor: "Dr. Jelena Marković", tip: "preventivni", komentar: "Oftalmologija - Pregled", soba: "Ordinacija O-3" },
    { id: 11, datum: "2026-05-28", vrijeme: 1000, doktor: "Dr. Jelena Marković", tip: "preventivni", komentar: "Oftalmologija - Preventivni pregled", soba: "Ordinacija O-3" },
    { id: 12, datum: "2026-05-28", vrijeme: 1130, doktor: "Dr. Nikola Jovanović", tip: "kontrolni", komentar: "Pedijatrija - Kontrola", soba: "Ambulanta P-2" },
  ]);

  const tipStyle = {
    hitni: { dot: "bg-red-500", text: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Hitni", badge: "bg-red-100 text-red-700" },
    preventivni: { dot: "bg-green-500", text: "text-green-600", bg: "bg-green-50", border: "border-green-200", label: "Preventivni", badge: "bg-green-100 text-green-700" },
    kontrolni: { dot: "bg-blue-500", text: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "Kontrolni", badge: "bg-blue-100 text-blue-700" },
  };

  const getDaysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  const toDateStr = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const getDayRez = (day: number) => {
    const ds = toDateStr(currentDate.getFullYear(), currentDate.getMonth(), day);
    return rezervacije.filter(r => r.datum === ds);
  };

  const selectedRez = selectedDate ? rezervacije.filter(r => r.datum === selectedDate) : [];

  const formatV = (v: number) => {
    const h = Math.floor(v / 100).toString().padStart(2, "0");
    const m = (v % 100).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const formatDateLabel = (ds: string) =>
    new Date(ds + "T00:00:00").toLocaleDateString("bs-BA", { day: "numeric", month: "long" });

  const monthName = currentDate.toLocaleDateString("bs-BA", { month: "long", year: "numeric" });

  const daysArr = () => {
    const first = getFirstDay(currentDate);
    const total = getDaysInMonth(currentDate);
    const arr: (number | null)[] = [];
    for (let i = 0; i < first; i++) arr.push(null);
    for (let i = 1; i <= total; i++) arr.push(i);
    return arr;
  };

  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const handleCancel = (id: number) => {
    if (window.confirm("Jeste li sigurni da želite otkazati ovu rezervaciju?")) {
      setRezervacije(prev => prev.filter(r => r.id !== id));
      setDetaljiRez(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f0f7ff]"> {/* Mekša plava pozadina iz dizajna */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">

            {/* Header sa slike */}
            <div className="mb-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {!sidebarOpen && (
                  <button onClick={() => setSidebarOpen(true)} className="p-2.5 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition-all">
                    <Menu size={22} className="text-blue-600" />
                  </button>
                )}
                <div>
                  <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Moje Rezervacije</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex -space-x-2">
                       <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                       <div className="w-5 h-5 rounded-full bg-gray-300 border-2 border-white shadow-sm"></div>
                       <div className="w-5 h-5 rounded-full bg-gray-200 border-2 border-white shadow-sm"></div>
                    </div>
                    <p className="text-slate-500 text-sm font-medium ml-2">Moje Rezervacije - Pregled</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Kalendar Panel (Lijevo) */}
              <div className="lg:col-span-7 bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-blue-100/50 border border-white p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-slate-800 capitalize">{monthName}</h2>
                  <div className="flex items-center gap-3 bg-gray-100/50 p-1 rounded-xl">
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                      <ChevronLeft size={20} className="text-slate-600" />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors">
                      Today
                    </button>
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                      <ChevronRight size={20} className="text-slate-600" />
                    </button>
                  </div>
                </div>

                {/* Dani zaglavlje */}
                <div className="grid grid-cols-7 mb-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                    <div key={d} className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest">{d}</div>
                  ))}
                </div>

                {/* Dani u gridu */}
                <div className="grid grid-cols-7 gap-3">
                  {daysArr().map((day, idx) => {
                    const ds = day ? toDateStr(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
                    const rez = day ? getDayRez(day) : [];
                    const isSelected = ds === selectedDate;
                    const isToday = ds === todayStr;

                    return (
                      <button
                        key={idx}
                        onClick={() => day && setSelectedDate(ds)}
                        disabled={!day}
                        className={`aspect-square p-2 rounded-2xl border-2 transition-all flex flex-col justify-between items-center ${
                          !day ? "border-transparent opacity-0 cursor-default" :
                          isSelected ? "border-blue-500 bg-white shadow-lg shadow-blue-100 scale-105" :
                          isToday ? "border-green-400 bg-green-50/50" :
                          "border-gray-50 bg-white/50 hover:bg-white hover:border-blue-200 hover:shadow-md"
                        }`}
                      >
                        <span className={`text-lg font-bold ${isSelected ? "text-blue-600" : "text-slate-700"}`}>
                          {day}
                        </span>
                        <div className="flex gap-1 justify-center mb-1">
                          {rez.slice(0, 3).map((r, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${tipStyle[r.tip].dot} shadow-sm`} />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detalji za dan (Desno) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-blue-100/50 border border-white p-8">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">
                    Rezervacije za: <span className="text-blue-600 font-extrabold">{selectedDate ? formatDateLabel(selectedDate) : "Odaberite datum"}</span>
                  </h3>

                  {selectedDate && selectedRez.length > 0 ? (
                    <div className="space-y-4">
                      {selectedRez.map(res => {
                        const s = tipStyle[res.tip];
                        return (
                          <div key={res.id} className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all border-l-8" style={{ borderColor: `var(--tw-color-${res.tip === 'hitni' ? 'red' : res.tip === 'kontrolni' ? 'blue' : 'green'}-500)` }}>
                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                  <Clock size={20} />
                                </div>
                                <span className="text-2xl font-black text-slate-800 tracking-tight">{formatV(res.vrijeme)}</span>
                              </div>
                              <div className={`w-3 h-3 rounded-full ${s.dot} animate-pulse`} />
                            </div>
                            
                            <div className="space-y-1 mb-5">
                              <h4 className="font-bold text-slate-800 text-lg">{res.doktor}</h4>
                              <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                                <Stethoscope size={14} /> {res.komentar}
                              </p>
                            </div>

                            <div className="flex gap-3">
                              <button onClick={() => handleCancel(res.id)} className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-slate-600 bg-gray-50 hover:bg-gray-100 transition-all">
                                Otkaži
                              </button>
                              <button onClick={() => setDetaljiRez(res)} className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                                Detalji
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                      <CalendarIcon size={48} className="text-gray-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold">Nema rezervacija za ovaj dan</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Detalji modal */}
      {detaljiRez && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDetaljiRez(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Detalji rezervacije</h3>
              <button onClick={() => setDetaljiRez(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-gray-400" />
                <span className="text-sm text-gray-600">Vrijeme:</span>
                <span className="text-sm font-semibold text-gray-900">{formatV(detaljiRez.vrijeme)}</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={15} className="text-gray-400" />
                <span className="text-sm text-gray-600">Doktor:</span>
                <span className="text-sm font-semibold text-gray-900">{detaljiRez.doktor}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-gray-400" />
                <span className="text-sm text-gray-600">Soba:</span>
                <span className="text-sm font-semibold text-gray-900">{detaljiRez.soba}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${tipStyle[detaljiRez.tip].dot}`} />
                <span className="text-sm text-gray-600">Tip:</span>
                <span className={`text-sm font-semibold ${tipStyle[detaljiRez.tip].text}`}>{tipStyle[detaljiRez.tip].label}</span>
              </div>
              {detaljiRez.komentar && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 leading-relaxed">{detaljiRez.komentar}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => handleCancel(detaljiRez.id)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Otkaži termin
              </button>
              <button
                onClick={() => setDetaljiRez(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MojeRezervacije;