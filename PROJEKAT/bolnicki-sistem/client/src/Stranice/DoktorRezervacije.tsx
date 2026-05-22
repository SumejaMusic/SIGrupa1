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
  ChevronUp
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { TerminRed } from "../components/TerminRed";
import { TerminDetalji } from "../components/TerminDetalj";
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

    return () => {
      mounted = false;
    };
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
            ) : greska ? (
              <div className="text-center py-10 text-sm text-red-500">{greska}</div>
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
                <div className="text-xs text-gray-500">{formatDatumPrikaz(termin.datum)} · {formatV(termin.vrijemeOd)} – {formatV(termin.vrijemeDo)}</div>
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
                        d === zeljenaDuzina ? "bg-orange-500 text-white border-orange-500"
                        : d === trenutnaDuzina ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
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
  termin: Termin; onClose: () => void; onConfirm: () => void;
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
            <div className="text-xs text-gray-500 mt-0.5">{formatDatumPrikaz(termin.datum)} · {formatV(termin.vrijemeOd)} – {formatV(termin.vrijemeDo)}</div>
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-green-600 to-green-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Stethoscope size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Završi pregled</h2>
              <p className="text-xs text-green-100">
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
            <div className="flex flex-col items-center justify-center text-center py-10">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Pregled uspješno završen!</h3>
              <p className="text-sm text-gray-500">Podaci su sačuvani.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {greska && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  {greska}
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  Dijagnoza <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={dijagnoza}
                  onChange={e => setDijagnoza(e.target.value)}
                  placeholder="Unesite dijagnozu..."
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none outline-none focus:border-green-400 bg-gray-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  Terapija <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={terapija}
                  onChange={e => setTerapija(e.target.value)}
                  placeholder="Unesite preporučenu terapiju..."
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none outline-none focus:border-green-400 bg-gray-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  Bilješke <span className="text-gray-400 font-normal">(opcionalno)</span>
                </label>
                <textarea
                  value={biljeske}
                  onChange={e => setBiljeske(e.target.value)}
                  placeholder="Dodatne napomene..."
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none outline-none focus:border-green-400 bg-gray-50"
                />
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setDodajRecept(p => !p)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors ${
                    dodajRecept ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Pill size={15} />
                    Dodaj recept
                    {dodajRecept && (
                      <span className="text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full font-medium">uključeno</span>
                    )}
                  </div>
                  {dodajRecept ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                {dodajRecept && (
                  <div className="p-4 space-y-3 border-t border-gray-200 bg-white">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                          Naziv lijeka <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={nazivLijeka}
                          onChange={e => setNazivLijeka(e.target.value)}
                          placeholder="Npr. Brufen 400mg"
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                          Doza <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={doza}
                          onChange={e => setDoza(e.target.value)}
                          placeholder="Npr. 1×1 tableta"
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                          Trajanje (dana) <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={trajanje}
                          onChange={e => setTrajanje(e.target.value.replace(/\D/g, ""))}
                          placeholder="Npr. 7"
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 bg-gray-50"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                          Napomena <span className="text-gray-400 font-normal">(opcionalno)</span>
                        </label>
                        <input
                          value={napomena}
                          onChange={e => setNapomena(e.target.value)}
                          placeholder="Npr. Uzimati uz obrok"
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 bg-gray-50"
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
          <div className="px-5 pb-5 pt-3 flex gap-3 flex-shrink-0 border-t border-gray-100">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Odustani
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formaValidna || loading}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                formaValidna && !loading
                  ? "bg-green-600 text-white hover:bg-green-700"
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

  useEffect(() => {
    setDoktorIme(getDoktorIme());
  }, []);

  // ── Novi state: "zakazani" | "zavrseni" | "otkazani" ──────────────────────
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

  // ── Filtriranje po novom state-u ──────────────────────────────────────────
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

  const formatDatum = (ds: string) =>
    new Date(ds + "T12:00:00Z").toLocaleDateString("bs-BA", { weekday: "long", day: "numeric", month: "long" });

  const handleAddKomentar = async (terminId: number, tekst: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/rezervacije/${terminId}/komentar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ komentar: tekst }),
      });
      if (!res.ok) throw new Error();
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
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (!res.ok) throw new Error();
      setListaTermina(prev => prev.map(t => t.id !== termin.id ? t : { ...t, status: "otkazan" as StatusTermina }));
      setSelectedTermin(prev => prev?.id === termin.id ? { ...prev, status: "otkazan" as StatusTermina } : prev);
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

  // ── Label za prazno stanje i brojač ──────────────────────────────────────
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

      {toastMsg && (
        <div className="fixed top-5 right-5 z-[100] bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
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
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
                <Menu size={18} className="text-gray-600" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900">Moje rezervacije</h1>
              <p className="text-xs text-gray-500">{doktorIme}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNovaRezervacija(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={15} /> Nova rezervacija
            </button>

            {/* ── Tri dugmeta za filter statusa ─────────────────────────── */}
            <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
              <button
                onClick={() => { setFilterStatus("zakazani"); setSelectedTermin(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === "zakazani" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Calendar size={13} /> Zakazani
              </button>
              <button
                onClick={() => { setFilterStatus("zavrseni"); setSelectedTermin(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === "zavrseni" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <CheckCircle size={13} /> Završeni
              </button>
              <button
                onClick={() => { setFilterStatus("otkazani"); setSelectedTermin(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === "otkazani" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <XCircle size={13} /> Otkazani
              </button>
            </div>

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
                          {dnevniTermini.length} {filterLabelJed}{dnevniTermini.length !== 1 ? "ih" : ""} termin{dnevniTermini.length !== 1 ? "a" : ""}
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

              {prikaz === "sedmicni" && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-7 border-b border-gray-100">
                    {weekDays.map((ds, i) => {
                      const isToday = ds === todayStr;
                      return (
                        <button key={ds} onClick={() => { setSelectedDatum(ds); setPrikaz("dnevni"); }} className={`p-3 text-center transition-colors hover:bg-blue-50 ${isToday ? "bg-blue-50" : ""}`}>
                          <div className="text-xs text-gray-400 mb-1">{dayNames[i]}</div>
                          <div className={`text-sm font-bold ${isToday ? "text-blue-600" : "text-gray-800"}`}>{new Date(ds + "T12:00:00Z").getUTCDate()}</div>
                          <div className="mt-1 flex justify-center gap-0.5 flex-wrap">
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
                                className={`rounded p-1.5 cursor-pointer hover:shadow-sm transition-all ${tc.bg} border ${tc.border}`}
                              >
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
                      {new Date(selectedDatum + "T12:00:00Z").toLocaleDateString("bs-BA", { month: "long", year: "numeric" })}
                    </span>
                    <span className="text-xs text-gray-400">
                      {filterTermini(listaTermina.filter(t => t.datum.startsWith(selectedDatum.slice(0, 7)))).length} {filterLabel} termina u ovom mjesecu
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
                              <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-blue-600 text-white" : "text-gray-700"}`}>
                                {new Date(ds + "T12:00:00Z").getUTCDate()}
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
