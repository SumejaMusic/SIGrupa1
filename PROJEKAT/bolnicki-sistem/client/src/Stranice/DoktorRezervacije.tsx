import { useState, useEffect } from "react";

import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Menu,
  Send,
  X,
  Plus,
  CheckCircle,
  XCircle,
  Timer,
  Search,
  Stethoscope,
  Pill,
  ChevronDown,
  ChevronUp,
  Star
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { TerminRed } from "../components/TerminRed";
import { TerminDetalji } from "../components/TerminDetalj";
// ESLint upozorenje: 'odjava' je importana ali se nigdje ne koristi u ovoj komponenti — obriši je iz importa ili je pozovi negdje
import { handleExpiredSession, getDoktorId, getDoktorIme, odjava } from "../utils/auth";

import type {
  TipPregleda,
  StatusTermina,
  Komentar,
  Pacijent,
  Termin
} from "../types";

import {
  danasUTC,
  formatV,
  formatDatumPrikaz,
  tipConfig,
  getAge,
  mapirajRezervaciju
} from "../utils/rezervacijeUtils";

const apiUrl = import.meta.env.VITE_API_URL ?? "";

/*type DoctorReviewComment = {
  id: number;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
};*/
type DoctorReviewComment = {
  id: number;
  author: string;
  rating: number;
  comment: string | null;  // ← null za sakrivene
  createdAt: string;
};

type DoctorReviewSummary = {
  averageRating: number | null;
  reviewCount: number;
  comments: DoctorReviewComment[];
};

const ratingColor = (rating: number) => {
  if (rating <= 1) return "text-red-600";
  if (rating === 2) return "text-orange-500";
  if (rating === 3) return "text-yellow-500";
  if (rating === 4) return "text-lime-600";
  return "text-green-600";
};

const ratingBadge = (rating: number) => {
  if (rating <= 1) return "bg-red-50 border-red-200 text-red-700";
  if (rating === 2) return "bg-orange-50 border-orange-200 text-orange-700";
  if (rating === 3) return "bg-yellow-50 border-yellow-200 text-yellow-700";
  if (rating === 4) return "bg-lime-50 border-lime-200 text-lime-700";
  return "bg-green-50 border-green-200 text-green-700";
};

// ─── Modal: Nova rezervacija ───────────────────────────────────────────────
function ModalNovaRezervacija({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [pretraga, setPretraga] = useState("");
  const [pacijenti, setPacijenti] = useState<Pacijent[]>([]);
  const [loading, setLoading] = useState(true);
  const [greska, setGreska] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const ucitajPacijente = async () => {
      setLoading(true);
      setGreska(null);

      const token = localStorage.getItem("token");
      if (!token) {
        handleExpiredSession();
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/api/pacijenti`, {
          headers: { "Authorization": `Bearer ${token}` },
        });

        if (res.status === 401) {
          handleExpiredSession();
          return;
        }

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.poruka ?? "Greška pri učitavanju pacijenata.");
        }

        if (mounted) {
          setPacijenti(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (mounted) {
          setPacijenti([]);
          setGreska(err instanceof Error ? err.message : "Greška pri učitavanju pacijenata.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    ucitajPacijente();

    return () => { mounted = false; };
  }, []);

  const filtrirani = pacijenti.filter(p =>
    `${p.ime} ${p.prezime}`.toLowerCase().includes(pretraga.toLowerCase()) ||
    p.email.toLowerCase().includes(pretraga.toLowerCase())
  );

  const handleOdaberiPacijenta = (p: Pacijent) => {
    localStorage.setItem("doctorPatient", JSON.stringify({ id: p.id, ime: p.ime, prezime: p.prezime, email: p.email }));
    localStorage.setItem("doctorMode", "true");
    onClose();
    navigate("/step1-odjeli");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-blue-700 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Plus size={17} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Nova rezervacija</h2>
              <p className="text-xs text-blue-200 mt-0.5">Odaberite pacijenta za kojeg rezervišete</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X size={16} className="text-white" />
          </button>
        </div>
        <div className="p-5">
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={pretraga}
              onChange={e => setPretraga(e.target.value)}
              placeholder="Pretraži po imenu ili emailu..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 transition-all"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto space-y-1.5 max-h-72">
            {loading ? (
              <div className="text-center py-12 text-sm text-gray-400">Učitavanje pacijenata...</div>
            ) : greska ? (
              <div className="text-center py-12 text-sm text-red-500">{greska}</div>
            ) : filtrirani.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-400">Nije pronađen nijedan pacijent</div>
            ) : filtrirani.map(p => (
              <button
                key={p.id}
                onClick={() => handleOdaberiPacijenta(p)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white transition-all text-left hover:border-blue-300 hover:bg-blue-50 group"
              >
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-700">
                  {p.ime[0]}{p.prezime[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{p.ime} {p.prezime}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{p.email} · {getAge(p.godisteRodjenja)} god.</div>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" />
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-orange-600 flex items-center justify-between bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Timer size={17} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Upit za promjenu dužine</h2>
              <p className="text-xs text-orange-100 mt-0.5">Zahtjev šalje administrator na odobrenje</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X size={16} className="text-white" />
          </button>
        </div>
        <div className="p-5">
          {poslano ? (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                <CheckCircle size={32} className="text-orange-500" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Upit uspješno poslan!</h3>
              <p className="text-sm text-gray-500">Administrator će pregledati vaš zahtjev i obavijestiti vas o odluci.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="bg-orange-50 rounded-xl border border-orange-100 p-3.5">
                <div className="text-xs text-orange-600 font-semibold mb-1.5 uppercase tracking-wide" style={{ fontSize: "10px" }}>Termin</div>
                <div className="text-sm font-bold text-gray-900">{termin.pacijent.ime} {termin.pacijent.prezime}</div>
                <div className="text-xs text-gray-500 mt-0.5">{formatDatumPrikaz(termin.datum)} · {formatV(termin.vrijemeOd)} – {formatV(termin.vrijemeDo)}</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Trenutna dužina:</span>
                  <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">{trenutnaDuzina} min</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block uppercase tracking-wide" style={{ fontSize: "10px" }}>Željena dužina termina</label>
                <div className="grid grid-cols-3 gap-2">
                  {opcijeDuzina.map(d => (
                    <button
                      key={d}
                      onClick={() => setZeljenaDuzina(d)}
                      disabled={d === trenutnaDuzina}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        d === zeljenaDuzina ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                        : d === trenutnaDuzina ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                      }`}
                    >
                      {d} min
                      {d === trenutnaDuzina && <span className="block text-xs font-normal text-gray-400">(trenutno)</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block uppercase tracking-wide" style={{ fontSize: "10px" }}>
                  Razlog promjene <span className="text-red-500 normal-case">*</span>
                </label>
                <textarea
                  value={razlog}
                  onChange={e => setRazlog(e.target.value)}
                  placeholder="Npr. Kompleksni pacijent, zahtijeva detaljniji pregled..."
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-gray-50 transition-all"
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
                    ? "bg-orange-500 text-white hover:bg-orange-600 shadow-sm"
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
function ModalOtkaziTermin({ termin, onClose, onConfirm, onPomjeri }: {
  termin: Termin; 
  onClose: () => void; 
  onConfirm: () => void;
  onPomjeri: () => void;
}) {
  const tc = tipConfig[termin.tip];
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-7 pb-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <XCircle size={28} className="text-red-500" />
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-1">Otkazivanje termina</h2>
          <p className="text-sm text-gray-500 mb-4">Šta želite učiniti s ovim terminom?</p>
          <div className={`w-full rounded-xl p-3.5 mb-4 border ${tc.border} ${tc.bg}`}>
            <div className="text-sm font-bold text-gray-900">{termin.pacijent.ime} {termin.pacijent.prezime}</div>
            <div className="text-xs text-gray-500 mt-0.5">{formatDatumPrikaz(termin.datum)} · {formatV(termin.vrijemeOd)} – {formatV(termin.vrijemeDo)}</div>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <button 
              onClick={onPomjeri}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Calendar size={15} /> Pomjeri na drugi termin
            </button>
            <button 
              onClick={onConfirm}
              className="w-full py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm"
            >
              Otkaži bez pomjeranja
            </button>
            <button 
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Odustani
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
            <span>📧</span> Pacijent će biti obaviješten emailom u oba slučaja.
          </p>
        </div>
      </div>
    </div>
  );
}

function ModalPomjeriTermin({ termin, onClose, onConfirm }: {
  termin: Termin;
  onClose: () => void;
  onConfirm: (noviTerminId: number) => void;
}) {
  // ESLint greška: 'any[]' nije dozvoljen — ESLint traži konkretan tip umjesto generičkog any (npr. definiraj interfejs za slobodni termin sa API-ja)
  const [termini, setTermini] = useState<any[]>([]);
  const [selectedTerminId, setSelectedTerminId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // ESLint upozorenje: 'termin.doktorId' se koristi unutar effecta ali nije naveden u dependency arrayu — effect se neće ponovo pokrenuti ako se doktorId promijeni
  useEffect(() => {
    const sada = new Date();
    fetch(`${apiUrl}/api/termini?doktorId=${termin.doktorId ?? ""}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const slobodni = data.filter(t => {
            if (t.status !== "SLOBODAN") return false;
            const vrijemeTermina = new Date(Date.UTC(
              new Date(t.datum).getUTCFullYear(),
              new Date(t.datum).getUTCMonth(),
              new Date(t.datum).getUTCDate(),
              Math.floor(t.vrijeme / 60),
              t.vrijeme % 60
            ));
            return vrijemeTermina.getTime() > sada.getTime();
          });
          setTermini(slobodni);
        }
      })
      .catch(() => setTermini([])  )
      .finally(() => setLoading(false));
  }, []);

  const formatirajDatum = (datum: string) => {
    const d = new Date(datum.includes("T") ? datum : datum + "T12:00:00Z");
    const dani = ["ned", "pon", "uto", "sri", "čet", "pet", "sub"];
    const mjeseci = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
    return `${dani[d.getUTCDay()]}, ${d.getUTCDate()}. ${mjeseci[d.getUTCMonth()]}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-blue-700 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Calendar size={17} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Pomjeri termin</h2>
              <p className="text-xs text-blue-200">{termin.pacijent.ime} {termin.pacijent.prezime}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X size={16} className="text-white" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="text-center py-10 text-sm text-gray-400">Učitavanje slobodnih termina...</div>
          ) : termini.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-400">Nema slobodnih termina.</div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-3">Odaberite novi termin:</p>
              {termini.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTerminId(t.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                    selectedTerminId === t.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-sm font-semibold text-gray-800">{formatirajDatum(t.datum)}</span>
                  <span className="text-sm font-bold text-blue-600 tabular-nums">
                    {String(Math.floor(t.vrijeme / 60)).padStart(2, "0")}:{String(t.vrijeme % 60).padStart(2, "0")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 pb-4 pt-3 flex gap-3 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Odustani
          </button>
          <button
            onClick={() => selectedTerminId && onConfirm(selectedTerminId)}
            disabled={!selectedTerminId}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              selectedTerminId
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Potvrdi pomjeranje
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Modal: Završi pregled ─────────────────────────────────────────────────
function ModalZavrsiPregled({ termin, onClose, onSuccess }: {
  termin: Termin;
  onClose: () => void;
  onSuccess: (rezervacijaId: number) => void;
}) {
  const [dijagnoza, setDijagnoza] = useState("");
  const [terapija, setTerapija] = useState("");
  const [biljeske, setBiljeske] = useState("");
  const [dodajRecept, setDodajRecept] = useState(false);
  const [nazivLijeka, setNazivLijeka] = useState("");
  const [doza, setDoza] = useState("");
  const [trajanje, setTrajanje] = useState("");
  const [napomena, setNapomena] = useState("");
  const [loading, setLoading] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [uspjesno, setUspjesno] = useState(false);

  const receptValidan = !dodajRecept || (nazivLijeka.trim() && doza.trim() && trajanje.trim() && Number(trajanje) > 0);
  const formaValidna = dijagnoza.trim() && terapija.trim() && receptValidan;

  const handleSubmit = async () => {
    if (!formaValidna) return;
    setLoading(true);
    setGreska(null);

    // ESLint greška: 'any' nije dozvoljen — definiši konkretan tip za body umjesto any (npr. interfejs sa dijagnoza, terapija, biljeske, recept)
    const body: any = {
      dijagnoza: dijagnoza.trim(),
      terapija: terapija.trim(),
      biljeske: biljeske.trim() || undefined,
    };

    if (dodajRecept && nazivLijeka.trim() && doza.trim() && trajanje.trim()) {
      body.recept = {
        nazivLijeka: nazivLijeka.trim(),
        doza: doza.trim(),
        trajanje: Number(trajanje),
        napomena: napomena.trim() || undefined,
      };
    }

    try {
      const res = await fetch(`${apiUrl}/api/pregledi/${termin.id}/zavrsi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setGreska(data.poruka ?? "Greška pri završavanju pregleda.");
        return;
      }

      setUspjesno(true);
      setTimeout(() => {
        onSuccess(termin.id);
        onClose();
      }, 1800);
    } catch {
      setGreska("Greška pri slanju zahtjeva.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-green-700 flex items-center justify-between bg-gradient-to-r from-green-600 to-green-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Stethoscope size={17} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Završi pregled</h2>
              <p className="text-xs text-green-100 mt-0.5">
                {termin.pacijent.ime} {termin.pacijent.prezime} · {formatDatumPrikaz(termin.datum)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X size={16} className="text-white" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {uspjesno ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Pregled uspješno završen!</h3>
              <p className="text-sm text-gray-500">Podaci su sačuvani.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {greska && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                  <XCircle size={15} className="flex-shrink-0" />
                  {greska}
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide" style={{ fontSize: "10px" }}>
                  Dijagnoza <span className="text-red-500 normal-case">*</span>
                </label>
                <textarea
                  value={dijagnoza}
                  onChange={e => setDijagnoza(e.target.value)}
                  placeholder="Unesite dijagnozu..."
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-gray-50 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide" style={{ fontSize: "10px" }}>
                  Terapija <span className="text-red-500 normal-case">*</span>
                </label>
                <textarea
                  value={terapija}
                  onChange={e => setTerapija(e.target.value)}
                  placeholder="Unesite preporučenu terapiju..."
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-gray-50 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide" style={{ fontSize: "10px" }}>
                  Bilješke <span className="text-gray-400 font-normal normal-case">(opcionalno)</span>
                </label>
                <textarea
                  value={biljeske}
                  onChange={e => setBiljeske(e.target.value)}
                  placeholder="Dodatne napomene..."
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-gray-50 transition-all"
                />
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setDodajRecept(p => !p)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors ${
                    dodajRecept ? "bg-green-50 text-green-700 border-b border-green-100" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Pill size={15} />
                    Dodaj recept
                    {dodajRecept && (
                      <span className="text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full font-semibold">uključeno</span>
                    )}
                  </div>
                  {dodajRecept ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                {dodajRecept && (
                  <div className="p-4 space-y-3 bg-white">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide" style={{ fontSize: "10px" }}>
                          Naziv lijeka <span className="text-red-500 normal-case">*</span>
                        </label>
                        <input
                          value={nazivLijeka}
                          onChange={e => setNazivLijeka(e.target.value)}
                          placeholder="Npr. Brufen 400mg"
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-gray-50 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide" style={{ fontSize: "10px" }}>
                          Doza <span className="text-red-500 normal-case">*</span>
                        </label>
                        <input
                          value={doza}
                          onChange={e => setDoza(e.target.value)}
                          placeholder="Npr. 1×1 tableta"
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-gray-50 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide" style={{ fontSize: "10px" }}>
                          Trajanje (dana) <span className="text-red-500 normal-case">*</span>
                        </label>
                        <input
                          value={trajanje}
                          onChange={e => setTrajanje(e.target.value.replace(/\D/g, ""))}
                          placeholder="Npr. 7"
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-gray-50 transition-all"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide" style={{ fontSize: "10px" }}>
                          Napomena <span className="text-gray-400 font-normal normal-case">(opcionalno)</span>
                        </label>
                        <input
                          value={napomena}
                          onChange={e => setNapomena(e.target.value)}
                          placeholder="Npr. Uzimati uz obrok"
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-gray-50 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {!uspjesno && (
          <div className="px-5 pb-5 pt-3 flex gap-3 flex-shrink-0 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-white transition-colors disabled:opacity-50"
            >
              Odustani
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formaValidna || loading}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                formaValidna && !loading
                  ? "bg-green-600 text-white hover:bg-green-700 shadow-sm"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {loading ? <span>Čuvanje...</span> : <><CheckCircle size={15} /> Završi pregled</>}
            </button>
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
  const [selectedDatum, setSelectedDatum] = useState(danasUTC());
  const [selectedTermin, setSelectedTermin] = useState<Termin | null>(null);
  const [listaTermina, setListaTermina] = useState<Termin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNovaRezervacija, setShowNovaRezervacija] = useState(false);
  const [terminZaDuzinu, setTerminZaDuzinu] = useState<Termin | null>(null);
  const [terminZaOtkazivanje, setTerminZaOtkazivanje] = useState<Termin | null>(null);
  const [terminZaZavrsavanje, setTerminZaZavrsavanje] = useState<Termin | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [doktorIme, setDoktorIme] = useState("Dr.");
  const [terminZaPomjeranje, setTerminZaPomjeranje] = useState<Termin | null>(null);
  const [reviewSummary, setReviewSummary] = useState<DoctorReviewSummary>({
    averageRating: null,
    reviewCount: 0,
    comments: [],
  });

  const handlePomjeriTermin = async (stariTermin: Termin, noviTerminId: number) => {
  try {
    const resLock = await fetch(`${apiUrl}/api/termini/${noviTerminId}/zakljucaj`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    });
    if (!resLock.ok) {
      showToast("❌ Odabrani termin je u međuvremenu zauzet.");
      return;
    }

    const res = await fetch(`${apiUrl}/api/rezervacije/doktor/pomjeri`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        idStareRezervacije: stariTermin.id,
        idNovogTermina: noviTerminId,
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(`❌ ${err.poruka ?? "Greška pri pomjeranju."}`);
      return;
    }

    if (doktorId) {
      const resRezervacije = await fetch(`${apiUrl}/api/rezervacije/doktor/${doktorId}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (resRezervacije.ok) {
        const data = await resRezervacije.json();
        const novaLista = Array.isArray(data) ? data.map(mapirajRezervaciju) : [];
        setListaTermina(novaLista);
        const noviTermin = novaLista.find(t =>
          t.pacijent.id === stariTermin.pacijent.id && t.status === "zakazan"
        );
        if (noviTermin) setSelectedDatum(noviTermin.datum);
      }
    }

    setTerminZaPomjeranje(null);
    setTerminZaOtkazivanje(null);
    setSelectedTermin(null);
    showToast("Termin uspješno pomjeren. Pacijent je obaviješten emailom.");
  } catch (err) {
    console.error("Greška:", err);
    showToast("Greška pri pomjeranju termina.");
  }
};

  useEffect(() => {
    setDoktorIme(getDoktorIme());
  }, []);

  const [filterStatus, setFilterStatus] = useState<"zakazani" | "zavrseni" | "otkazani">("zakazani");

  const doktorId = getDoktorId();

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    if (!doktorId) return;
    setLoading(true);
    fetch(`${apiUrl}/api/rezervacije/doktor/${doktorId}`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => {
        if (res.status === 401) { handleExpiredSession(); return null; }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        setListaTermina(Array.isArray(data) ? data.map(mapirajRezervaciju) : []);
      })
      .catch(() => setListaTermina([]))
      .finally(() => setLoading(false));
  }, [doktorId]);

  useEffect(() => {
    if (!doktorId) return;

    fetch(`${apiUrl}/api/doktori/${doktorId}/reviews`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => {
        if (res.status === 401) { handleExpiredSession(); return null; }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        setReviewSummary({
          averageRating: typeof data.averageRating === "number" ? data.averageRating : null,
          reviewCount: Number(data.reviewCount ?? 0),
          comments: Array.isArray(data.comments) ? data.comments : [],
        });
      })
      .catch(() => setReviewSummary({ averageRating: null, reviewCount: 0, comments: [] }));
  }, [doktorId]);

  const filterTermini = (termini: Termin[]) => {
    if (filterStatus === "otkazani") return termini.filter(t => t.status === "otkazan");
    if (filterStatus === "zavrseni") return termini.filter(t => t.status === "zavrsen");
    return termini.filter(t => t.status === "zakazan");
  };

  const dnevniTermini = filterTermini(
    listaTermina.filter(t => t.datum === selectedDatum).sort((a, b) => a.vrijemeOd - b.vrijemeOd)
  );

  const getWeekDays = (dateStr: string): string[] => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const temp = new Date(Date.UTC(y, m - 1, d));
    const dow = temp.getUTCDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(Date.UTC(y, m - 1, d + diff + i));
      return `${dd.getUTCFullYear()}-${String(dd.getUTCMonth() + 1).padStart(2, "0")}-${String(dd.getUTCDate()).padStart(2, "0")}`;
    });
  };

  const getMonthDays = (dateStr: string) => {
    const [y, m] = dateStr.split("-").map(Number);
    const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const offset = firstDow === 0 ? 6 : firstDow - 1;
    const days: (string | null)[] = Array(offset).fill(null);
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(`${y}-${String(m).padStart(2, "0")}-${String(i).padStart(2, "0")}`);
    }
    return days;
  };

  const weekDays = getWeekDays(selectedDatum);
  const dayNames = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

  const goDay = (delta: number) => {
    const [y, m, d] = selectedDatum.split("-").map(Number);
    let newDate: Date;
    if (prikaz === "mjesecni") {
      newDate = new Date(Date.UTC(y, m - 1 + delta, 1));
    } else {
      newDate = new Date(Date.UTC(y, m - 1, d + delta));
    }
    const pad = (n: number) => String(n).padStart(2, "0");
    setSelectedDatum(`${newDate.getUTCFullYear()}-${pad(newDate.getUTCMonth() + 1)}-${pad(newDate.getUTCDate())}`);
    setSelectedTermin(null);
  };

  const formatDatum = (ds: string) => {
  const d = new Date(ds + "T12:00:00Z");
  const dani = ["nedjelja", "ponedjeljak", "utorak", "srijeda", "četvrtak", "petak", "subota"];
  const mjeseci = ["januar", "februar", "mart", "april", "maj", "juni", "juli", "august", "septembar", "oktobar", "novembar", "decembar"];
  return `${dani[d.getUTCDay()]}, ${d.getUTCDate()}. ${mjeseci[d.getUTCMonth()]}`;
};

  const handleAddKomentar = async (terminId: number, tekst: string) => {
  try {
    const res = await fetch(`${apiUrl}/api/doktori/rezervacije/${terminId}/komentar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ komentar: tekst }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast(`❌ ${data.poruka ?? "Greška pri slanju komentara."}`);
      return;
    }
    const data = await res.json();
    const noviK: Komentar = {
      id: data.id ?? Date.now(),
      tekst: data.tekst ?? tekst,
      autor: data.autor ?? "Doktor",
      datum: data.datum ?? danasUTC(),
      jeDoktor: data.jeDoktor ?? true,
    };
    setListaTermina(prev => prev.map(t => t.id !== terminId ? t : { ...t, komentari: [...t.komentari, noviK] }));
    setSelectedTermin(prev => prev && prev.id === terminId ? { ...prev, komentari: [...prev.komentari, noviK] } : prev);
  } catch {
    showToast("Greška pri slanju komentara.");
  }
};

  const handlePromjenaDuzine = (_terminId: number, _zeljenaDuzina: number, _razlog: string) => {
    showToast("✓ Vaš upit je uspješno poslan administratoru.");
  };

  const handleOtkaziTermin = async (termin: Termin) => {
    try {
      const res = await fetch(`${apiUrl}/api/rezervacije/${termin.id}/otkazi/osoblje`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (!res.ok) throw new Error();
      setListaTermina(prev => prev.map(t => t.id !== termin.id ? t : { ...t, status: "otkazan" as StatusTermina }));
      setSelectedTermin(null);
      setTerminZaOtkazivanje(null);
      showToast(`✓ Termin za ${termin.pacijent.ime} ${termin.pacijent.prezime} je otkazan.`);
    } catch {
      showToast("❌ Greška pri otkazivanju termina.");
    }
  };

  const handleZavrsiPregled = (rezervacijaId: number) => {
    setListaTermina(prev =>
      prev.map(t => t.id !== rezervacijaId ? t : { ...t, status: "zavrsen" as StatusTermina })
    );
    setSelectedTermin(prev =>
      prev?.id === rezervacijaId ? { ...prev, status: "zavrsen" as StatusTermina } : prev
    );
    showToast("✓ Pregled je uspješno završen i sačuvan.");
  };

  const navLabel = () => {
    if (prikaz === "dnevni") return formatDatum(selectedDatum);
    if (prikaz === "sedmicni") return `Sedmica: ${formatDatumPrikaz(weekDays[0])} – ${formatDatumPrikaz(weekDays[6])}`;
    return new Date(selectedDatum + "T12:00:00Z").toLocaleDateString("bs-BA", { month: "long", year: "numeric" });
  };

  const filterLabel = filterStatus === "otkazani" ? "otkazanih" : filterStatus === "zavrseni" ? "završenih" : "zakazanih";
  const filterLabelJed = filterStatus === "otkazani" ? "otkazan" : filterStatus === "zavrseni" ? "završen" : "zakazan";
  const praznoLabel =
    filterStatus === "otkazani" ? "Nema otkazanih termina za ovaj dan" :
    filterStatus === "zavrseni" ? "Nema završenih termina za ovaj dan" :
    "Nema termina za ovaj dan";

  const navDelta = prikaz === "dnevni" ? 1 : prikaz === "sedmicni" ? 7 : 1;
  const todayStr = danasUTC();

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-[100] bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-fade-in">
          <CheckCircle size={15} className="text-green-400 flex-shrink-0" />
          {toastMsg}
        </div>
      )}

      {showNovaRezervacija && <ModalNovaRezervacija onClose={() => setShowNovaRezervacija(false)} />}

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
          onPomjeri={() => setTerminZaPomjeranje(terminZaOtkazivanje)}
        />
      )}

      {terminZaPomjeranje && (
        <ModalPomjeriTermin
          termin={terminZaPomjeranje}
          onClose={() => setTerminZaPomjeranje(null)}
          onConfirm={(noviTerminId) => handlePomjeriTermin(terminZaPomjeranje, noviTerminId)}
        />
      )}

      {terminZaZavrsavanje && (
        <ModalZavrsiPregled
          termin={terminZaZavrsavanje}
          onClose={() => setTerminZaZavrsavanje(null)}
          onSuccess={(rezervacijaId) => {
            handleZavrsiPregled(rezervacijaId);
            setTerminZaZavrsavanje(null);
          }}
        />
      )}

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "ml-60" : "ml-0"}`}>

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Menu size={18} className="text-gray-600" />
              </button>
            )}
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">Moje rezervacije</h1>
              <p className="text-xs text-gray-400 mt-0.5">{doktorIme}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Nova rezervacija */}
            <button
              onClick={() => setShowNovaRezervacija(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={14} /> Nova rezervacija
            </button>

            {/* Filter statusa */}
            <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
              <button
                onClick={() => { setFilterStatus("zakazani"); setSelectedTermin(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === "zakazani" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Calendar size={12} /> Zakazani
              </button>
              <button
                onClick={() => { setFilterStatus("zavrseni"); setSelectedTermin(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === "zavrseni" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <CheckCircle size={12} /> Završeni
              </button>
              <button
                onClick={() => { setFilterStatus("otkazani"); setSelectedTermin(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === "otkazani" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <XCircle size={12} /> Otkazani
              </button>
            </div>

            {/* Prikaz */}
            <div className="flex bg-gray-100 rounded-xl p-0.5">
              {(["dnevni", "sedmicni", "mjesecni"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => { setPrikaz(p); setSelectedTermin(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    prikaz === p ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {p === "dnevni" ? "Dnevni" : p === "sedmicni" ? "Sedmični" : "Mjesečni"}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Sadržaj */}
        <div className="flex-1 p-5">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-sm text-gray-400">Učitavanje termina...</div>
            </div>
          ) : (
            <>
              <section className="mb-5 grid gap-4 lg:grid-cols-5">
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2" style={{ fontSize: "10px" }}>
                    Prosječna anonimna ocjena
                  </div>
                  <div className="flex items-end gap-3">
                    <div className={`text-4xl font-black leading-none ${reviewSummary.averageRating ? ratingColor(Math.round(reviewSummary.averageRating)) : "text-gray-300"}`}>
                      {reviewSummary.averageRating ? reviewSummary.averageRating.toFixed(1) : "—"}
                    </div>
                    <div className="pb-1">
                      <div className="flex items-center gap-0.5 mb-1">
                        {[1, 2, 3, 4, 5].map(value => (
                          <Star
                            key={value}
                            size={15}
                            className={reviewSummary.averageRating && reviewSummary.averageRating >= value ? ratingColor(Math.round(reviewSummary.averageRating)) : "text-gray-300"}
                            fill={reviewSummary.averageRating && reviewSummary.averageRating >= value ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                      <div className="text-xs text-gray-500">
                        {reviewSummary.reviewCount} anonimnih ocjena
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide" style={{ fontSize: "10px" }}>
                      Anonimni komentari pacijenata
                    </div>
                    <span className="text-xs text-gray-400">{reviewSummary.comments.length}</span>
                  </div>
                  {reviewSummary.comments.length === 0 ? (
                    <div className="text-sm text-gray-400 py-5 text-center">Još nema anonimnih komentara.</div>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {reviewSummary.comments.map(comment => (
                        <div key={comment.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-gray-700">{comment.author}</span>
                            <span className={`text-xs font-bold border rounded-full px-2 py-0.5 ${ratingBadge(comment.rating)}`}>
                              {comment.rating}/5
                            </span>
                          </div>
                          {comment.comment ? (
  <p className="text-sm text-gray-700 leading-snug">{comment.comment}</p>
) : (
  <p className="text-sm text-gray-400 italic">
    [Komentar uklonjen od strane administratora]
  </p>
)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Nav traka */}
              <div className="flex items-center gap-2.5 mb-5">
                <button
                  onClick={() => goDay(-navDelta)}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft size={15} className="text-gray-600" />
                </button>
                <span className="text-sm font-semibold text-gray-700 capitalize">{navLabel()}</span>
                <button
                  onClick={() => goDay(navDelta)}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight size={15} className="text-gray-600" />
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

              {/* Dnevni prikaz */}
              {prikaz === "dnevni" && (
                <div className={`grid gap-5 ${selectedTermin ? "grid-cols-5" : "grid-cols-1 max-w-2xl"}`}>
                  <div className={selectedTermin ? "col-span-2" : "col-span-1"}>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">
                          {dnevniTermini.length} {filterLabelJed}{dnevniTermini.length !== 1 ? "ih" : ""} termin{dnevniTermini.length !== 1 ? "a" : ""}
                        </span>
                        <div className="flex gap-1.5">
                          {Object.entries(tipConfig).map(([tip, cfg]) => {
                            const count = dnevniTermini.filter(t => t.tip === tip as TipPregleda).length;
                            if (!count) return null;
                            return (
                              <span key={tip} className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>
                                {count} {cfg.label.toLowerCase()}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="p-3 space-y-2">
                        {dnevniTermini.length === 0 ? (
                          <div className="text-center py-14">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                              <Calendar size={22} className="text-gray-300" />
                            </div>
                            <p className="text-sm text-gray-400">{praznoLabel}</p>
                          </div>
                        ) : (
                          dnevniTermini.map(t => (
                            <TerminRed
                              key={t.id}
                              termin={t}
                              onClick={() => setSelectedTermin(prev => prev?.id === t.id ? null : t)}
                              selected={selectedTermin?.id === t.id}
                            />
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
                        onZavrsiPregled={(t) => setTerminZaZavrsavanje(t)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Sedmični prikaz */}
              {prikaz === "sedmicni" && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-7 border-b border-gray-100">
                    {weekDays.map((ds, i) => {
                      const isToday = ds === todayStr;
                      return (
                        <button
                          key={ds}
                          onClick={() => { setSelectedDatum(ds); setPrikaz("dnevni"); }}
                          className={`p-3 text-center transition-colors hover:bg-blue-50 ${isToday ? "bg-blue-50" : ""}`}
                        >
                          <div className="text-xs text-gray-400 mb-1 font-medium">{dayNames[i]}</div>
                          <div className={`text-sm font-bold ${isToday ? "text-blue-600" : "text-gray-800"}`}>
                            {new Date(ds + "T12:00:00Z").getUTCDate()}
                          </div>
                          <div className="mt-1.5 flex justify-center gap-0.5 flex-wrap">
                            {filterTermini(listaTermina.filter(t => t.datum === ds)).map(t => (
                              <div key={t.id} className={`w-1.5 h-1.5 rounded-full ${tipConfig[t.tip].dot}`} />
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-7 divide-x divide-gray-100 min-h-64">
                    {weekDays.map(ds => {
                      const dayTermini = filterTermini(listaTermina.filter(t => t.datum === ds).sort((a, b) => a.vrijemeOd - b.vrijemeOd));
                      return (
                        <div key={ds} className="p-2 space-y-1.5">
                          {dayTermini.map(t => {
                            const tc = tipConfig[t.tip];
                            return (
                              <div
                                key={t.id}
                                onClick={() => { setSelectedDatum(ds); setPrikaz("dnevni"); setSelectedTermin(t); }}
                                className={`rounded-lg p-1.5 cursor-pointer hover:shadow-sm transition-all ${tc.bg} border ${tc.border}`}
                              >
                                <div className="text-xs font-bold text-gray-800 tabular-nums">{formatV(t.vrijemeOd)}</div>
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

              {/* Mjesečni prikaz */}
              {prikaz === "mjesecni" && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700 capitalize">
                      {new Date(selectedDatum + "T12:00:00Z").toLocaleDateString("bs-BA", { month: "long", year: "numeric" })}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                      {filterTermini(listaTermina.filter(t => t.datum.startsWith(selectedDatum.slice(0, 7)))).length} {filterLabel} termina
                    </span>
                  </div>
                  <div className="grid grid-cols-7 border-b border-gray-100">
                    {["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"].map(d => (
                      <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
                    {getMonthDays(selectedDatum).map((ds, idx) => {
                      const dayTermini = ds ? filterTermini(listaTermina.filter(t => t.datum === ds).sort((a, b) => a.vrijemeOd - b.vrijemeOd)) : [];
                      const isToday = ds === todayStr;
                      const isSelected = ds === selectedDatum;
                      return (
                        <div
                          key={idx}
                          onClick={() => { if (ds) { setSelectedDatum(ds); setPrikaz("dnevni"); } }}
                          className={`min-h-[90px] p-2 transition-colors ${ds ? "cursor-pointer hover:bg-blue-50" : "bg-gray-50 cursor-default"} ${isSelected ? "bg-blue-50" : ""}`}
                        >
                          {ds && (
                            <>
                              <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-blue-600 text-white" : "text-gray-600"}`}>
                                {new Date(ds + "T12:00:00Z").getUTCDate()}
                              </div>
                              <div className="space-y-0.5">
                                {dayTermini.slice(0, 3).map(t => {
                                  const tc = tipConfig[t.tip];
                                  return (
                                    <div
                                      key={t.id}
                                      onClick={e => { e.stopPropagation(); setSelectedDatum(ds); setPrikaz("dnevni"); setSelectedTermin(t); }}
                                      className={`text-xs rounded-md px-1 py-0.5 truncate font-medium ${tc.badge} flex items-center gap-1 cursor-pointer`}
                                    >
                                      {t.tip === "hitni" && <span>⚡</span>}
                                      {formatV(t.vrijemeOd)} {t.pacijent.ime[0]}. {t.pacijent.prezime}
                                    </div>
                                  );
                                })}
                                {dayTermini.length > 3 && (
                                  <div className="text-xs text-gray-400 pl-1 font-medium">+{dayTermini.length - 3} više</div>
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
