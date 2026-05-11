import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, User, AlertCircle, Calendar, MapPin, X, FileText, MessageSquare, ExternalLink } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Home, Calendar as CalendarIcon, Stethoscope, LogOut, Menu } from "lucide-react";

interface Komentar {
  id: number;
  tekst: string;
  autor: string;
  datum: string;
  jeDoktor: boolean;
}

interface Nalaz {
  id: number;
  naziv: string;
  datum: string;
  url: string;
}

interface Rezervacija {
  id: number;
  datum: string;
  vrijeme: number;
  doktor: string;
  tip: "hitni" | "preventivni" | "kontrolni";
  komentar?: string;
  soba: string;
  komentari: Komentar[];
  nalazi: Nalaz[];
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
    <div className={`bg-white border-r border-gray-200 flex flex-col fixed h-screen z-50 transition-all duration-300 ${open ? "w-64" : "w-0 overflow-hidden border-r-0"}`}>
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
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${isActive ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
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
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Detalji ─────────────────────────────────────────────────────────
function DetaljiModal({ rez, onClose, onCancel, apiUrl }: {
  rez: Rezervacija;
  onClose: () => void;
  onCancel: (id: number) => void;
  apiUrl: string;
}) {
  const [tab, setTab] = useState<"info" | "komentari" | "nalazi">("info");
  const [nalazi, setNalazi] = useState<Nalaz[]>([]);
  const [komentari, setKomentari] = useState<Komentar[]>(rez.komentari ?? []);
  const [loadingNalazi, setLoadingNalazi] = useState(false);
  const [noviKomentar, setNoviKomentar] = useState("");
  const [saljemo, setSaljemo] = useState(false);

  const getToken = () => localStorage.getItem("token");

  const tipStyle = {
    hitni: { dot: "bg-red-500", text: "text-red-600", label: "Hitni" },
    preventivni: { dot: "bg-green-500", text: "text-green-600", label: "Preventivni" },
    kontrolni: { dot: "bg-blue-500", text: "text-blue-600", label: "Kontrolni" },
  };

  const formatV = (v: number) => {
    const h = Math.floor(v / 60);
    const m = v % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  // ✅ Fetch nalazi sa tokenom
  useEffect(() => {
    if (tab !== "nalazi") return;
    setLoadingNalazi(true);
    fetch(`${apiUrl}/api/nalazi/rezervacija/${rez.id}`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNalazi(data.map((n: any) => ({
            id: n.id,
            naziv: n.naziv,
            datum: n.vrijemeNalaza.split("T")[0],
            url: `${apiUrl}/api/nalazi/${n.id}/pdf`,
          })));
        } else {
          setNalazi([]);
        }
      })
      .catch(() => setNalazi([]))
      .finally(() => setLoadingNalazi(false));
  }, [tab, rez.id]);

  // ✅ Fetch komentara sa tokenom
  useEffect(() => {
    if (tab !== "komentari") return;
    fetch(`${apiUrl}/api/rezervacije/${rez.id}/komentari`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setKomentari(data);
      })
      .catch(() => {});
  }, [tab, rez.id]);

  // ✅ Slanje komentara sa tokenom
  const handleSendKomentar = async () => {
    if (!noviKomentar.trim()) return;
    setSaljemo(true);
    try {
      await fetch(`${apiUrl}/api/rezervacije/${rez.id}/komentar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({ komentar: noviKomentar.trim() }),
      });
      setKomentari(prev => [...prev, {
        id: Date.now(),
        tekst: noviKomentar.trim(),
        autor: "Vi",
        datum: new Date().toISOString().split("T")[0],
        jeDoktor: false,
      }]);
      setNoviKomentar("");
    } catch {
      alert("Greška pri slanju komentara.");
    } finally {
      setSaljemo(false);
    }
  };

  const tabs = [
    { id: "info" as const, label: "Informacije", icon: User },
    { id: "komentari" as const, label: "Komentari", icon: MessageSquare },
    { id: "nalazi" as const, label: "Nalazi", icon: FileText },
  ];

  const borderColor = rez.tip === "hitni" ? "border-red-500" : rez.tip === "preventivni" ? "border-green-500" : "border-blue-500";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-t-4 ${borderColor}`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Detalji rezervacije</h3>
            <p className="text-xs text-gray-500">{rez.datum} · {formatV(rez.vrijeme)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Tabovi */}
        <div className="flex border-b border-gray-100">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors ${tab === t.id ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {/* Sadržaj */}
        <div className="p-5 max-h-96 overflow-y-auto">

          {/* INFO TAB */}
          {tab === "info" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><Clock size={11} /> Vrijeme</div>
                  <div className="text-sm font-bold text-gray-900">{formatV(rez.vrijeme)}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><CalendarIcon size={11} /> Datum</div>
                  <div className="text-sm font-bold text-gray-900">{rez.datum}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><User size={11} /> Doktor</div>
                  <div className="text-sm font-bold text-gray-900">{rez.doktor}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><MapPin size={11} /> Soba</div>
                  <div className="text-sm font-bold text-gray-900">{rez.soba || "—"}</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${tipStyle[rez.tip].dot}`} /> Tip pregleda
                </div>
                <div className={`text-sm font-bold ${tipStyle[rez.tip].text}`}>{tipStyle[rez.tip].label}</div>
              </div>
              {rez.komentar && (
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <div className="text-xs text-blue-500 mb-1 font-semibold">Vaš komentar pri rezervaciji</div>
                  <p className="text-sm text-gray-700 leading-relaxed">{rez.komentar}</p>
                </div>
              )}
            </div>
          )}

          {/* KOMENTARI TAB */}
          {tab === "komentari" && (
            <div className="flex flex-col gap-3">
              {komentari.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Nema komentara za ovaj termin</p>
                </div>
              ) : (
                komentari.map(k => (
                  <div key={k.id} className={`rounded-xl p-3 ${k.jeDoktor ? "bg-blue-50 border border-blue-100" : "bg-gray-50 border border-gray-100"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold ${k.jeDoktor ? "text-blue-700" : "text-gray-700"}`}>
                        {k.jeDoktor ? "🩺 " : "👤 "}{k.autor}
                      </span>
                      <span className="text-xs text-gray-400">{k.datum}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{k.tekst}</p>
                  </div>
                ))
              )}
              <div className="border-t border-gray-100 pt-3 mt-1">
                <textarea
                  value={noviKomentar}
                  onChange={e => setNoviKomentar(e.target.value)}
                  placeholder="Napišite poruku doktoru..."
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none outline-none focus:border-blue-400 bg-gray-50"
                />
                <button
                  onClick={handleSendKomentar}
                  disabled={!noviKomentar.trim() || saljemo}
                  className={`mt-2 w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${noviKomentar.trim() && !saljemo ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                >
                  {saljemo ? "Slanje..." : "Pošalji"}
                </button>
              </div>
            </div>
          )}

          {/* NALAZI TAB */}
          {tab === "nalazi" && (
            <div className="space-y-2">
              {loadingNalazi ? (
                <div className="text-center py-8 text-sm text-gray-400">Učitavanje nalaza...</div>
              ) : nalazi.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Nema priloženih nalaza</p>
                </div>
              ) : (
                nalazi.map(n => (
                  <a
                    key={n.id}
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">{n.naziv}</div>
                      <div className="text-xs text-gray-400">{n.datum}</div>
                    </div>
                    <ExternalLink size={14} className="text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                  </a>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={() => onCancel(rez.id)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Otkaži termin
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Zatvori
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
  const [rezervacije, setRezervacije] = useState<Rezervacija[]>([]);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  // ✅ Fetch moje rezervacije sa tokenom
  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem("token");

    fetch(`${apiUrl}/api/rezervacije/moje`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
      .then(res => res.json())
      .then(data => {
        const mapirano = data.map((r: any) => ({
          id: r.id,
          datum: (() => { const d = new Date(r.termin.datum); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(),
          vrijeme: r.termin.vrijeme,
          doktor: `Dr. ${r.doktor.korisnik.ime} ${r.doktor.korisnik.prezime}`,
          tip: r.tipPregleda?.naziv?.toLowerCase().includes("hitni") ? "hitni"
             : r.tipPregleda?.naziv?.toLowerCase().includes("preventivni") ? "preventivni"
             : "kontrolni",
          komentar: r.komentar || "",
          soba: r.soba?.naziv || r.doktor?.soba?.naziv || "—",
          komentari: r.komentar ? [{
            id: r.id * 1000,
            tekst: r.komentar,
            autor: "Vi",
            datum: r.datumKreiranja.split("T")[0],
            jeDoktor: false,
          }] : [],
          nalazi: [],
        }));
        setRezervacije(mapirano);
      })
      .catch(() => setRezervacije([]))
      .finally(() => setLoading(false));
  }, []);

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
    const h = Math.floor(v / 60);
    const m = v % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
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

  // ✅ Otkazivanje sa tokenom
  const handleCancel = async (id: number) => {
    if (!window.confirm("Jeste li sigurni da želite otkazati ovu rezervaciju?")) return;
    try {
      const res = await fetch(`${apiUrl}/api/rezervacije/${id}/otkazi/pacijent`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.poruka || "Nije moguće otkazati rezervaciju.");
        return;
      }
      setRezervacije(prev => prev.filter(r => r.id !== id));
      setDetaljiRez(null);
    } catch {
      alert("Greška pri otkazivanju.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f0f7ff]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">

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

              {/* Kalendar */}
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

                <div className="grid grid-cols-7 mb-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                    <div key={d} className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest">{d}</div>
                  ))}
                </div>

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
                        <span className={`text-lg font-bold ${isSelected ? "text-blue-600" : "text-slate-700"}`}>{day}</span>
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

              {/* Detalji za dan */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-blue-100/50 border border-white p-8">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">
                    Rezervacije za: <span className="text-blue-600 font-extrabold">{selectedDate ? formatDateLabel(selectedDate) : "Odaberite datum"}</span>
                  </h3>

                  {loading ? (
                    <div className="text-center py-12 text-sm text-gray-400">Učitavanje...</div>
                  ) : selectedDate && selectedRez.length > 0 ? (
                    <div className="space-y-4">
                      {selectedRez.map(res => {
                        const s = tipStyle[res.tip];
                        return (
                          <div key={res.id} className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all border-l-8 ${
                            res.tip === "hitni" ? "border-l-red-500" :
                            res.tip === "preventivni" ? "border-l-green-500" :
                            "border-l-blue-500"
                          }`}>
                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                  <Clock size={20} />
                                </div>
                                <span className="text-2xl font-black text-slate-800 tracking-tight">{formatV(res.vrijeme)}</span>
                              </div>
                              <div className={`w-3 h-3 rounded-full ${s.dot} animate-pulse`} />
                            </div>

                            <div className="space-y-1 mb-3">
                              <h4 className="font-bold text-slate-800 text-lg">{res.doktor}</h4>
                              {res.soba && res.soba !== "—" && (
                                <p className="text-slate-500 text-sm flex items-center gap-1.5">
                                  <MapPin size={13} /> {res.soba}
                                </p>
                              )}
                              <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                                <Stethoscope size={14} /> {res.komentar || tipStyle[res.tip].label}
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

      {/* Modal */}
      {detaljiRez && (
        <DetaljiModal
          rez={detaljiRez}
          onClose={() => setDetaljiRez(null)}
          onCancel={handleCancel}
          apiUrl={apiUrl}
        />
      )}
    </div>
  );
};

export default MojeRezervacije;