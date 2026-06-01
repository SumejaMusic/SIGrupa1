import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, Users, Download, Calendar, Clock,
  XCircle, CheckCircle, BarChart2, Building2, Filter
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";
const API = `${BASE_URL}/api`;

function authHeader(): Record<string, string> {
  const token = localStorage.getItem("token");
  if (!token) return { "Content-Type": "application/json" };
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

/** Formatira datum+vrijeme iz ISO/Date stringa u UTC prikaz */

function formatUTC(val: string | null | undefined): string {
  return val ?? "—";
}

/** Konvertuje minute od ponoći u HH:MM UTC string */
function minutesToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} UTC`;
}
// Dodaj = 0 kao fallback direktno u parametar funkcije
/**
 * Pretvara ISO UTC string u lokalni format DD.MM.YYYY
 */
const formatirajDatumLokalno = (isoString: string | undefined | null): string => {
  if (!isoString) return "--.--.----";
  
  const d = new Date(isoString);
  // Ako datum nije validan, sprječavamo NaN-NaN-NaN
  if (isNaN(d.getTime())) return "--.--.----";

  const dan = String(d.getDate()).padStart(2, "0");
  const mjesec = String(d.getMonth() + 1).padStart(2, "0");
  const godina = d.getFullYear();

  return `${dan}.${mjesec}.${godina}`; // Vraća npr. 22.05.2026
};

/**
 * Pretvara minute iz UTC-a u lokalni HH:MM format (+2 sata)
 */
const formatirajVrijemeIzMinuta = (ukupnoMinutaUTC: number | undefined | null): string => {
  if (ukupnoMinutaUTC === undefined || ukupnoMinutaUTC === null || isNaN(ukupnoMinutaUTC)) {
    return "--:--";
  }
  
  // Dodajemo 120 minuta (2 sata) za našu vremensku zonu
  let lokalneMinute = ukupnoMinutaUTC + 120;
  if (lokalneMinute >= 1440) lokalneMinute -= 1440;

  const sati = Math.floor(lokalneMinute / 60);
  const minuti = lokalneMinute % 60;

  return `${String(sati).padStart(2, "0")}:${String(minuti).padStart(2, "0")}`;
};

/**
 * Formatira kompletan ISO string u "DD.MM.YYYY HH:MM" (za kolone Zakazano U i Otkazano U)
 */
const formatirajDatumIVrijemeFull = (isoString: string | undefined | null): string => {
  if (!isoString) return "--.--.---- --:--";
  
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "--.--.---- --:--";

  // Korekcija za +2 sata na puni ISO datum
  d.setHours(d.getHours() + 2);

  const dan = String(d.getDate()).padStart(2, "0");
  const mjesec = String(d.getMonth() + 1).padStart(2, "0");
  const godina = d.getFullYear();
  const sati = String(d.getHours()).padStart(2, "0");
  const minuti = String(d.getMinutes()).padStart(2, "0");

  return `${dan}.${mjesec}.${godina} u ${sati}:${minuti}`;
};
// ─────────────────────────────────────────────────────────────
//  TIPOVI
// ─────────────────────────────────────────────────────────────
interface KorisnikStat { uloga: string; broj: number; }

interface RecenzijaDetalj {
  id: number;
  ocjena: number;
  komentar: string | null;
  sakriven: boolean;
  sakrivenAt: string | null;
  kreiranoAt: string;
  rezervacija: {
    pacijent: { korisnik: { ime: string; prezime: string } };
    doktor: {
      korisnik: { ime: string; prezime: string };
      odjel: { naziv: string };
    };
  } | null;
}
interface TerminZaDoktora {
  doktorId: number; ime: string; prezime: string; odjel: string;
  ukupno: number; brojZakazanih: number; brojSlobodnih: number;
  // Dodana polja koja koristiš u tabeli:
  datum: string;
  status?: string;
  vrijeme?: number;
  vrijemeMin?: number;
  datumOtkazivanja?: string | null;
}

interface TerminiStatsResponse {
  slobodni: number;
  zakazaniPoDoktoru: TerminZaDoktora[];
}

interface SalaOccupancy {
  sobaId: number;
  naziv: string;
  tip: string;          // TipSobe: ORDINACIJA | SALA | KABINET | LABORATORIJ
  sprat: number;
  kapacitet: number;
  statusSobe: string;   // AKTIVNA | NEAKTIVNA | U_RENOVACIJI
  // Doktori koji koriste ovu sobu
  doktori: { ime: string; prezime: string; odjel: string }[];
  // Rezervacije za tekući period
  ukupnoRezervacija: number;
  zavrsenih: number;
  otkazanih: number;
  aktivnih: number;     // ZAKAZAN + POTVRDJEN
}

interface ZakazivanjDetalj {
  terminId: number;
  datum: string;        // ISO
  vrijemeMin: number;   // minute od ponoći
  status: string;
  doktorIme: string;
  doktorPrezime: string;
  odjel: string;
  soba: string | null;
  // Rezervacija
  rezervacijaId: number | null;
  zakazaoIme: string | null;
  zakazaoPrezime: string | null;
  zakazaoEmail: string | null;
  datumKreiranja: string | null;  // ISO UTC
  // Otkazivanje
  datumOtkazivanja: string | null; // ISO UTC
  razlogOtkazivanja: string | null;
  otkazaoIme: string | null;
  otkazaoPrezime: string | null;
  vrijemePrikaz?: string;   // ← dodati ovo
}

// ─────────────────────────────────────────────────────────────
//  POMOCNE KOMPONENTE
// ─────────────────────────────────────────────────────────────
const Tab = ({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active
        ? "bg-blue-700 text-white shadow-sm"
        : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    {children}
  </button>
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    SLOBODAN:  "bg-green-100 text-green-700",
    ZAKAZAN:   "bg-blue-100 text-blue-700",
    POTVRDJEN: "bg-indigo-100 text-indigo-700",
    OTKAZAN:   "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    SLOBODAN: "Slobodan", ZAKAZAN: "Zakazan",
    POTVRDJEN: "Potvrđen", OTKAZAN: "Otkazan",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {labels[status] ?? status}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
//  GLAVNI KOMPONENT
// ─────────────────────────────────────────────────────────────
export default function MenadzmantPanel() {
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState<
    "korisnici" | "termini" | "sale" | "zakazivanja" | "export" | "recenzije"
  >("korisnici");

  // Loading / greška
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportGreska, setExportGreska] = useState("");

  // Podaci
  const [korisnici, setKorisnici] = useState<KorisnikStat[]>([]);
  const [terminiStats, setTerminiStats] = useState<TerminiStatsResponse | null>(null);

  // Sale — lokalno računamo iz terminiStats + extended endpoint
  const [saleOccupancy, setSaleOccupancy] = useState<SalaOccupancy[]>([]);

  // Zakazivanja/otkazivanja
  const [zakazivanja, setZakazivanja] = useState<ZakazivanjDetalj[]>([]);
  const [zakFilter, setZakFilter] = useState<"svi" | "zakazani" | "otkazani" | "slobodni">("svi");
  const [zakOd, setZakOd] = useState("");
  const [zakDo, setZakDo] = useState("");
  const [zakLoading, setZakLoading] = useState(false);
  const [zakPage, setZakPage] = useState(1);
  const [zakUkupno, setZakUkupno] = useState(0);
  const ZAK_LIMIT = 20;

  // Export
  const [od, setOd] = useState("");
  const [do_, setDo] = useState("");
const [recenzije, setRecenzije] = useState<RecenzijaDetalj[]>([]);
const [recPage, setRecPage] = useState(1);
const [recUkupno, setRecUkupno] = useState(0);
const [recLoading, setRecLoading] = useState(false);
const [samoSaKomentarom, setSamoSaKomentarom] = useState(false);
const REC_LIMIT = 20;

const dohvatiRecenzije = useCallback(async (page = 1) => {
  setRecLoading(true);
  try {
    const params = new URLSearchParams({
      stranica: String(page),
      limit: String(REC_LIMIT),
    });
    if (samoSaKomentarom) params.set("samo_sa_komentarom", "true");

    const res = await fetch(`${API}/vlasnik/recenzije?${params}`, {
      headers: authHeader(),
    });
    if (res.ok) {
      const data = await res.json();
      setRecenzije(data.recenzije ?? []);
      setRecUkupno(data.paginacija?.ukupno ?? 0);
      setRecPage(page);
    }
  } catch { /* silent */ }
  setRecLoading(false);
}, [samoSaKomentarom]);

const sakrijiRecenziju = async (id: number) => {
  if (!confirm("Sakriti komentar ove recenzije? Ocjena će ostati vidljiva.")) return;
  try {
    const res = await fetch(`${API}/vlasnik/recenzije/${id}/sakrij`, {
      method: "PATCH",
      headers: authHeader(),
    });
    if (res.ok) dohvatiRecenzije(recPage);
  } catch { /* silent */ }
};
  // ── Inicijalno dohvatanje ──────────────────────────────────
  useEffect(() => {
  if (activeTab === "recenzije") dohvatiRecenzije(1);
}, [activeTab, samoSaKomentarom, dohvatiRecenzije]);
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [resK, resT] = await Promise.all([
          fetch(`${API}/vlasnik/korisnici-po-ulogama`, { headers: authHeader() }),
          fetch(`${API}/vlasnik/termini-stats`, { headers: authHeader() }),
        ]);
        if (resK.ok) setKorisnici(await resK.json());
        if (resT.ok) {
          const data: TerminiStatsResponse = await resT.json();
          setTerminiStats(data);
        }
      } catch { /* silent */ }
      setLoading(false);
    };
    init();
  }, []);

  // Sale se dohvataju kad se prvi put otvori taj tab
  useEffect(() => {
    if (activeTab === "sale" && saleOccupancy.length === 0) {
      fetchSaleOccupancy();
    }
  }, [activeTab]);

  /** Dohvata zauzetenost soba sa backenda */
  async function fetchSaleOccupancy() {
    try {
      const res = await fetch(`${API}/vlasnik/sale-occupancy`, { headers: authHeader() });
      if (res.ok) setSaleOccupancy(await res.json());
    } catch { /* silent */ }
  }

  // ── Dohvati detalje zakazivanja/otkazivanja ────────────────
  const dohvatiZakazivanja = useCallback(async (page = 1) => {
    setZakLoading(true);
    try {
      const params = new URLSearchParams({
        stranica: String(page),
        limit: String(ZAK_LIMIT),
      });
     if (zakFilter !== "svi") {
  const statusMap: Record<string, string> = {
    zakazani: "ZAKAZAN,POTVRDJEN",
    otkazani: "OTKAZAN",
    slobodni: "SLOBODAN",
  };
  params.set("status", statusMap[zakFilter]);
}
      if (zakOd) params.set("datumOd", new Date(zakOd).toISOString());
      if (zakDo) {
        const d = new Date(zakDo);
        d.setUTCHours(23, 59, 59, 999);
        params.set("datumDo", d.toISOString());
      }

      const res = await fetch(`${API}/vlasnik/termini-detalji?${params}`, {
        headers: authHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        setZakazivanja(data.termini ?? []);
        setZakUkupno(data.paginacija?.ukupno ?? 0);
        setZakPage(page);
      }
    } catch { /* silent */ }
    setZakLoading(false);
  }, [zakFilter, zakOd, zakDo]);

  useEffect(() => {
    if (activeTab === "zakazivanja") dohvatiZakazivanja(1);
  }, [activeTab, zakFilter, zakOd, zakDo, dohvatiZakazivanja]);

  // ── Export Excel ───────────────────────────────────────────
  const exportExcel = async () => {
    if (!od || !do_) return;
    setExportGreska("");
    setExportLoading(true);
    try {
      const odISO = new Date(od).toISOString();
      const doDate = new Date(do_);
      doDate.setUTCHours(23, 59, 59, 999);
      const doISO = doDate.toISOString();

      const res = await fetch(
        `${API}/vlasnik/export-csv?period=custom&datumOd=${odISO}&datumDo=${doISO}`,
        { headers: authHeader() }
      );
      if (!res.ok) { setExportGreska("Greška pri exportu."); setExportLoading(false); return; }

      // Koristimo ArrayBuffer umjesto Blob URL-a — radi i u Electronu i u browseru
      const arrayBuffer = await res.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const fileName = `statistika_${od}_${do_}.xlsx`;

      // Electron okruženje — koristimo showSaveDialog ako je dostupan
      const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
      if (isElectron) {
        // Pretpostavljamo da je u preload.js izložen electronAPI.saveFile(fileName, bytes)
        const saved = await (window as any).electronAPI.saveFile(fileName, Array.from(bytes));
        if (!saved) setExportGreska("Snimanje otkazano.");
      } else {
        // Browser fallback — klasični Blob download
        const blob = new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          URL.revokeObjectURL(url);
          link.remove();
        }, 100);
      }
    } catch (e) {
      console.error("Export greška:", e);
      setExportGreska("Greška pri exportu.");
    }
    setExportLoading(false);
  };

  // ── UI helpers ────────────────────────────────────────────
  const ulogaConfig: Record<string, { boja: string; label: string }> = {
    ADMINISTRATOR:      { boja: "bg-red-50 border-red-200 text-red-700",    label: "Administrator" },
    DOKTOR:             { boja: "bg-blue-50 border-blue-200 text-blue-700", label: "Doktor" },
    PACIJENT:           { boja: "bg-green-50 border-green-200 text-green-700", label: "Pacijent" },
    MEDICINSKO_OSOBLJE: { boja: "bg-yellow-50 border-yellow-200 text-yellow-700", label: "Med. osoblje" },
    VLASNIK:            { boja: "bg-purple-50 border-purple-200 text-purple-700", label: "Vlasnik" },
  };

  const inp = "px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

  const totalPages = Math.ceil(zakUkupno / ZAK_LIMIT);

  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-700 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-blue-900">Menadžment Panel</h1>
              <p className="text-xs text-gray-400">Pregled statistike i izvještaji</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            ← Nazad
          </button>
        </div>

        {/* ── TAB BAR ──────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-6 pb-3 flex gap-2 flex-wrap">
          <Tab active={activeTab === "korisnici"}   onClick={() => setActiveTab("korisnici")}>
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Korisnici</span>
          </Tab>
          <Tab active={activeTab === "termini"}     onClick={() => setActiveTab("termini")}>
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Termini po doktoru</span>
          </Tab>
          <Tab active={activeTab === "sale"}        onClick={() => setActiveTab("sale")}>
            <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Zauzetenost sala</span>
          </Tab>
          <Tab active={activeTab === "zakazivanja"} onClick={() => setActiveTab("zakazivanja")}>
            <span className="flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5" /> Otkazani i zakazani termini</span>
          </Tab>
          <Tab active={activeTab === "export"}      onClick={() => setActiveTab("export")}>
            <span className="flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Export Excel</span>
          </Tab>
          <Tab active={activeTab === "recenzije"} onClick={() => setActiveTab("recenzije")}>
  <span className="flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5" /> Recenzije</span>
</Tab>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ══════════════════════════════════════════════
                TAB: KORISNICI
            ══════════════════════════════════════════════ */}
            {activeTab === "korisnici" && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <Users className="w-5 h-5 text-blue-700" />
                  <h2 className="text-base font-semibold text-gray-900">Registrovani korisnici po ulogama</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {korisnici.map((k) => {
                    const cfg = ulogaConfig[k.uloga];
                    return (
                      <div key={k.uloga} className={`rounded-xl border p-4 ${cfg?.boja ?? "bg-gray-50 border-gray-200 text-gray-700"}`}>
                        <p className="text-3xl font-bold">{k.broj}</p>
                        <p className="text-xs mt-1 font-medium">{cfg?.label ?? k.uloga}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ══════════════════════════════════════════════
                TAB: TERMINI PO DOKTORU
            ══════════════════════════════════════════════ */}
           {activeTab === "termini" && (
  <section>
    <div className="flex items-center gap-2 mb-5">
      <Calendar className="w-5 h-5 text-blue-700" />
      <h2 className="text-base font-semibold text-gray-900">Zakazani termini po doktoru</h2>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 inline-flex items-center gap-3 mb-5">
      <div>
        <p className="text-xs text-blue-600 font-medium">Slobodni termini (ukupno)</p>
        <p className="text-3xl font-bold text-blue-700">{terminiStats?.slobodni ?? 0}</p>
      </div>
    </div>

    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Doktor</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Odjel</th>
          
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Ukupno</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Zakazanih</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Slobodnih</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Iskorišteno %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {!terminiStats?.zakazaniPoDoktoru?.length ? (
            <tr>
              <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                Nema zakazanih termina.
              </td>
            </tr>
          ) : (
            terminiStats.zakazaniPoDoktoru.map((d, i) => {
              const pct = d.ukupno > 0 ? Math.round((d.brojZakazanih / d.ukupno) * 100) : 0;
              
              // Određivanje da li je termin otkazan na osnovu baze/backend-a
              const jeOtkazan = d.status === "OTKAZAN" || d.datumOtkazivanja != null;

              return (
                <tr key={d.doktorId || i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    Dr. {d.ime} {d.prezime}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{d.odjel}</td>
                  
                  {/* POPRAVKA: Ispravan datum (DD.MM.YYYY) i ispravno vrijeme (+2h) */}
                  

                  {/* DODANO: Vizuelni status filtera za otkazivanje */}
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full inline-block ${
                      jeOtkazan 
                        ? "bg-red-100 text-red-700 border border-red-200" 
                        : "bg-blue-100 text-blue-700 border border-blue-200"
                    }`}>
                      {jeOtkazan ? "OTKAZAN" : d.status ?? "ZAKAZAN"}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right text-gray-600">{d.ukupno}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden hidden sm:block">
                        <div 
                          className={`h-full rounded-full ${jeOtkazan ? 'bg-red-500' : 'bg-blue-500'}`} 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                      <span className={`font-semibold ${jeOtkazan ? 'text-red-700' : 'text-blue-700'}`}>
                        {d.brojZakazanih}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">
                    {d.brojSlobodnih}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      pct >= 80 ? "bg-red-100 text-red-700"
                      : pct >= 50 ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                    }`}>{pct}%</span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </section>
)}

            {/* ══════════════════════════════════════════════
                TAB: ZAUZETENOST SALA
            ══════════════════════════════════════════════ */}
            {activeTab === "sale" && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-700" />
                    <h2 className="text-base font-semibold text-gray-900">Zauzetenost soba po terminima</h2>
                  </div>
                
                </div>

                {saleOccupancy.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
                    Nema podataka o sobama.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Legenda tipova */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[
                        { tip: "ORDINACIJA",  boja: "bg-blue-100 text-blue-700" },
                        { tip: "SALA",        boja: "bg-purple-100 text-purple-700" },
                        { tip: "KABINET",     boja: "bg-amber-100 text-amber-700" },
                        { tip: "LABORATORIJ", boja: "bg-teal-100 text-teal-700" },
                      ].map((t) => (
                        <span key={t.tip} className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.boja}`}>
                          {t.tip}
                        </span>
                      ))}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Soba</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tip</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sprat</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Doktori</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Ukupno rezervacija (otkazane + zakazane + završene)</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Aktivnih</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Završenih</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Otkazanih</th>
                          </tr>
                        </thead>
                        <tbody>
                          {saleOccupancy.map((s) => {
                            const tipBoja: Record<string, string> = {
                              ORDINACIJA:  "bg-blue-100 text-blue-700",
                              SALA:        "bg-purple-100 text-purple-700",
                              KABINET:     "bg-amber-100 text-amber-700",
                              LABORATORIJ: "bg-teal-100 text-teal-700",
                            };
                            const statusBoja: Record<string, string> = {
                              AKTIVNA:       "bg-green-100 text-green-700",
                              NEAKTIVNA:     "bg-gray-100 text-gray-500",
                              U_RENOVACIJI:  "bg-orange-100 text-orange-700",
                            };
                            const statusLabel: Record<string, string> = {
                              AKTIVNA: "Aktivna", NEAKTIVNA: "Neaktivna", U_RENOVACIJI: "U renovaciji",
                            };
                            return (
                              <tr key={s.sobaId} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                  <p className="font-medium text-gray-900">{s.naziv}</p>
                                  <p className="text-xs text-gray-400">Kapacitet: {s.kapacitet}</p>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipBoja[s.tip] ?? "bg-gray-100 text-gray-600"}`}>
                                    {s.tip}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600 text-xs">
                                  {s.sprat === 0 ? "Prizemlje" : `${s.sprat}. sprat`}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBoja[s.statusSobe] ?? "bg-gray-100 text-gray-600"}`}>
                                    {statusLabel[s.statusSobe] ?? s.statusSobe}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  {s.doktori.length === 0 ? (
                                    <span className="text-gray-400 text-xs">Nije dodijeljen</span>
                                  ) : (
                                    <div className="space-y-0.5">
                                      {s.doktori.map((d, i) => (
                                        <p key={i} className="text-xs text-gray-700">
                                          Dr. {d.ime} {d.prezime}
                                          <span className="text-gray-400 ml-1">({d.odjel})</span>
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-gray-700">{s.ukupnoRezervacija}</td>
                                <td className="px-4 py-3 text-right">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    s.aktivnih > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
                                  }`}>{s.aktivnih}</span>
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-green-600">{s.zavrsenih}</td>
                                <td className="px-4 py-3 text-right font-semibold text-red-500">{s.otkazanih}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ══════════════════════════════════════════════
                TAB: KO JE ZAKAZAO / OTKAZAO
            ══════════════════════════════════════════════ */}
            {activeTab === "zakazivanja" && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <BarChart2 className="w-5 h-5 text-blue-700" />
                  <h2 className="text-base font-semibold text-gray-900">
                   Vrijeme i datum termina (otkazan, zakazan, slobodan)
                  </h2>
                </div>

                {/* ── Filter bar ── */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 flex flex-wrap gap-4 items-end">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      <Filter className="inline w-3 h-3 mr-1" />Status
                    </label>
                    <select
                      value={zakFilter}
                      onChange={(e) => setZakFilter(e.target.value as any)}
                      className={inp}
                    >
                     <option value="svi">Svi statusi</option>
<option value="zakazani">Zakazani</option>
<option value="otkazani">Otkazani</option>
<option value="slobodni">Slobodni</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      <Clock className="inline w-3 h-3 mr-1" />Datum termina od (UTC)
                    </label>
                    <input type="date" value={zakOd} onChange={(e) => setZakOd(e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Datum termina do (UTC)
                    </label>
                    <input type="date" value={zakDo} onChange={(e) => setZakDo(e.target.value)} className={inp} />
                  </div>
                  <button
                    onClick={() => dohvatiZakazivanja(1)}
                    className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium transition-colors"
                  >
                    Primijeni filter
                  </button>
                  {(zakOd || zakDo || zakFilter !== "svi") && (
                    <button
                      onClick={() => { setZakFilter("svi"); setZakOd(""); setZakDo(""); }}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Resetuj
                    </button>
                  )}
                </div>

                {zakLoading ? (
                  <div className="flex justify-center py-16">
                    <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                      <table className="w-full text-sm min-w-[900px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Datum termina (UTC)</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vrijeme (UTC)</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Doktor</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Odjel / Soba</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                              <CheckCircle className="inline w-3.5 h-3.5 text-blue-500 mr-1" />
                              Zakazao
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Zakazano u (UTC)</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                              <XCircle className="inline w-3.5 h-3.5 text-red-500 mr-1" />
                              Otkazao
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Otkazano u (UTC)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {zakazivanja.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                                Nema podataka za odabrane filtere.
                              </td>
                            </tr>
                          ) : (
                            zakazivanja.map((z) => {
                              // Datum termina u UTC
                             const datumStr = z.datum ?? "—";

                              return (
                                <tr key={`${z.terminId}-${z.rezervacijaId}`}
                                  className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3">
                                    <StatusBadge status={z.status} />
                                  </td>
                                  <td className="px-4 py-3 text-gray-700 font-mono text-xs">{datumStr}</td>
                                 <td className="px-4 py-3 text-gray-700 font-mono text-xs">
  {z.vrijemePrikaz 
    ? `${z.vrijemePrikaz} h`
    : z.vrijemeMin != null
      ? `${formatirajVrijemeIzMinuta(z.vrijemeMin)} h`
      : "--:--"}
</td>
                                  <td className="px-4 py-3 text-gray-900">
                                    Dr. {z.doktorIme} {z.doktorPrezime}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-gray-700">{z.odjel}</span>
                                    {z.soba && (
                                      <span className="ml-1 text-xs text-gray-400">/ {z.soba}</span>
                                    )}
                                  </td>

                                  {/* Ko je zakazao */}
                                  <td className="px-4 py-3">
                                    {z.zakazaoIme ? (
                                      <div>
                                        <p className="text-gray-900 font-medium text-xs">
                                          {z.zakazaoIme} {z.zakazaoPrezime}
                                        </p>
                                        {z.zakazaoEmail && (
                                          <p className="text-gray-400 text-xs">{z.zakazaoEmail}</p>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 text-xs">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                                    {formatUTC(z.datumKreiranja)}
                                  </td>

                                  {/* Ko je otkazao */}
                                  <td className="px-4 py-3">
                                    {z.datumOtkazivanja ? (
                                      <div>
                                        <p className="text-red-700 font-medium text-xs">
                                          {z.otkazaoIme ? `${z.otkazaoIme} ${z.otkazaoPrezime}` : "—"}
                                        </p>
                                        {z.razlogOtkazivanja && (
                                          <p className="text-gray-400 text-xs">{z.razlogOtkazivanja}</p>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 text-xs">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-xs text-red-600">
                                    {formatUTC(z.datumOtkazivanja)}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginacija */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-gray-500">
                          Ukupno: <span className="font-medium">{zakUkupno}</span> termina
                        </p>
                        <div className="flex gap-2">
                          <button
                            disabled={zakPage <= 1}
                            onClick={() => dohvatiZakazivanja(zakPage - 1)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                          >
                            ← Preth.
                          </button>
                          <span className="px-3 py-1.5 text-sm text-gray-600">
                            {zakPage} / {totalPages}
                          </span>
                          <button
                            disabled={zakPage >= totalPages}
                            onClick={() => dohvatiZakazivanja(zakPage + 1)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                          >
                            Sljed. →
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {/* ══════════════════════════════════════════════
                TAB: EXPORT
            ══════════════════════════════════════════════ */}
            {activeTab === "export" && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <Download className="w-5 h-5 text-blue-700" />
                  <h2 className="text-base font-semibold text-gray-900">Export statistike u Excel</h2>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-xl">
                  <p className="text-sm text-gray-500 mb-5">
                    Exportuje statistiku zakazanih pregleda po doktorima za odabrani period.
                    Datumi se šalju i procesiraju u UTC formatu.
                  </p>
                  <div className="flex flex-wrap gap-4 items-end">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Od datuma (UTC)</label>
                      <input type="date" value={od} onChange={(e) => setOd(e.target.value)} className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Do datuma (UTC)</label>
                      <input type="date" value={do_} onChange={(e) => setDo(e.target.value)} className={inp} />
                    </div>
                    <button
                      onClick={exportExcel}
                      disabled={!od || !do_ || exportLoading}
                      className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium transition-colors disabled:opacity-40"
                    >
                      <Download className="w-4 h-4" />
                      {exportLoading ? "Exportovanje..." : "Exportuj Excel"}
                    </button>
                  </div>
                  {exportGreska && <p className="text-sm text-red-600 mt-3">{exportGreska}</p>}
                </div>
              </section>
            )}
            {activeTab === "recenzije" && (
  <section>
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-blue-700" />
        <h2 className="text-base font-semibold text-gray-900">Moderacija recenzija</h2>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={samoSaKomentarom}
          onChange={(e) => setSamoSaKomentarom(e.target.checked)}
          className="rounded"
        />
        Samo recenzije sa komentarom
      </label>
    </div>

    {recLoading ? (
      <div className="flex justify-center py-16">
        <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    ) : (
      <>
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pacijent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Doktor / Odjel</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Ocjena</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Komentar</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Datum</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Akcija</th>
              </tr>
            </thead>
            <tbody>
              {recenzije.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    Nema recenzija.
                  </td>
                </tr>
              ) : (
                recenzije.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-900">
                      {r.rezervacija?.pacijent.korisnik.ime} {r.rezervacija?.pacijent.korisnik.prezime}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-900">
                        Dr. {r.rezervacija?.doktor.korisnik.ime} {r.rezervacija?.doktor.korisnik.prezime}
                      </p>
                      <p className="text-xs text-gray-400">{r.rezervacija?.doktor.odjel.naziv}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold text-sm">
                        {"★".repeat(r.ocjena)}{"☆".repeat(5 - r.ocjena)}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {r.sakriven ? (
                        <span className="text-xs text-gray-400 italic">
                          [Komentar uklonjen — ocjena ostaje vidljiva]
                        </span>
                      ) : r.komentar ? (
                        <p className="text-xs text-gray-700">{r.komentar}</p>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {formatUTC(r.kreiranoAt)}
                    </td>
                    <td className="px-4 py-3">
                      {r.sakriven ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                          Sakriven
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                          Vidljiv
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!r.sakriven && r.komentar && (
                        <button
                          onClick={() => sakrijiRecenziju(r.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium transition-colors border border-red-200"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Sakrij komentar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {Math.ceil(recUkupno / REC_LIMIT) > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Ukupno: <span className="font-medium">{recUkupno}</span> recenzija
            </p>
            <div className="flex gap-2">
              <button
                disabled={recPage <= 1}
                onClick={() => dohvatiRecenzije(recPage - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                ← Preth.
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">
                {recPage} / {Math.ceil(recUkupno / REC_LIMIT)}
              </span>
              <button
                disabled={recPage >= Math.ceil(recUkupno / REC_LIMIT)}
                onClick={() => dohvatiRecenzije(recPage + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Sljed. →
              </button>
            </div>
          </div>
        )}
      </>
    )}
  </section>
)}
          </>
        )}
      </div>
    </div>
  );
}