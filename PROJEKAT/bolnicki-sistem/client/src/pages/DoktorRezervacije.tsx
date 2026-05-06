import { useState, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, Clock, User, FileText,
  MessageSquare, AlertTriangle, Calendar, Activity,
  Menu, Home, LogOut, Send, ExternalLink, X, History,
  Plus, CheckCircle, XCircle, Timer, Search
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL;

type TipPregleda = "hitni" | "preventivni" | "kontrolni";
type StatusTermina = "zakazan" | "zavrsen" | "otkazan";

interface Komentar {
  id: number; tekst: string; autor: string; datum: string; jeDoktor: boolean;
}
interface Nalaz {
  id: number; naziv: string; datum: string; url: string;
}
interface Pacijent {
  id: number; ime: string; prezime: string; godisteRodjenja: number; pol: "M" | "F"; email: string; telefon: string;
}
interface Termin {
  id: number; datum: string; vrijemeOd: number; vrijemeDo: number;
  pacijent: Pacijent; tip: TipPregleda; status: StatusTermina;
  komentari: Komentar[]; nalazi: Nalaz[];
}

const formatV = (v: number) => `${String(Math.floor(v / 100)).padStart(2, "0")}:${String(v % 100).padStart(2, "0")}`;

const tipConfig = {
  hitni: { label: "Hitni", bg: "bg-red-50", border: "border-red-400", text: "text-red-700", badge: "bg-red-100 text-red-700", dot: "bg-red-500", row: "bg-red-50 border-l-4 border-l-red-500", trajanje: 15 },
  preventivni: { label: "Preventivni", bg: "bg-green-50", border: "border-green-300", text: "text-green-700", badge: "bg-green-100 text-green-700", dot: "bg-green-500", row: "bg-white border-l-4 border-l-green-400", trajanje: 30 },
  kontrolni: { label: "Kontrolni", bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500", row: "bg-white border-l-4 border-l-blue-400", trajanje: 30 },
};

const statusConfig = {
  zakazan: { label: "Zakazan", cls: "bg-blue-100 text-blue-700" },
  zavrsen: { label: "Završen", cls: "bg-gray-100 text-gray-600" },
  otkazan: { label: "Otkazan", cls: "bg-red-100 text-red-600" },
};

const getAge = (godiste: number) => new Date().getFullYear() - godiste;

// ─── Mapiranje backend rezervacije na frontend Termin ──────────────────────
function mapiriRezervaciju(r: any): Termin {
  const vrijemeOd = r.termin.vrijeme;

  const trajanje = r.tipPregleda?.trajanjeMinuta ?? r.doktor?.trajanjePregleda ?? 30;
  const sati = Math.floor(vrijemeOd / 100);
  const minute = vrijemeOd % 100;
  const ukupnoMinuta = sati * 60 + minute + trajanje;
  const vrijemeDo = Math.floor(ukupnoMinuta / 60) * 100 + (ukupnoMinuta % 60);

 let tip: TipPregleda = "kontrolni";
if (r.hitnost) {
  tip = "hitni";
} else {
  switch (r.idTipPregleda) {
    case 1: tip = "preventivni"; break;
    case 2: tip = "kontrolni"; break;
    case 3: tip = "hitni"; break;
    default: {
      const naziv = r.tipPregleda?.naziv?.toLowerCase().trim() ?? "";
      if (naziv.includes("preventiv")) tip = "preventivni";
      else if (naziv.includes("hitn")) tip = "hitni";
      break;
    }
  }
}

  let status: StatusTermina = "zakazan";
  if (r.datumOtkazivanja) status = "otkazan";
  else if (r.zavrseno) status = "zavrsen";

  const komentari: Komentar[] = r.komentar ? [{
    id: r.id * 1000,
    tekst: r.komentar,
    autor: `${r.pacijent.korisnik.ime} ${r.pacijent.korisnik.prezime}`,
    datum: new Date(r.datumKreiranja).toISOString().split("T")[0],
    jeDoktor: r.doktorRezervisao,
  }] : [];

  return {
    id: r.id,
    datum: new Date(r.termin.datum).toISOString().split("T")[0],
    vrijemeOd,
    vrijemeDo,
    pacijent: {
      id: r.pacijent.id,
      ime: r.pacijent.korisnik.ime,
      prezime: r.pacijent.korisnik.prezime,
      godisteRodjenja: new Date(r.pacijent.korisnik.datumRodjenja).getFullYear(),
      pol: r.pacijent.korisnik.jmbg?.[6] < "5" ? "M" : "F",
      email: r.pacijent.korisnik.email,
      telefon: r.pacijent.korisnik.brojTelefona ?? "/",
    },
    tip,
    status,
    komentari,
    nalazi: [],
  };
}

// ─── Modal: Nova rezervacija ───────────────────────────────────────────────
function ModalNovaRezervacija({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [pretraga, setPretraga] = useState("");
  const [pacijenti, setPacijenti] = useState<Pacijent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/api/pacijenti`)
      .then(res => res.json())
      .then(data => {
        const mapirani = data.map((p: any) => ({
          id: p.id,
          ime: p.korisnik.ime,
          prezime: p.korisnik.prezime,
          godisteRodjenja: new Date(p.korisnik.datumRodjenja).getFullYear(),
          pol: p.korisnik.jmbg?.[6] < "5" ? "M" : "F",
          email: p.korisnik.email,
          telefon: p.korisnik.brojTelefona ?? "/",
        }));
        setPacijenti(mapirani);
      })
      .catch(() => setPacijenti([]))
      .finally(() => setLoading(false));
  }, []);

  const filtrirani = pacijenti.filter(p =>
    `${p.ime} ${p.prezime}`.toLowerCase().includes(pretraga.toLowerCase()) ||
    p.email.toLowerCase().includes(pretraga.toLowerCase())
  );

  const handleOdaberiPacijenta = (p: Pacijent) => {
    localStorage.setItem("doctorPatient", JSON.stringify({
      ime: p.ime,
      prezime: p.prezime,
      email: p.email,
    }));
    localStorage.setItem("doctorMode", "true");
    onClose();
    navigate("/step1-odjeli");
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Plus size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Nova rezervacija</h2>
              <p className="text-xs text-blue-200">Odaberite pacijenta za kojeg rezervišete</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X size={16} className="text-white" />
          </button>
        </div>

        <div className="p-5">
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={pretraga}
              onChange={e => setPretraga(e.target.value)}
              placeholder="Pretraži pacijenta po imenu ili emailu..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-gray-50"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto space-y-1.5 max-h-72">
            {loading ? (
              <div className="text-center py-10 text-sm text-gray-400">Učitavanje pacijenata...</div>
            ) : filtrirani.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-400">Nije pronađen nijedan pacijent</div>
            ) : filtrirani.map(p => (
              <button
                key={p.id}
                onClick={() => handleOdaberiPacijenta(p)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white transition-all text-left hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-700">
                  {p.ime[0]}{p.prezime[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{p.ime} {p.prezime}</div>
                  <div className="text-xs text-gray-500">{p.email} · {getAge(p.godisteRodjenja)} god.</div>
                </div>
                <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Upit za promjenu dužine termina ────────────────────────────────
function ModalPromjenaDuzine({ termin, onClose, onSubmit }: {
  termin: Termin;
  onClose: () => void;
  onSubmit: (terminId: number, zeljenaDuzina: number, razlog: string) => void;
}) {
  const trenutnaDuzina = termin.vrijemeDo - termin.vrijemeOd;
  const [zeljenaDuzina, setZeljenaDuzina] = useState(trenutnaDuzina);
  const [razlog, setRazlog] = useState("");
  const [poslano, setPoslano] = useState(false);

  const opcijeDuzina = [10, 15, 20, 30, 45, 60];

  const handleSubmit = () => {
    if (!razlog.trim() || zeljenaDuzina === trenutnaDuzina) return;
    onSubmit(termin.id, zeljenaDuzina, razlog.trim());
    setPoslano(true);
    setTimeout(onClose, 2200);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Timer size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Upit za promjenu dužine</h2>
              <p className="text-xs text-orange-100">Zahtjev šalje administrator na odobrenje</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X size={16} className="text-white" />
          </button>
        </div>

        <div className="p-5">
          {poslano ? (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                <CheckCircle size={32} className="text-orange-500" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Upit uspješno poslan!</h3>
              <p className="text-sm text-gray-500">Administrator će pregledati vaš zahtjev i obavijestiti vas o odluci.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="bg-orange-50 rounded-xl border border-orange-100 p-3">
                <div className="text-xs text-orange-600 font-semibold mb-1">Termin</div>
                <div className="text-sm font-bold text-gray-900">{termin.pacijent.ime} {termin.pacijent.prezime}</div>
                <div className="text-xs text-gray-500">{termin.datum} · {formatV(termin.vrijemeOd)} – {formatV(termin.vrijemeDo)}</div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">Trenutna dužina:</span>
                  <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">{trenutnaDuzina} min</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-2 block">Željena dužina termina (min)</label>
                <div className="grid grid-cols-3 gap-2">
                  {opcijeDuzina.map(d => (
                    <button
                      key={d}
                      onClick={() => setZeljenaDuzina(d)}
                      disabled={d === trenutnaDuzina}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        d === zeljenaDuzina
                          ? "bg-orange-500 text-white border-orange-500"
                          : d === trenutnaDuzina
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                      }`}
                    >
                      {d} min
                      {d === trenutnaDuzina && <span className="block text-xs font-normal">(trenutno)</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-2 block">Razlog promjene <span className="text-red-500">*</span></label>
                <textarea
                  value={razlog}
                  onChange={e => setRazlog(e.target.value)}
                  placeholder="Npr. Kompleksni pacijent, zahtijeva detaljniji pregled..."
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none outline-none focus:border-orange-400 bg-gray-50"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">Obavezno polje</span>
                  <span className={`text-xs ${razlog.length > 200 ? "text-red-500" : "text-gray-400"}`}>{razlog.length}/255</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!razlog.trim() || zeljenaDuzina === trenutnaDuzina}
                className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                  razlog.trim() && zeljenaDuzina !== trenutnaDuzina
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Send size={14} /> Pošalji upit administratoru
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Potvrda otkazivanja ────────────────────────────────────────────
function ModalOtkaziTermin({ termin, onClose, onConfirm }: {
  termin: Termin;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const tc = tipConfig[termin.tip];
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-5 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <XCircle size={28} className="text-red-500" />
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-1">Otkazivanje termina</h2>
          <p className="text-sm text-gray-500 mb-4">Da li ste sigurni da želite otkazati ovaj termin?</p>

          <div className={`w-full rounded-xl p-3 mb-5 border ${tc.border} ${tc.bg}`}>
            <div className="text-sm font-bold text-gray-900">{termin.pacijent.ime} {termin.pacijent.prezime}</div>
            <div className="text-xs text-gray-500 mt-0.5">{termin.datum} · {formatV(termin.vrijemeOd)} – {formatV(termin.vrijemeDo)}</div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1.5 inline-block ${tc.badge}`}>{tc.label}</span>
          </div>

          <p className="text-xs text-gray-400 mb-5">Pacijent će biti automatski obaviješten putem emaila.</p>

          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Odustani
            </button>
            <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">
              Da, otkaži termin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
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

// ─── Termin red ────────────────────────────────────────────────────────────
function TerminRed({ termin, onClick, selected }: { termin: Termin; onClick: () => void; selected: boolean }) {
  const tc = tipConfig[termin.tip];
  const sc = statusConfig[termin.status];
  return (
    <div onClick={onClick} className={`${tc.row} rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-sm ${selected ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="text-center min-w-[52px]">
          <div className="text-sm font-bold text-gray-900">{formatV(termin.vrijemeOd)}</div>
          <div className="text-xs text-gray-400">{formatV(termin.vrijemeDo)}</div>
        </div>
        <div className="w-px h-8 bg-gray-200 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-gray-900 truncate">{termin.pacijent.ime} {termin.pacijent.prezime}</span>
            {termin.tip === "hitni" && (
              <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded animate-pulse">
                <AlertTriangle size={10} /> HITNO
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tc.badge}`}>{tc.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span>
          </div>
        </div>
        <div className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
          <Clock size={11} />{tipConfig[termin.tip].trajanje} min
        </div>
      </div>
    </div>
  );
}

// ─── Detalji panel ─────────────────────────────────────────────────────────
function TerminDetalji({ termin, onClose, onAddKomentar, onPromjenaDuzine, onOtkaziTermin }: {
  termin: Termin;
  onClose: () => void;
  onAddKomentar: (terminId: number, tekst: string) => void;
  onPromjenaDuzine: (termin: Termin) => void;
  onOtkaziTermin: (termin: Termin) => void;
}) {
  const [tab, setTab] = useState<"info" | "komentari" | "nalazi" | "historija">("info");
  const [noviKomentar, setNoviKomentar] = useState("");
  const tc = tipConfig[termin.tip];
  const sc = statusConfig[termin.status];

  const handleSend = () => {
    if (!noviKomentar.trim()) return;
    onAddKomentar(termin.id, noviKomentar.trim());
    setNoviKomentar("");
  };

  const tabs = [
    { id: "info" as const, label: "Podaci", icon: User },
    { id: "komentari" as const, label: "Komentari", icon: MessageSquare },
    { id: "nalazi" as const, label: "Nalazi", icon: FileText },
    { id: "historija" as const, label: "Historija", icon: History },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
      <div className={`p-4 ${tc.bg} border-b ${tc.border}`}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-gray-900">{termin.pacijent.ime} {termin.pacijent.prezime}</span>
              {termin.tip === "hitni" && (
                <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full animate-pulse">
                  <AlertTriangle size={11} /> HITNO
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={13} /><span>{formatV(termin.vrijemeOd)} – {formatV(termin.vrijemeDo)}</span><span>·</span><span>{termin.datum}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/60 rounded-lg transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${tc.badge}`}>{tc.label}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.cls}`}>{sc.label}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{tc.trajanje} min</span>
          {termin.status === "zakazan" && (
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => onPromjenaDuzine(termin)}
                className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 font-semibold transition-colors border border-orange-200"
              >
                <Timer size={10} /> Promijeni dužinu
              </button>
              <button
                onClick={() => onOtkaziTermin(termin)}
                className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200 font-semibold transition-colors border border-red-200"
              >
                <XCircle size={10} /> Otkaži termin
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex border-b border-gray-100">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${tab === t.id ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "info" && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Ime i prezime", value: `${termin.pacijent.ime} ${termin.pacijent.prezime}` },
              { label: "Godište", value: termin.pacijent.godisteRodjenja.toString() },
              { label: "Dob", value: `${getAge(termin.pacijent.godisteRodjenja)} god.` },
              { label: "Pol", value: termin.pacijent.pol === "M" ? "Muški" : "Ženski" },
              { label: "Email", value: termin.pacijent.email },
              { label: "Telefon", value: termin.pacijent.telefon },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-0.5">{item.label}</div>
                <div className="text-sm font-semibold text-gray-800">{item.value}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "komentari" && (
          <div className="flex flex-col gap-3">
            {termin.komentari.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Nema komentara za ovaj termin</p>
              </div>
            ) : (
              termin.komentari.map(k => (
                <div key={k.id} className={`rounded-lg p-3 ${k.jeDoktor ? "bg-blue-50 border border-blue-100" : "bg-gray-50 border border-gray-100"}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-semibold ${k.jeDoktor ? "text-blue-700" : "text-gray-700"}`}>{k.jeDoktor ? "🩺 " : "👤 "}{k.autor}</span>
                    <span className="text-xs text-gray-400">{k.datum}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{k.tekst}</p>
                </div>
              ))
            )}
            <div className="border-t border-gray-100 pt-3 mt-1">
              <p className="text-xs text-gray-500 mb-2 font-medium">Dodaj komentar</p>
              <textarea value={noviKomentar} onChange={e => setNoviKomentar(e.target.value)} placeholder="Unesite komentar..." rows={3} className="w-full text-sm border border-gray-200 rounded-lg p-2.5 resize-none outline-none focus:border-blue-400 bg-gray-50" />
              <button onClick={handleSend} disabled={!noviKomentar.trim()} className={`mt-2 w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${noviKomentar.trim() ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                <Send size={14} /> Pošalji
              </button>
            </div>
          </div>
        )}

        {tab === "nalazi" && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-3">Svi nalazi — {termin.pacijent.ime} {termin.pacijent.prezime}</p>
            {termin.nalazi.length === 0 ? (
              <div className="text-center py-10">
                <FileText size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Nema uploadovanih nalaza</p>
              </div>
            ) : (
              termin.nalazi.map(n => (
                <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <FileText size={15} className="text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{n.naziv}</div>
                    <div className="text-xs text-gray-400">{n.datum}</div>
                  </div>
                  <ExternalLink size={14} className="text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                </a>
              ))
            )}
          </div>
        )}

        {tab === "historija" && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-3">Historija dolazaka — {termin.pacijent.ime} {termin.pacijent.prezime}</p>
            {termin.komentari.length === 0 ? (
              <div className="text-center py-10">
                <History size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Nema prethodnih posjeta</p>
              </div>
            ) : (
              <div className="text-center py-10">
                <History size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Historija će biti dostupna kada se implementira HistorijaPregleda endpoint</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Glavni komponent ────────────────────────────────────────────────────────
export default function DoktorRezervacije() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [prikaz, setPrikaz] = useState<"dnevni" | "sedmicni" | "mjesecni">("dnevni");
  const [selectedDatum, setSelectedDatum] = useState(new Date().toISOString().split("T")[0]);
  const [selectedTermin, setSelectedTermin] = useState<Termin | null>(null);
  const [listaTermina, setListaTermina] = useState<Termin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNovaRezervacija, setShowNovaRezervacija] = useState(false);
  const [terminZaDuzinu, setTerminZaDuzinu] = useState<Termin | null>(null);
  const [terminZaOtkazivanje, setTerminZaOtkazivanje] = useState<Termin | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  // ─── NOVO: filter za prikaz otkazanih termina ──────────────────────────
  const [prikaziOtkazane, setPrikaziOtkazane] = useState(false);

  //const doktorId = localStorage.getItem("doktorId") ?? "2";
const doktorId = "2"; // tvoj stvarni ID iz baze
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    setLoading(true);
    fetch(`${apiUrl}/api/rezervacije/doktor/${doktorId}`)
      .then(res => res.json())
      .then(data => setListaTermina(data.map(mapiriRezervaciju)))
      .catch(() => setListaTermina([]))
      .finally(() => setLoading(false));
  }, [doktorId]);

  // ─── NOVO: helper koji filtrira termine po aktivnom modu ───────────────
  const filterTermini = (termini: Termin[]) =>
    termini.filter(t => prikaziOtkazane ? t.status === "otkazan" : t.status !== "otkazan");

  const dnevniTermini = filterTermini(
    listaTermina
      .filter(t => t.datum === selectedDatum)
      .sort((a, b) => a.vrijemeOd - b.vrijemeOd)
  );

  const getWeekDays = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(monday);
      dd.setDate(monday.getDate() + i);
      return dd.toISOString().split("T")[0];
    });
  };

  const getMonthDays = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const days: (string | null)[] = Array(offset).fill(null);
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`);
    }
    return days;
  };

  const weekDays = getWeekDays(selectedDatum);
  const dayNames = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

  const goDay = (delta: number) => {
    const [y, m, d] = selectedDatum.split("-").map(Number);
    let newDate: Date;
    if (prikaz === "mjesecni") {
      newDate = new Date(y, m - 1 + delta, 1);
    } else {
      newDate = new Date(y, m - 1, d + delta);
    }
    const pad = (n: number) => String(n).padStart(2, "0");
    const newStr = `${newDate.getFullYear()}-${pad(newDate.getMonth() + 1)}-${pad(newDate.getDate())}`;
    setSelectedDatum(newStr);
    setSelectedTermin(null);
  };

  const formatDatum = (ds: string) =>
    new Date(ds + "T00:00:00").toLocaleDateString("bs-BA", { weekday: "long", day: "numeric", month: "long" });

  const handleAddKomentar = async (terminId: number, tekst: string) => {
    try {
      await fetch(`${apiUrl}/api/rezervacije/${terminId}/komentar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ komentar: tekst }),
      });

      const noviK: Komentar = {
        id: Date.now(),
        tekst,
        autor: "Dr.",
        datum: new Date().toISOString().split("T")[0],
        jeDoktor: true,
      };
      setListaTermina(prev =>
        prev.map(t => t.id !== terminId ? t : { ...t, komentari: [...t.komentari, noviK] })
      );
      setSelectedTermin(prev =>
        prev && prev.id === terminId ? { ...prev, komentari: [...prev.komentari, noviK] } : prev
      );
    } catch {
      showToast("❌ Greška pri slanju komentara.");
    }
  };

  const handlePromjenaDuzine = (_terminId: number, _zeljenaDuzina: number, _razlog: string) => {
    showToast("✓ Vaš upit je uspješno poslan administratoru.");
  };

  const handleOtkaziTermin = async (termin: Termin) => {
    try {
      const res = await fetch(`${apiUrl}/api/rezervacije/${termin.id}/otkazi/osoblje`, {
        method: "PATCH",
      });

      if (!res.ok) throw new Error();

      setListaTermina(prev =>
        prev.map(t => t.id !== termin.id ? t : { ...t, status: "otkazan" as StatusTermina })
      );
      setSelectedTermin(prev =>
        prev?.id === termin.id ? { ...prev, status: "otkazan" as StatusTermina } : prev
      );
      setTerminZaOtkazivanje(null);
      showToast(`✓ Termin za ${termin.pacijent.ime} ${termin.pacijent.prezime} je otkazan.`);
    } catch {
      showToast("❌ Greška pri otkazivanju termina.");
    }
  };

  const navLabel = () => {
    if (prikaz === "dnevni") return formatDatum(selectedDatum);
    if (prikaz === "sedmicni") return `Sedmica: ${weekDays[0]} – ${weekDays[6]}`;
    return new Date(selectedDatum + "T00:00:00").toLocaleDateString("bs-BA", { month: "long", year: "numeric" });
  };

  const navDelta = prikaz === "dnevni" ? 1 : prikaz === "sedmicni" ? 7 : 1;

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {toastMsg && (
        <div className="fixed top-5 right-5 z-[100] bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
          {toastMsg}
        </div>
      )}

      {showNovaRezervacija && (
        <ModalNovaRezervacija onClose={() => setShowNovaRezervacija(false)} />
      )}
      {terminZaDuzinu && (
        <ModalPromjenaDuzine
          termin={terminZaDuzinu}
          onClose={() => setTerminZaDuzinu(null)}
          onSubmit={handlePromjenaDuzine}
        />
      )}
      {terminZaOtkazivanje && (
        <ModalOtkaziTermin
          termin={terminZaOtkazivanje}
          onClose={() => setTerminZaOtkazivanje(null)}
          onConfirm={() => handleOtkaziTermin(terminZaOtkazivanje)}
        />
      )}

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "ml-60" : "ml-0"}`}>
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
                <Menu size={18} className="text-gray-600" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900">Moje rezervacije</h1>
              <p className="text-xs text-gray-500">Dr. Kardiologija</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNovaRezervacija(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={15} /> Nova rezervacija
            </button>

            {/* ─── NOVO: Toggle zakazani / otkazani ─────────────────────── */}
            <button
              onClick={() => { setPrikaziOtkazane(p => !p); setSelectedTermin(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                prikaziOtkazane
                  ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <XCircle size={15} />
              {prikaziOtkazane ? "Otkazani termini" : "Zakazani termini"}
            </button>

            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {(["dnevni", "sedmicni", "mjesecni"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => { setPrikaz(p); setSelectedTermin(null); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${prikaz === p ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
                >
                  {p === "dnevni" ? "Dnevni" : p === "sedmicni" ? "Sedmični" : "Mjesečni"}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="flex-1 p-5">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-sm text-gray-400">Učitavanje termina...</div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => goDay(-navDelta)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100">
                  <ChevronLeft size={16} className="text-gray-600" />
                </button>
                <span className="text-sm font-semibold text-gray-700 capitalize">{navLabel()}</span>
                <button onClick={() => goDay(navDelta)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100">
                  <ChevronRight size={16} className="text-gray-600" />
                </button>
                <div className="ml-auto flex items-center gap-3">
                  {Object.entries(tipConfig).map(([tip, cfg]) => (
                    <div key={tip} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className="text-xs text-gray-500">{cfg.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {prikaz === "dnevni" && (
                <div className={`grid gap-5 ${selectedTermin ? "grid-cols-5" : "grid-cols-1 max-w-2xl"}`}>
                  <div className={selectedTermin ? "col-span-2" : "col-span-1"}>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">
                          {dnevniTermini.length} {prikaziOtkazane ? "otkazan" : "zakazan"}{dnevniTermini.length !== 1 ? "ih" : ""} termin{dnevniTermini.length !== 1 ? "a" : ""}
                        </span>
                        <div className="flex gap-1.5">
                          {Object.entries(tipConfig).map(([tip, cfg]) => {
                            const count = dnevniTermini.filter(t => t.tip === tip as TipPregleda).length;
                            if (!count) return null;
                            return <span key={tip} className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>{count} {cfg.label.toLowerCase()}</span>;
                          })}
                        </div>
                      </div>
                      <div className="p-3 space-y-2">
                        {dnevniTermini.length === 0 ? (
                          <div className="text-center py-12">
                            <Calendar size={32} className="text-gray-200 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">
                              {prikaziOtkazane ? "Nema otkazanih termina za ovaj dan" : "Nema termina za ovaj dan"}
                            </p>
                          </div>
                        ) : (
                          dnevniTermini.map(t => (
                            <TerminRed key={t.id} termin={t} onClick={() => setSelectedTermin(prev => prev?.id === t.id ? null : t)} selected={selectedTermin?.id === t.id} />
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedTermin && (
                    <div className="col-span-3">
                      <TerminDetalji
                        termin={selectedTermin}
                        onClose={() => setSelectedTermin(null)}
                        onAddKomentar={handleAddKomentar}
                        onPromjenaDuzine={(t) => setTerminZaDuzinu(t)}
                        onOtkaziTermin={(t) => setTerminZaOtkazivanje(t)}
                      />
                    </div>
                  )}
                </div>
              )}

              {prikaz === "sedmicni" && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-7 border-b border-gray-100">
                    {weekDays.map((ds, i) => {
                      const count = filterTermini(listaTermina.filter(t => t.datum === ds)).length;
                      const isToday = ds === new Date().toISOString().split("T")[0];
                      return (
                        <button key={ds} onClick={() => { setSelectedDatum(ds); setPrikaz("dnevni"); }} className={`p-3 text-center transition-colors hover:bg-blue-50 ${isToday ? "bg-blue-50" : ""}`}>
                          <div className="text-xs text-gray-400 mb-1">{dayNames[i]}</div>
                          <div className={`text-sm font-bold ${isToday ? "text-blue-600" : "text-gray-800"}`}>{new Date(ds + "T00:00:00").getDate()}</div>
                          {count > 0 && (
                            <div className="mt-1 flex justify-center gap-0.5 flex-wrap">
                              {filterTermini(listaTermina.filter(t => t.datum === ds)).map(t => (
                                <div key={t.id} className={`w-1.5 h-1.5 rounded-full ${tipConfig[t.tip].dot}`} />
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-7 divide-x divide-gray-100 min-h-64">
                    {weekDays.map(ds => {
                      const dayTermini = filterTermini(
                        listaTermina.filter(t => t.datum === ds).sort((a, b) => a.vrijemeOd - b.vrijemeOd)
                      );
                      return (
                        <div key={ds} className="p-2 space-y-1.5">
                          {dayTermini.map(t => {
                            const tc = tipConfig[t.tip];
                            return (
                              <div key={t.id} onClick={() => { setSelectedDatum(ds); setPrikaz("dnevni"); setSelectedTermin(t); }} className={`rounded p-1.5 cursor-pointer hover:shadow-sm transition-all ${tc.bg} border ${tc.border}`}>
                                <div className="text-xs font-bold text-gray-800">{formatV(t.vrijemeOd)}</div>
                                <div className="text-xs text-gray-600 truncate">{t.pacijent.ime} {t.pacijent.prezime[0]}.</div>
                                {t.tip === "hitni" && <div className="text-xs font-bold text-red-600">⚡ HITNO</div>}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {prikaz === "mjesecni" && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700 capitalize">
                      {new Date(selectedDatum + "T00:00:00").toLocaleDateString("bs-BA", { month: "long", year: "numeric" })}
                    </span>
                    <span className="text-xs text-gray-400">
                      {filterTermini(listaTermina.filter(t => t.datum.startsWith(selectedDatum.slice(0, 7)))).length} {prikaziOtkazane ? "otkazanih" : "zakazanih"} termina u ovom mjesecu
                    </span>
                  </div>
                  <div className="grid grid-cols-7 border-b border-gray-100">
                    {["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"].map(d => (
                      <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
                    {getMonthDays(selectedDatum).map((ds, idx) => {
                      const dayTermini = ds
                        ? filterTermini(listaTermina.filter(t => t.datum === ds).sort((a, b) => a.vrijemeOd - b.vrijemeOd))
                        : [];
                      const isToday = ds === new Date().toISOString().split("T")[0];
                      const isSelected = ds === selectedDatum;
                      return (
                        <div
                          key={idx}
                          onClick={() => { if (ds) { setSelectedDatum(ds); setPrikaz("dnevni"); } }}
                          className={`min-h-[90px] p-2 transition-colors ${ds ? "cursor-pointer hover:bg-blue-50" : "bg-gray-50 cursor-default"} ${isSelected ? "bg-blue-50" : ""}`}
                        >
                          {ds && (
                            <>
                              <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-blue-600 text-white" : "text-gray-700"}`}>
                                {new Date(ds + "T00:00:00").getDate()}
                              </div>
                              <div className="space-y-0.5">
                                {dayTermini.slice(0, 3).map(t => {
                                  const tc = tipConfig[t.tip];
                                  return (
                                    <div
                                      key={t.id}
                                      onClick={e => { e.stopPropagation(); setSelectedDatum(ds); setPrikaz("dnevni"); setSelectedTermin(t); }}
                                      className={`text-xs rounded px-1 py-0.5 truncate font-medium ${tc.badge} flex items-center gap-1 cursor-pointer`}
                                    >
                                      {t.tip === "hitni" && <span>⚡</span>}
                                      {formatV(t.vrijemeOd)} {t.pacijent.ime[0]}. {t.pacijent.prezime}
                                    </div>
                                  );
                                })}
                                {dayTermini.length > 3 && (
                                  <div className="text-xs text-gray-400 pl-1">+{dayTermini.length - 3} više</div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}