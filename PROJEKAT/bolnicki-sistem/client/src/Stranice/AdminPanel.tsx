import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

function authHeader(): Record<string, string> {
  const token = localStorage.getItem("token");
  if (!token) return { "Content-Type": "application/json" };
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}
interface PacijentProfil {
  id: number;
  hronicniBolesnik: boolean;
}

interface DoktorProfil {
  id: number;
  specijalizacija: string;
  brojLicence: number;
  trajanjePregleda: number;
  brojPregleda: number;
  odjel: { id: number; naziv: string } | null;
  soba: { id: number; naziv: string } | null;
}

interface OsobljeProfil {
  id: number;
  pozicija: string;
  radnoVrijeme: number;
  odjel: { id: number; naziv: string } | null;
}

interface Korisnik {
  id: number;
  ime: string;
  prezime: string;
  email: string;
  brojTelefona?: string;
  uloga: string;
  datumRegistracije: string;
  nalogZakljucan: boolean;
  emailVerifikovan: boolean;
  brojNeuspjelihPrijava: number;
  datumRodjenja?: string;
  vrijemeZakljucavanja?: string;
  pacijentProfile?: PacijentProfil;
  doktorProfile?: DoktorProfil;
  osobljeProfile?: OsobljeProfil;
}

interface RezervacijaKratka {
  id: number;
  komentar: string | null;
  hitnost: boolean;
  datumKreiranja: string;
  datumOtkazivanja: string | null;
  zavrseno: boolean;
}

interface Termin {
  id: number;
  datum: string;
  vrijeme: number;
  status: string;
  doktor: {
    korisnik: { ime: string; prezime: string };
    odjel: { naziv: string };
  };
  pacijent?: {
    korisnik: { ime: string; prezime: string };
  };
  rezervacije: RezervacijaKratka[];
}

interface Paginacija {
  ukupno: number;
  stranica: number;
  limit: number;
  ukupnoStranica: number;
}

interface Raspored {
  id: number;
  idDoktor: number;
  danUSedmici: string;
  vrijemeOd: string;
  vrijemeDo: string;
  datumOd: string;
  datumDo?: string;
  aktivan: boolean;
  doktor: {
    korisnik: { ime: string; prezime: string };
    odjel: { naziv: string };
  };
}

// ── Helperi ───────────────────────────────────────────────────
const ULOGE = ["ADMINISTRATOR", "PACIJENT", "DOKTOR", "MEDICINSKO_OSOBLJE", "VLASNIK"];
const DANI = ["PONEDJELJAK", "UTORAK", "SRIJEDA", "CETVRTAK", "PETAK", "SUBOTA", "NEDJELJA"];
const STATUS_TERMINA = ["SLOBODAN", "ZAKAZAN", "POTVRDJEN", "OTKAZAN"];

function formatDatum(d: string) {
  const datum = new Date(d);
  const dan = String(datum.getDate()).padStart(2, "0");
  const mjesec = String(datum.getMonth() + 1).padStart(2, "0");
  const godina = datum.getFullYear();
  return `${dan}/${mjesec}/${godina}`;
}

function formatVrijeme(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function ulogaBadge(uloga: string) {
  const boje: Record<string, string> = {
    ADMINISTRATOR: "bg-red-100 text-red-700",
    DOKTOR: "bg-blue-100 text-blue-700",
    PACIJENT: "bg-green-100 text-green-700",
    MEDICINSKO_OSOBLJE: "bg-yellow-100 text-yellow-700",
    VLASNIK: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${boje[uloga] ?? "bg-gray-100 text-gray-700"}`}>
      {uloga.replace("_", " ")}
    </span>
  );
}

function statusBadge(status: string) {
  const boje: Record<string, string> = {
    SLOBODAN: "bg-green-100 text-green-700",
    ZAKAZAN: "bg-blue-100 text-blue-700",
    POTVRDJEN: "bg-teal-100 text-teal-700",
    OTKAZAN: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${boje[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

// ── Notifikacija ──────────────────────────────────────────────
function Notifikacija({ poruka, tip, onZatvori }: { poruka: string; tip: "uspjeh" | "greska"; onZatvori: () => void }) {
  useEffect(() => {
    const t = setTimeout(onZatvori, 4000);
    return () => clearTimeout(t);
  }, [onZatvori]);

  return (
    <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
      tip === "uspjeh" ? "bg-green-600 text-white" : "bg-red-600 text-white"
    }`}>
      {poruka}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TAB: KORISNICI
// ══════════════════════════════════════════════════════════════
function TabKorisnici() {
  const [korisnici, setKorisnici] = useState<Korisnik[]>([]);
  const [paginacija, setPaginacija] = useState<Paginacija | null>(null);
  const [stranica, setStranica] = useState(1);
  const [pretraga, setPretraga] = useState("");
  const [filterUloga, setFilterUloga] = useState("");
  const [filterZakljucan, setFilterZakljucan] = useState("");
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState<{ poruka: string; tip: "uspjeh" | "greska" } | null>(null);
  const [editKorisnik, setEditKorisnik] = useState<Korisnik | null>(null);
  const [detaljiId, setDetaljiId] = useState<number | null>(null);
  const [detalji, setDetalji] = useState<Korisnik | null>(null);
  const [ulogaModal, setUlogaModal] = useState<{ id: number; trenutnaUloga: string } | null>(null);
  const [novaUloga, setNovaUloga] = useState("");

  const dohvatiKorisnike = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ stranica: String(stranica), limit: "10" });
      if (pretraga) params.set("pretraga", pretraga);
      if (filterUloga) params.set("uloga", filterUloga);
      if (filterZakljucan) params.set("zakljucan", filterZakljucan);

      const res = await fetch(`${API}/admin/korisnici?${params}`, { headers: authHeader() });
      const data = await res.json();
      if (res.ok) {
        setKorisnici(data.korisnici);
        setPaginacija(data.paginacija);
      }
    } catch {
      setNotif({ poruka: "Greška pri dohvatanju korisnika.", tip: "greska" });
    }
    setLoading(false);
  }, [stranica, pretraga, filterUloga, filterZakljucan]);

  useEffect(() => { dohvatiKorisnike(); }, [dohvatiKorisnike]);

  const dohvatiDetalje = async (id: number) => {
    if (detaljiId === id) { setDetaljiId(null); setDetalji(null); return; }
    const res = await fetch(`${API}/admin/korisnici/${id}`, { headers: authHeader() });
    if (res.ok) { setDetalji(await res.json()); setDetaljiId(id); }
  };

  const blokiraj = async (id: number, blokirano: boolean) => {
    const endpoint = blokirano ? "odblokiraj" : "blokiraj";
    const res = await fetch(`${API}/admin/korisnici/${id}/${endpoint}`, { method: "PATCH", headers: authHeader() });
    const data = await res.json();
    setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
    if (res.ok) dohvatiKorisnike();
  };

  const obrisi = async (id: number) => {
    if (!confirm("Da li ste sigurni da želite obrisati ovog korisnika?")) return;
    const res = await fetch(`${API}/admin/korisnici/${id}`, { method: "DELETE", headers: authHeader() });
    const data = await res.json();
    setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
    if (res.ok) dohvatiKorisnike();
  };

  const sacuvajIzmjene = async () => {
    if (!editKorisnik) return;
    const res = await fetch(`${API}/admin/korisnici/${editKorisnik.id}`, {
      method: "PUT",
      headers: authHeader(),
      body: JSON.stringify({
        ime: editKorisnik.ime,
        prezime: editKorisnik.prezime,
        email: editKorisnik.email,
        brojTelefona: editKorisnik.brojTelefona,
      }),
    });
    const data = await res.json();
    setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
    if (res.ok) { setEditKorisnik(null); dohvatiKorisnike(); }
  };

  const promijeniUlogu = async () => {
    if (!ulogaModal || !novaUloga) return;
    const res = await fetch(`${API}/admin/korisnici/${ulogaModal.id}/uloga`, {
      method: "PATCH",
      headers: authHeader(),
      body: JSON.stringify({ novaUloga }),
    });
    const data = await res.json();
    setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
    if (res.ok) { setUlogaModal(null); setNovaUloga(""); dohvatiKorisnike(); }
  };

  return (
    <div>
      {notif && <Notifikacija poruka={notif.poruka} tip={notif.tip} onZatvori={() => setNotif(null)} />}

      {/* Filteri */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Pretraži po imenu ili emailu..."
          value={pretraga}
          onChange={(e) => { setPretraga(e.target.value); setStranica(1); }}
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:border-purple-500"
        />
        <select
          value={filterUloga}
          onChange={(e) => { setFilterUloga(e.target.value); setStranica(1); }}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="" style={{ background: "#1a1a2e", color: "#fff" }}>Sve uloge</option>
          {ULOGE.map((u) => <option key={u} value={u} style={{ background: "#1a1a2e", color: "#fff" }}>{u.replace("_", " ")}</option>)}
        </select>
        <select
          value={filterZakljucan}
          onChange={(e) => { setFilterZakljucan(e.target.value); setStranica(1); }}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="" style={{ background: "#1a1a2e", color: "#fff" }}>Svi nalozi</option>
          <option value="true" style={{ background: "#1a1a2e", color: "#fff" }}>Blokirani</option>
          <option value="false" style={{ background: "#1a1a2e", color: "#fff" }}>Aktivni</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/60">
            <tr>
              <th className="px-4 py-3 text-left">Ime i prezime</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Uloga</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Registracija</th>
              <th className="px-4 py-3 text-right">Akcije</th>
            </tr>
          </thead>
          <tbody className="text-white/80">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-white/40">Učitavanje...</td></tr>
            ) : korisnici.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-white/40">Nema rezultata.</td></tr>
            ) : (
              korisnici.map((k) => (
                <>
                  <tr key={k.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium">{k.ime} {k.prezime}</td>
                    <td className="px-4 py-3 text-white/60">{k.email}</td>
                    <td className="px-4 py-3">{ulogaBadge(k.uloga)}</td>
                    <td className="px-4 py-3">
                      {k.nalogZakljucan ? (
                        <span className="text-red-400 text-xs font-medium">⛔ Blokiran</span>
                      ) : (
                        <span className="text-green-400 text-xs font-medium">✓ Aktivan</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/50">{formatDatum(k.datumRegistracije)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => dohvatiDetalje(k.id)} className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition-colors">
                          {detaljiId === k.id ? "Zatvori" : "Detalji"}
                        </button>
                        <button onClick={() => setEditKorisnik({ ...k })} className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors">
                          Uredi
                        </button>
                        <button onClick={() => setUlogaModal({ id: k.id, trenutnaUloga: k.uloga })} className="px-2 py-1 text-xs rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors">
                          Uloga
                        </button>
                        <button onClick={() => blokiraj(k.id, k.nalogZakljucan)} className={`px-2 py-1 text-xs rounded transition-colors ${k.nalogZakljucan ? "bg-green-500/20 text-green-300 hover:bg-green-500/30" : "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30"}`}>
                          {k.nalogZakljucan ? "Odblokiraj" : "Blokiraj"}
                        </button>
                        <button onClick={() => obrisi(k.id)} className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors">
                          Obriši
                        </button>
                      </div>
                    </td>
                  </tr>
                  {detaljiId === k.id && detalji && (
                    <tr key={`det-${k.id}`}><td colSpan={6} className="px-4 py-4 bg-white/[0.02]">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div><span className="text-white/40">Telefon:</span> <span className="text-white/80 ml-1">{detalji.brojTelefona || "—"}</span></div>
                        <div><span className="text-white/40">Datum rođenja:</span> <span className="text-white/80 ml-1">{detalji.datumRodjenja ? formatDatum(detalji.datumRodjenja) : "—"}</span></div>
                        <div><span className="text-white/40">Email verifikovan:</span> <span className="text-white/80 ml-1">{detalji.emailVerifikovan ? "Da" : "Ne"}</span></div>
                        <div><span className="text-white/40">Neuspjelih prijava:</span> <span className="text-white/80 ml-1">{detalji.brojNeuspjelihPrijava}</span></div>
                        {detalji.doktorProfile && (
                          <>
                            <div><span className="text-white/40">Specijalizacija:</span> <span className="text-white/80 ml-1">{detalji.doktorProfile.specijalizacija}</span></div>
                            <div><span className="text-white/40">Odjel:</span> <span className="text-white/80 ml-1">{detalji.doktorProfile.odjel?.naziv}</span></div>
                            <div><span className="text-white/40">Br. licence:</span> <span className="text-white/80 ml-1">{detalji.doktorProfile.brojLicence}</span></div>
                            <div><span className="text-white/40">Trajanje pregleda:</span> <span className="text-white/80 ml-1">{detalji.doktorProfile.trajanjePregleda} min</span></div>
                          </>
                        )}
                        {detalji.osobljeProfile && (
                          <>
                            <div><span className="text-white/40">Pozicija:</span> <span className="text-white/80 ml-1">{detalji.osobljeProfile.pozicija}</span></div>
                            <div><span className="text-white/40">Odjel:</span> <span className="text-white/80 ml-1">{detalji.osobljeProfile.odjel?.naziv}</span></div>
                          </>
                        )}
                        {detalji.pacijentProfile && (
                          <div><span className="text-white/40">Hronični bolesnik:</span> <span className="text-white/80 ml-1">{detalji.pacijentProfile.hronicniBolesnik ? "Da" : "Ne"}</span></div>
                        )}
                      </div>
                    </td></tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginacija */}
      {paginacija && paginacija.ukupnoStranica > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={stranica === 1}
            onClick={() => setStranica(stranica - 1)}
            className="px-3 py-1 rounded bg-white/10 text-sm disabled:opacity-30 hover:bg-white/20 transition-colors"
          >
            ← Prethodna
          </button>
          <span className="px-3 py-1 text-sm text-white/50">
            {stranica} / {paginacija.ukupnoStranica} ({paginacija.ukupno} ukupno)
          </span>
          <button
            disabled={stranica === paginacija.ukupnoStranica}
            onClick={() => setStranica(stranica + 1)}
            className="px-3 py-1 rounded bg-white/10 text-sm disabled:opacity-30 hover:bg-white/20 transition-colors"
          >
            Sljedeća →
          </button>
        </div>
      )}

      {/* Edit modal */}
      {editKorisnik && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center" onClick={() => setEditKorisnik(null)}>
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">Uredi korisnika</h3>
            <div className="space-y-3">
              <input value={editKorisnik.ime} onChange={(e) => setEditKorisnik({ ...editKorisnik, ime: e.target.value })} placeholder="Ime" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500" />
              <input value={editKorisnik.prezime} onChange={(e) => setEditKorisnik({ ...editKorisnik, prezime: e.target.value })} placeholder="Prezime" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500" />
              <input value={editKorisnik.email} onChange={(e) => setEditKorisnik({ ...editKorisnik, email: e.target.value })} placeholder="Email" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500" />
              <input value={editKorisnik.brojTelefona ?? ""} onChange={(e) => setEditKorisnik({ ...editKorisnik, brojTelefona: e.target.value })} placeholder="Telefon" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setEditKorisnik(null)} className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white transition-colors">Odustani</button>
              <button onClick={sacuvajIzmjene} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors">Sačuvaj</button>
            </div>
          </div>
        </div>
      )}

      {/* Uloga modal */}
      {ulogaModal && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center" onClick={() => setUlogaModal(null)}>
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-2">Promijeni ulogu</h3>
            <p className="text-xs text-white/40 mb-4">Trenutna uloga: {ulogaModal.trenutnaUloga}</p>
            <select value={novaUloga} onChange={(e) => setNovaUloga(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 mb-4">
              <option value="" style={{ background: "#1a1a2e", color: "#fff" }}>Odaberi ulogu</option>
              {ULOGE.filter((u) => u !== ulogaModal.trenutnaUloga).map((u) => <option key={u} value={u} style={{ background: "#1a1a2e", color: "#fff" }}>{u.replace("_", " ")}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setUlogaModal(null)} className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white transition-colors">Odustani</button>
              <button onClick={promijeniUlogu} disabled={!novaUloga} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors disabled:opacity-40">Promijeni</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TAB: RASPORED DOKTORA
// ══════════════════════════════════════════════════════════════
function TabRaspored() {
  const [rasporedi, setRasporedi] = useState<Raspored[]>([]);
  const [doktori, setDoktori] = useState<{ id: number; ime: string; prezime: string; specijalizacija: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState<{ poruka: string; tip: "uspjeh" | "greska" } | null>(null);
  const [showForma, setShowForma] = useState(false);
  const [forma, setForma] = useState({ idDoktor: "", danUSedmici: "PONEDJELJAK", vrijemeOd: "08:00", vrijemeDo: "16:00", datumOd: "" });

  const dohvatiRasporede = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/rasporedi`, { headers: authHeader() });
      if (res.ok) setRasporedi(await res.json());
    } catch (error) {
      console.error("Greška pri dohvatanju rasporeda:", error);
      setNotif({ poruka: "Greška pri dohvatanju rasporeda.", tip: "greska" });
    }
    setLoading(false);
  }, []);

  const dohvatiDoktore = useCallback(async () => {
    try {
      const res = await fetch(`${API}/doktori`, { headers: authHeader() });
      if (res.ok) {
        const data = await res.json();
        setDoktori(data);
      }
    } catch (error) {
      console.error("Greška pri dohvatanju doktora:", error);
    }
  }, []);

  useEffect(() => {
    dohvatiRasporede();
    dohvatiDoktore();
  }, [dohvatiRasporede, dohvatiDoktore]);

  const odabraniDoktor = doktori.find((d) => String(d.id) === forma.idDoktor);

  const kreirajRaspored = async () => {
    if (!forma.idDoktor || !forma.datumOd) {
      setNotif({ poruka: "Odaberite doktora i datum početka.", tip: "greska" });
      return;
    }

    const res = await fetch(`${API}/admin/rasporedi`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({ ...forma, idDoktor: Number(forma.idDoktor) }),
    });
    const data = await res.json();
    setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
    if (res.ok) {
      setShowForma(false);
      setForma({ idDoktor: "", danUSedmici: "PONEDJELJAK", vrijemeOd: "08:00", vrijemeDo: "16:00", datumOd: "" });
      dohvatiRasporede();
    }
  };

  const deaktiviraj = async (id: number) => {
    const res = await fetch(`${API}/admin/rasporedi/${id}`, { method: "DELETE", headers: authHeader() });
    const data = await res.json();
    setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
    if (res.ok) dohvatiRasporede();
  };

  const grupisano = rasporedi.reduce<Record<string, Raspored[]>>((acc, r) => {
    const key = `${r.doktor.korisnik.ime} ${r.doktor.korisnik.prezime}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div>
      {notif && <Notifikacija poruka={notif.poruka} tip={notif.tip} onZatvori={() => setNotif(null)} />}

      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-white/50">{rasporedi.length} rasporeda ukupno</p>
        <button onClick={() => setShowForma(!showForma)} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors">
          {showForma ? "Zatvori" : "+ Novi raspored"}
        </button>
      </div>

      {showForma && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-5">
          <h3 className="text-sm font-semibold text-white mb-3">Kreiraj raspored</h3>

          {/* Doktor dropdown + prikaz odabranog */}
          <div className="mb-3">
            <label className="text-xs text-white/40 mb-1 block">Doktor</label>
            <select
              value={forma.idDoktor}
              onChange={(e) => setForma({ ...forma, idDoktor: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="" style={{ background: "#1a1a2e", color: "#fff" }}>— Odaberite doktora —</option>
              {doktori.map((d) => (
                <option key={d.id} value={d.id} style={{ background: "#1a1a2e", color: "#fff" }}>
                  Dr. {d.ime} {d.prezime} — {d.specijalizacija}
                </option>
              ))}
            </select>
            {odabraniDoktor && (
              <p className="text-xs text-purple-300 mt-1">
                Odabrano: Dr. {odabraniDoktor.ime} {odabraniDoktor.prezime} ({odabraniDoktor.specijalizacija})
              </p>
            )}
          </div>

          {/* Ostala polja */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Dan</label>
              <select value={forma.danUSedmici} onChange={(e) => setForma({ ...forma, danUSedmici: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500">
                {DANI.map((d) => <option key={d} value={d} style={{ background: "#1a1a2e", color: "#fff" }}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Od</label>
              <input type="time" value={forma.vrijemeOd} onChange={(e) => setForma({ ...forma, vrijemeOd: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Do</label>
              <input type="time" value={forma.vrijemeDo} onChange={(e) => setForma({ ...forma, vrijemeDo: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Važi od</label>
              <input type="date" value={forma.datumOd} onChange={(e) => setForma({ ...forma, datumOd: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
          </div>

          <button
            onClick={kreirajRaspored}
            disabled={!forma.idDoktor || !forma.datumOd}
            className="mt-3 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Sačuvaj raspored
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-center text-white/40 py-8">Učitavanje...</p>
      ) : Object.keys(grupisano).length === 0 ? (
        <p className="text-center text-white/40 py-8">Nema rasporeda.</p>
      ) : (
        Object.entries(grupisano).map(([doktor, items]) => (
          <div key={doktor} className="mb-5">
            <h3 className="text-sm font-semibold text-white mb-2">
              Dr. {doktor} <span className="text-white/40 font-normal">— {items[0]?.doktor.odjel.naziv}</span>
            </h3>
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-white/60">
                  <tr>
                    <th className="px-4 py-2 text-left">Dan</th>
                    <th className="px-4 py-2 text-left">Od</th>
                    <th className="px-4 py-2 text-left">Do</th>
                    <th className="px-4 py-2 text-left">Važi od</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-right">Akcija</th>
                  </tr>
                </thead>
                <tbody className="text-white/80">
                  {items.map((r) => (
                    <tr key={r.id} className="border-t border-white/5">
                      <td className="px-4 py-2">{r.danUSedmici}</td>
                      <td className="px-4 py-2">{new Date(r.vrijemeOd).toISOString().slice(11, 16)}</td>
                      <td className="px-4 py-2">{new Date(r.vrijemeDo).toISOString().slice(11, 16)}</td>
                      <td className="px-4 py-2 text-white/50">{formatDatum(r.datumOd)}</td>
                      <td className="px-4 py-2">
                        {r.aktivan
                          ? <span className="text-green-400 text-xs">Aktivan</span>
                          : <span className="text-red-400 text-xs">Neaktivan</span>}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {r.aktivan && (
                          <button onClick={() => deaktiviraj(r.id)} className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors">
                            Deaktiviraj
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TAB: TERMINI
// ══════════════════════════════════════════════════════════════
function TabTermini() {
  const [termini, setTermini] = useState<Termin[]>([]);
  const [paginacija, setPaginacija] = useState<Paginacija | null>(null);
  const [stranica, setStranica] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [datumOd, setDatumOd] = useState("");
  const [datumDo, setDatumDo] = useState("");
  const [loading, setLoading] = useState(false);

  const dohvatiTermine = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ stranica: String(stranica), limit: "15" });
      if (filterStatus) params.set("status", filterStatus);
      if (datumOd) params.set("datumOd", datumOd);
      if (datumDo) params.set("datumDo", datumDo);

      const res = await fetch(`${API}/admin/termini?${params}`, { headers: authHeader() });
      const data = await res.json();
      if (res.ok) {
        setTermini(data.termini);
        setPaginacija(data.paginacija);
      }
    } catch (error) {
        console.error("Greška pri dohvatanju termina:", error);
    }
    setLoading(false);
  }, [stranica, filterStatus, datumOd, datumDo]);

  useEffect(() => { dohvatiTermine(); }, [dohvatiTermine]);

  return (
    <div>
      {/* Filteri */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setStranica(1); }} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500">
          <option value="" style={{ background: "#1a1a2e", color: "#fff" }}>Svi statusi</option>
          {STATUS_TERMINA.map((s) => <option key={s} value={s} style={{ background: "#1a1a2e", color: "#fff" }}>{s}</option>)}
        </select>
        <input type="date" value={datumOd} onChange={(e) => { setDatumOd(e.target.value); setStranica(1); }} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500" />
        <input type="date" value={datumDo} onChange={(e) => { setDatumDo(e.target.value); setStranica(1); }} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500" />
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/60">
            <tr>
              <th className="px-4 py-3 text-left">Datum</th>
              <th className="px-4 py-3 text-left">Vrijeme</th>
              <th className="px-4 py-3 text-left">Doktor</th>
              <th className="px-4 py-3 text-left">Odjel</th>
              <th className="px-4 py-3 text-left">Pacijent</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Hitnost</th>
            </tr>
          </thead>
          <tbody className="text-white/80">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-white/40">Učitavanje...</td></tr>
            ) : termini.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-white/40">Nema termina.</td></tr>
            ) : (
              termini.map((t) => (
                <tr key={t.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">{formatDatum(t.datum)}</td>
                  <td className="px-4 py-3">{formatVrijeme(t.vrijeme)}</td>
                  <td className="px-4 py-3">Dr. {t.doktor.korisnik.ime} {t.doktor.korisnik.prezime}</td>
                  <td className="px-4 py-3 text-white/50">{t.doktor.odjel.naziv}</td>
                  <td className="px-4 py-3">
                    {t.pacijent ? `${t.pacijent.korisnik.ime} ${t.pacijent.korisnik.prezime}` : <span className="text-white/30">—</span>}
                  </td>
                  <td className="px-4 py-3">{statusBadge(t.status)}</td>
                  <td className="px-4 py-3">
                    {t.rezervacije.some((r) => r.hitnost) && <span className="text-red-400 text-xs font-medium">⚠ HITNO</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {paginacija && paginacija.ukupnoStranica > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={stranica === 1} onClick={() => setStranica(stranica - 1)} className="px-3 py-1 rounded bg-white/10 text-sm disabled:opacity-30 hover:bg-white/20 transition-colors">← Prethodna</button>
          <span className="px-3 py-1 text-sm text-white/50">{stranica} / {paginacija.ukupnoStranica}</span>
          <button disabled={stranica === paginacija.ukupnoStranica} onClick={() => setStranica(stranica + 1)} className="px-3 py-1 rounded bg-white/10 text-sm disabled:opacity-30 hover:bg-white/20 transition-colors">Sljedeća →</button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  GLAVNI ADMIN PANEL
// ══════════════════════════════════════════════════════════════
type Tab = "korisnici" | "raspored" | "termini";

export default function AdminPanel() {
  const [aktivniTab, setAktivniTab] = useState<Tab>("korisnici");
  const navigate = useNavigate();

  const tabovi: { key: Tab; label: string; opis: string }[] = [
    { key: "korisnici", label: "Korisnici", opis: "Upravljanje nalozima, ulogama i pristupom" },
    { key: "raspored", label: "Raspored", opis: "Radno vrijeme i smjene doktora" },
    { key: "termini", label: "Termini", opis: "Pregled svih zakazanih termina" },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0f0f1a]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <p className="text-xs text-white/40 mt-0.5">Upravljanje sistemom zdravstvene ustanove</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-lg text-sm text-white/60 border border-white/10 hover:bg-white/5 transition-colors"
          >
            ← Nazad
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tab navigacija */}
        <div className="flex gap-2 mb-6">
          {tabovi.map((t) => (
            <button
              key={t.key}
              onClick={() => setAktivniTab(t.key)}
              className={`px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                aktivniTab === t.key
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              <div>{t.label}</div>
              <div className={`text-[10px] mt-0.5 ${aktivniTab === t.key ? "text-purple-200" : "text-white/30"}`}>
                {t.opis}
              </div>
            </button>
          ))}
        </div>

        {/* Tab sadržaj */}
        {aktivniTab === "korisnici" && <TabKorisnici />}
        {aktivniTab === "raspored" && <TabRaspored />}
        {aktivniTab === "termini" && <TabTermini />}
      </div>
    </div>
  );
}