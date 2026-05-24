import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";
const API = `${BASE_URL}/api`;

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
  aktivan: boolean;
  doktor: {
    korisnik: { ime: string; prezime: string };
    odjel: { naziv: string };
  };
}

interface RasporedOsoblja {
  id: number;
  idOsoblje: number;
  danUSedmici: string;
  vrijemeOd: string;
  vrijemeDo: string;
  aktivan: boolean;
  osoblje: {
    pozicija: string;
    korisnik: { ime: string; prezime: string };
    odjel: { naziv: string };
  };
}

interface Izuzetak {
  id: number;
  idDoktor: number;
  datum: string;
  vrijemeOd: string | null;
  vrijemeDo: string | null;
  razlog: string;
  napomena: string | null;
  doktor: { korisnik: { ime: string; prezime: string } };
}

interface Odjel {
  id: number;
  naziv: string;
}

interface OdjelDetalj {
  id: number;
  naziv: string;
  opis: string | null;
  doktori: { id: number; korisnik: { ime: string; prezime: string } }[];
  osoblje: { id: number; pozicija: string; korisnik: { ime: string; prezime: string } }[];
}

interface AnalitikaOdjel {
  naziv: string;
  slobodni: number;
  zakazani: number;
  otkazani: number;
  ukupno: number;
}

interface AnalitikaDoktor {
  ime: string;
  prezime: string;
  odjel: string;
  slobodni: number;
  zakazani: number;
  otkazani: number;
  ukupno: number;
}

interface AnalitikaData {
  terminDanas: number;
  terminSedmica: number;
  ukupnoMjesec: number;
  otkazaniMjesec: number;
  propusteniMjesec: number;
  procenatOtkazanih: number;
  prosjecnoVrijemeCekanja: number | null;
  poOdjelu: AnalitikaOdjel[];
  poDoktoru: AnalitikaDoktor[];
}

// ── Helperi ───────────────────────────────────────────────────
const ULOGE = ["ADMINISTRATOR", "PACIJENT", "DOKTOR", "MEDICINSKO_OSOBLJE", "VLASNIK"];
const DANI = ["PONEDJELJAK", "UTORAK", "SRIJEDA", "CETVRTAK", "PETAK", "SUBOTA", "NEDJELJA"];
const STATUS_TERMINA = ["SLOBODAN", "ZAKAZAN", "POTVRDJEN", "OTKAZAN"];
const NO_SPIN = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

function formatDatum(d: string) {
  const datum = new Date(d);
  const dan = String(datum.getDate()).padStart(2, "0");
  const mjesec = String(datum.getMonth() + 1).padStart(2, "0");
  const godina = datum.getFullYear();
  return `${dan}/${mjesec}/${godina}`;
}

function formatVrijeme(val: number | string) {
  if (typeof val === "number") {
    const h = Math.floor(val / 60);
    const m = val % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  return new Date(val).toISOString().slice(11, 16);
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
  const meId: number | null = (() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      return (JSON.parse(atob(token.split(".")[1])) as { id: number }).id;
    } catch { return null; }
  })();

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
  const [odjeli, setOdjeli] = useState<Odjel[]>([]);
  const [dodatniPodaci, setDodatniPodaci] = useState({
    specijalizacija: "", brojLicence: "", idOdjela: "",
    pozicija: "", idOdjel: "", radnoVrijeme: "8",
  });
  const [potvrda, setPotvrda] = useState<{ poruka: string; onPotvrdi: () => void } | null>(null);
  const [odabrani, setOdabrani] = useState<Set<number>>(new Set());

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

  useEffect(() => {
    fetch(`${API}/odjeli`)
      .then(r => r.json())
      .then(data => Array.isArray(data) ? setOdjeli(data.filter((o: Odjel) => o.naziv.toLowerCase() !== "testni odjel")) : setOdjeli([]))
      .catch(() => {});
  }, []);

  const dohvatiDetalje = async (id: number) => {
    if (detaljiId === id) { setDetaljiId(null); setDetalji(null); return; }
    const res = await fetch(`${API}/admin/korisnici/${id}`, { headers: authHeader() });
    if (res.ok) { setDetalji(await res.json()); setDetaljiId(id); }
  };

  const blokiraj = (id: number, blokirano: boolean) => {
    const akcija = blokirano ? "odblokirati" : "blokirati";
    setPotvrda({
      poruka: `Da li ste sigurni da želite ${akcija} ovog korisnika?`,
      onPotvrdi: async () => {
        const endpoint = blokirano ? "odblokiraj" : "blokiraj";
        const res = await fetch(`${API}/admin/korisnici/${id}/${endpoint}`, { method: "PATCH", headers: authHeader() });
        const data = await res.json();
        setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
        if (res.ok) dohvatiKorisnike();
      },
    });
  };

  const obrisi = (id: number) => {
    setPotvrda({
      poruka: "Da li ste sigurni da želite obrisati ovog korisnika? Ova akcija je nepovratna.",
      onPotvrdi: async () => {
        const res = await fetch(`${API}/admin/korisnici/${id}`, { method: "DELETE", headers: authHeader() });
        const data = await res.json();
        setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
        if (res.ok) { dohvatiKorisnike(); setOdabrani(new Set()); }
      },
    });
  };

  const bulkBlokiraj = () => {
    const ids = [...odabrani].filter(id => id !== meId);
    if (!ids.length) return;
    setPotvrda({
      poruka: `Da li ste sigurni da želite blokirati ${ids.length} korisnika?`,
      onPotvrdi: async () => {
        await Promise.allSettled(ids.map(id => fetch(`${API}/admin/korisnici/${id}/blokiraj`, { method: "PATCH", headers: authHeader() })));
        setOdabrani(new Set()); dohvatiKorisnike();
        setNotif({ poruka: `${ids.length} korisnika blokirano.`, tip: "uspjeh" });
      },
    });
  };

  const bulkOdblokir = () => {
    const ids = [...odabrani].filter(id => id !== meId);
    if (!ids.length) return;
    setPotvrda({
      poruka: `Da li ste sigurni da želite odblokirati ${ids.length} korisnika?`,
      onPotvrdi: async () => {
        await Promise.allSettled(ids.map(id => fetch(`${API}/admin/korisnici/${id}/odblokiraj`, { method: "PATCH", headers: authHeader() })));
        setOdabrani(new Set()); dohvatiKorisnike();
        setNotif({ poruka: `${ids.length} korisnika odblokirano.`, tip: "uspjeh" });
      },
    });
  };

  const bulkObrisi = () => {
    const ids = [...odabrani].filter(id => id !== meId);
    if (!ids.length) return;
    setPotvrda({
      poruka: `Da li ste sigurni da želite obrisati ${ids.length} korisnika? Ova akcija je nepovratna.`,
      onPotvrdi: async () => {
        await Promise.allSettled(ids.map(id => fetch(`${API}/admin/korisnici/${id}`, { method: "DELETE", headers: authHeader() })));
        setOdabrani(new Set()); dohvatiKorisnike();
        setNotif({ poruka: `${ids.length} korisnika obrisano.`, tip: "uspjeh" });
      },
    });
  };

  const toggleOdabrani = (id: number) => {
    setOdabrani(prev => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  };
  const sviOdabrani = korisnici.length > 0 && korisnici.every(k => odabrani.has(k.id));
  const toggleSve = () => {
    if (sviOdabrani) {
      setOdabrani(prev => { const s = new Set(prev); korisnici.forEach(k => s.delete(k.id)); return s; });
    } else {
      setOdabrani(prev => { const s = new Set(prev); korisnici.forEach(k => s.add(k.id)); return s; });
    }
  };

  const sacuvajIzmjene = async () => {
    if (!editKorisnik) return;
    const gresake: string[] = [];
    if (editKorisnik.datumRodjenja) {
      const d = new Date(editKorisnik.datumRodjenja);
      if (isNaN(d.getTime())) gresake.push("Datum rođenja nije validan.");
      else if (d.getFullYear() < 1900) gresake.push("Datum rođenja ne može biti prije 1900.");
      else if (d > new Date()) gresake.push("Datum rođenja ne može biti u budućnosti.");
    }
    if (editKorisnik.doktorProfile) {
      if (editKorisnik.doktorProfile.trajanjePregleda < 1) gresake.push("Trajanje pregleda mora biti pozitivan broj.");
      if (editKorisnik.doktorProfile.brojLicence < 1) gresake.push("Broj licence mora biti pozitivan broj.");
    }
    if (editKorisnik.osobljeProfile) {
      if (editKorisnik.osobljeProfile.radnoVrijeme < 1 || editKorisnik.osobljeProfile.radnoVrijeme > 24)
        gresake.push("Radno vrijeme mora biti između 1 i 24 sata.");
    }
    if (gresake.length > 0) { setNotif({ poruka: gresake.join(" "), tip: "greska" }); return; }

    const body: Record<string, unknown> = {
      ime: editKorisnik.ime,
      prezime: editKorisnik.prezime,
      email: editKorisnik.email,
      brojTelefona: editKorisnik.brojTelefona,
      datumRodjenja: editKorisnik.datumRodjenja || null,
    };
    if (editKorisnik.uloga === "DOKTOR" && editKorisnik.doktorProfile) {
      body.profilPodaci = {
        specijalizacija: editKorisnik.doktorProfile.specijalizacija,
        brojLicence: editKorisnik.doktorProfile.brojLicence,
        idOdjela: editKorisnik.doktorProfile.odjel?.id,
        trajanjePregleda: editKorisnik.doktorProfile.trajanjePregleda,
      };
    } else if (editKorisnik.uloga === "MEDICINSKO_OSOBLJE" && editKorisnik.osobljeProfile) {
      body.profilPodaci = {
        pozicija: editKorisnik.osobljeProfile.pozicija,
        idOdjel: editKorisnik.osobljeProfile.odjel?.id,
        radnoVrijeme: editKorisnik.osobljeProfile.radnoVrijeme,
      };
    } else if (editKorisnik.uloga === "PACIJENT" && editKorisnik.pacijentProfile) {
      body.profilPodaci = { hronicniBolesnik: editKorisnik.pacijentProfile.hronicniBolesnik };
    }
    const res = await fetch(`${API}/admin/korisnici/${editKorisnik.id}`, {
      method: "PUT", headers: authHeader(), body: JSON.stringify(body),
    });
    const data = await res.json();
    setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
    if (res.ok) { setEditKorisnik(null); dohvatiKorisnike(); }
  };

  const resetDodatni = () => setDodatniPodaci({ specijalizacija: "", brojLicence: "", idOdjela: "", pozicija: "", idOdjel: "", radnoVrijeme: "8" });

  const otvoriiEditModal = async (korisnikId: number) => {
    const res = await fetch(`${API}/admin/korisnici/${korisnikId}`, { headers: authHeader() });
    if (res.ok) setEditKorisnik(await res.json());
  };

  const promijeniUlogu = async () => {
    if (!ulogaModal || !novaUloga) return;

    if (novaUloga === "DOKTOR" && (!dodatniPodaci.specijalizacija || !dodatniPodaci.brojLicence || !dodatniPodaci.idOdjela)) {
      setNotif({ poruka: "Za doktora su obavezni: specijalizacija, broj licence i odjel.", tip: "greska" });
      return;
    }
    if (novaUloga === "MEDICINSKO_OSOBLJE" && (!dodatniPodaci.pozicija || !dodatniPodaci.idOdjel)) {
      setNotif({ poruka: "Za medicinsko osoblje su obavezni: pozicija i odjel.", tip: "greska" });
      return;
    }

    const body: Record<string, unknown> = { novaUloga };
    if (novaUloga === "DOKTOR") {
      body.dodatniPodaci = {
        specijalizacija: dodatniPodaci.specijalizacija,
        brojLicence: Number(dodatniPodaci.brojLicence),
        idOdjela: Number(dodatniPodaci.idOdjela),
      };
    } else if (novaUloga === "MEDICINSKO_OSOBLJE") {
      body.dodatniPodaci = {
        pozicija: dodatniPodaci.pozicija,
        idOdjel: Number(dodatniPodaci.idOdjel),
        radnoVrijeme: Number(dodatniPodaci.radnoVrijeme) || 8,
      };
    }

    const res = await fetch(`${API}/admin/korisnici/${ulogaModal.id}/uloga`, {
      method: "PATCH",
      headers: authHeader(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
    if (res.ok) { setUlogaModal(null); setNovaUloga(""); resetDodatni(); dohvatiKorisnike(); }
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
        <select value={filterUloga} onChange={(e) => { setFilterUloga(e.target.value); setStranica(1); }} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500">
          <option value="" style={{ background: "#1a1a2e", color: "#fff" }}>Sve uloge</option>
          {ULOGE.map((u) => <option key={u} value={u} style={{ background: "#1a1a2e", color: "#fff" }}>{u.replace("_", " ")}</option>)}
        </select>
        <select value={filterZakljucan} onChange={(e) => { setFilterZakljucan(e.target.value); setStranica(1); }} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500">
          <option value="" style={{ background: "#1a1a2e", color: "#fff" }}>Svi nalozi</option>
          <option value="true" style={{ background: "#1a1a2e", color: "#fff" }}>Blokirani</option>
          <option value="false" style={{ background: "#1a1a2e", color: "#fff" }}>Aktivni</option>
        </select>
      </div>

      {/* Bulk akcije */}
      {odabrani.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <span className="text-sm text-purple-300 font-medium">{odabrani.size} odabrano</span>
          <div className="w-px h-4 bg-white/20" />
          <button onClick={bulkBlokiraj} className="px-3 py-1 text-xs rounded bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition-colors">Blokiraj odabrane</button>
          <button onClick={bulkOdblokir} className="px-3 py-1 text-xs rounded bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors">Odblokiraj odabrane</button>
          <button onClick={bulkObrisi} className="px-3 py-1 text-xs rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors">Obriši odabrane</button>
          <button onClick={() => setOdabrani(new Set())} className="ml-auto text-xs text-white/40 hover:text-white transition-colors">✕ Poništi</button>
        </div>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/60">
            <tr>
              <th className="px-3 py-3 w-8">
                <input type="checkbox" checked={sviOdabrani} onChange={toggleSve} className="w-4 h-4 accent-purple-500 cursor-pointer" />
              </th>
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
              <tr><td colSpan={7} className="px-4 py-8 text-center text-white/40">Učitavanje...</td></tr>
            ) : korisnici.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-white/40">Nema rezultata.</td></tr>
            ) : (
              korisnici.map((k) => (
                <>
                  <tr key={k.id} className={`border-t border-white/5 transition-colors ${odabrani.has(k.id) ? "bg-purple-500/5" : "hover:bg-white/5"}`}>
                    <td className="px-3 py-3">
                      {k.id !== meId && <input type="checkbox" checked={odabrani.has(k.id)} onChange={() => toggleOdabrani(k.id)} className="w-4 h-4 accent-purple-500 cursor-pointer" />}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {k.ime} {k.prezime}
                      {k.id === meId && <span className="ml-2 text-[10px] text-purple-400/70 font-normal">(vi)</span>}
                    </td>
                    <td className="px-4 py-3 text-white/60">{k.email}</td>
                    <td className="px-4 py-3">{ulogaBadge(k.uloga)}</td>
                    <td className="px-4 py-3">
                      {k.nalogZakljucan
                        ? <span className="text-red-400 text-xs font-medium">⛔ Blokiran</span>
                        : <span className="text-green-400 text-xs font-medium">✓ Aktivan</span>}
                    </td>
                    <td className="px-4 py-3 text-white/50">{formatDatum(k.datumRegistracije)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => dohvatiDetalje(k.id)} className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition-colors">{detaljiId === k.id ? "Zatvori" : "Detalji"}</button>
                        <button onClick={() => otvoriiEditModal(k.id)} className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors">Uredi</button>
                        {k.id !== meId && <button onClick={() => { setUlogaModal({ id: k.id, trenutnaUloga: k.uloga }); setNovaUloga(""); resetDodatni(); }} className="px-2 py-1 text-xs rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors">Uloga</button>}
                        {k.id !== meId && <button onClick={() => blokiraj(k.id, k.nalogZakljucan)} className={`px-2 py-1 text-xs rounded transition-colors ${k.nalogZakljucan ? "bg-green-500/20 text-green-300 hover:bg-green-500/30" : "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30"}`}>{k.nalogZakljucan ? "Odblokiraj" : "Blokiraj"}</button>}
                        {k.id !== meId && <button onClick={() => obrisi(k.id)} className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors">Obriši</button>}
                      </div>
                    </td>
                  </tr>
                  {detaljiId === k.id && detalji && (
                    <tr key={`det-${k.id}`}><td colSpan={7} className="px-4 py-4 bg-white/[0.02]">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div><span className="text-white/40">Telefon:</span> <span className="text-white/80 ml-1">{detalji.brojTelefona || "—"}</span></div>
                        <div><span className="text-white/40">Datum rođenja:</span> <span className="text-white/80 ml-1">{detalji.datumRodjenja ? formatDatum(detalji.datumRodjenja) : "—"}</span></div>
                        <div><span className="text-white/40">Email verifikovan:</span> <span className="text-white/80 ml-1">{detalji.emailVerifikovan ? "Da" : "Ne"}</span></div>
                        <div><span className="text-white/40">Neuspjelih prijava:</span> <span className="text-white/80 ml-1">{detalji.brojNeuspjelihPrijava}</span></div>
                        {detalji.doktorProfile && (<>
                          <div><span className="text-white/40">Specijalizacija:</span> <span className="text-white/80 ml-1">{detalji.doktorProfile.specijalizacija}</span></div>
                          <div><span className="text-white/40">Odjel:</span> <span className="text-white/80 ml-1">{detalji.doktorProfile.odjel?.naziv}</span></div>
                          <div><span className="text-white/40">Br. licence:</span> <span className="text-white/80 ml-1">{detalji.doktorProfile.brojLicence}</span></div>
                          <div><span className="text-white/40">Trajanje pregleda:</span> <span className="text-white/80 ml-1">{detalji.doktorProfile.trajanjePregleda} min</span></div>
                        </>)}
                        {detalji.osobljeProfile && (<>
                          <div><span className="text-white/40">Pozicija:</span> <span className="text-white/80 ml-1">{detalji.osobljeProfile.pozicija}</span></div>
                          <div><span className="text-white/40">Odjel:</span> <span className="text-white/80 ml-1">{detalji.osobljeProfile.odjel?.naziv}</span></div>
                        </>)}
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
          <button disabled={stranica === 1} onClick={() => setStranica(stranica - 1)} className="px-3 py-1 rounded bg-white/10 text-sm disabled:opacity-30 hover:bg-white/20 transition-colors">← Prethodna</button>
          <span className="px-3 py-1 text-sm text-white/50">{stranica} / {paginacija.ukupnoStranica} ({paginacija.ukupno} ukupno)</span>
          <button disabled={stranica === paginacija.ukupnoStranica} onClick={() => setStranica(stranica + 1)} className="px-3 py-1 rounded bg-white/10 text-sm disabled:opacity-30 hover:bg-white/20 transition-colors">Sljedeća →</button>
        </div>
      )}

      {/* Edit modal */}
      {editKorisnik && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center" onClick={() => setEditKorisnik(null)}>
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">Uredi korisnika</h3>

            <div className="space-y-3 mb-4">
              <p className="text-xs text-white/40 font-medium uppercase tracking-wide">Osnovni podaci</p>
              <input value={editKorisnik.ime} onChange={(e) => setEditKorisnik({ ...editKorisnik, ime: e.target.value })} placeholder="Ime" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500" />
              <input value={editKorisnik.prezime} onChange={(e) => setEditKorisnik({ ...editKorisnik, prezime: e.target.value })} placeholder="Prezime" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500" />
              <input value={editKorisnik.email} onChange={(e) => setEditKorisnik({ ...editKorisnik, email: e.target.value })} placeholder="Email" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500" />
              <input value={editKorisnik.brojTelefona ?? ""} onChange={(e) => setEditKorisnik({ ...editKorisnik, brojTelefona: e.target.value })} placeholder="Telefon" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500" />
              <div>
                <label className="text-xs text-white/40 mb-1 block">Datum rođenja</label>
                <input
                  type="date"
                  value={editKorisnik.datumRodjenja ? editKorisnik.datumRodjenja.split("T")[0] : ""}
                  min="1900-01-01"
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setEditKorisnik({ ...editKorisnik, datumRodjenja: e.target.value || undefined })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {editKorisnik.uloga === "DOKTOR" && editKorisnik.doktorProfile && (
              <div className="space-y-3 mb-4 border border-blue-500/30 rounded-lg p-3 bg-blue-500/5">
                <p className="text-xs text-blue-300 font-medium">Podaci o doktoru</p>
                <input
                  value={editKorisnik.doktorProfile.specijalizacija}
                  onChange={(e) => setEditKorisnik({ ...editKorisnik, doktorProfile: { ...editKorisnik.doktorProfile!, specijalizacija: e.target.value } })}
                  placeholder="Specijalizacija"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                />
                <input
                  value={editKorisnik.doktorProfile.brojLicence}
                  onChange={(e) => setEditKorisnik({ ...editKorisnik, doktorProfile: { ...editKorisnik.doktorProfile!, brojLicence: Number(e.target.value) } })}
                  placeholder="Broj licence" type="number"
                  className={`w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 ${NO_SPIN}`}
                />
                <select
                  value={editKorisnik.doktorProfile.odjel?.id ?? ""}
                  onChange={(e) => { const sel = odjeli.find(o => o.id === Number(e.target.value)); setEditKorisnik({ ...editKorisnik, doktorProfile: { ...editKorisnik.doktorProfile!, odjel: sel ? { id: sel.id, naziv: sel.naziv } : null } }); }}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="" style={{ background: "#1a1a2e", color: "#fff" }}>— Odaberi odjel —</option>
                  {odjeli.map(o => <option key={o.id} value={o.id} style={{ background: "#1a1a2e", color: "#fff" }}>{o.naziv}</option>)}
                </select>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Trajanje pregleda (min)</label>
                  <input
                    value={editKorisnik.doktorProfile.trajanjePregleda}
                    onChange={(e) => setEditKorisnik({ ...editKorisnik, doktorProfile: { ...editKorisnik.doktorProfile!, trajanjePregleda: Number(e.target.value) } })}
                    type="number" min="1" max="120"
                    className={`w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 ${NO_SPIN}`}
                  />
                </div>
              </div>
            )}

            {editKorisnik.uloga === "MEDICINSKO_OSOBLJE" && editKorisnik.osobljeProfile && (
              <div className="space-y-3 mb-4 border border-yellow-500/30 rounded-lg p-3 bg-yellow-500/5">
                <p className="text-xs text-yellow-300 font-medium">Podaci o medicinskom osoblju</p>
                <input
                  value={editKorisnik.osobljeProfile.pozicija}
                  onChange={(e) => setEditKorisnik({ ...editKorisnik, osobljeProfile: { ...editKorisnik.osobljeProfile!, pozicija: e.target.value } })}
                  placeholder="Pozicija"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-500"
                />
                <select
                  value={editKorisnik.osobljeProfile.odjel?.id ?? ""}
                  onChange={(e) => { const sel = odjeli.find(o => o.id === Number(e.target.value)); setEditKorisnik({ ...editKorisnik, osobljeProfile: { ...editKorisnik.osobljeProfile!, odjel: sel ? { id: sel.id, naziv: sel.naziv } : null } }); }}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-500"
                >
                  <option value="" style={{ background: "#1a1a2e", color: "#fff" }}>— Odaberi odjel —</option>
                  {odjeli.map(o => <option key={o.id} value={o.id} style={{ background: "#1a1a2e", color: "#fff" }}>{o.naziv}</option>)}
                </select>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Radno vrijeme (sati)</label>
                  <input
                    value={editKorisnik.osobljeProfile.radnoVrijeme}
                    onChange={(e) => setEditKorisnik({ ...editKorisnik, osobljeProfile: { ...editKorisnik.osobljeProfile!, radnoVrijeme: Number(e.target.value) } })}
                    type="number" min="1" max="24"
                    className={`w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-500 ${NO_SPIN}`}
                  />
                </div>
              </div>
            )}

            {editKorisnik.uloga === "PACIJENT" && editKorisnik.pacijentProfile && (
              <div className="space-y-3 mb-4 border border-green-500/30 rounded-lg p-3 bg-green-500/5">
                <p className="text-xs text-green-300 font-medium">Podaci o pacijentu</p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editKorisnik.pacijentProfile.hronicniBolesnik}
                    onChange={(e) => setEditKorisnik({ ...editKorisnik, pacijentProfile: { ...editKorisnik.pacijentProfile!, hronicniBolesnik: e.target.checked } })}
                    className="w-4 h-4 accent-green-500"
                  />
                  <span className="text-sm text-white">Hronični bolesnik</span>
                </label>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setEditKorisnik(null)} className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white transition-colors">Odustani</button>
              <button onClick={sacuvajIzmjene} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors">Sačuvaj</button>
            </div>
          </div>
        </div>
      )}

      {/* Uloga modal */}
      {ulogaModal && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center" onClick={() => { setUlogaModal(null); resetDodatni(); }}>
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-2">Promijeni ulogu</h3>
            <p className="text-xs text-white/40 mb-4">Trenutna uloga: {ulogaModal.trenutnaUloga}</p>
            <select value={novaUloga} onChange={(e) => { setNovaUloga(e.target.value); resetDodatni(); }} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 mb-4">
              <option value="" style={{ background: "#1a1a2e", color: "#fff" }}>Odaberi ulogu</option>
              {ULOGE.filter((u) => u !== ulogaModal.trenutnaUloga).map((u) => (
                <option key={u} value={u} style={{ background: "#1a1a2e", color: "#fff" }}>{u.replace("_", " ")}</option>
              ))}
            </select>
            {novaUloga === "DOKTOR" && (
              <div className="space-y-3 mb-4 border border-purple-500/30 rounded-lg p-3 bg-purple-500/5">
                <p className="text-xs text-purple-300 font-medium">Podaci o doktoru</p>
                <input value={dodatniPodaci.specijalizacija} onChange={(e) => setDodatniPodaci({ ...dodatniPodaci, specijalizacija: e.target.value })} placeholder="Specijalizacija *" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500" />
                <input value={dodatniPodaci.brojLicence} onChange={(e) => setDodatniPodaci({ ...dodatniPodaci, brojLicence: e.target.value })} placeholder="Broj licence *" type="number" className={`w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 ${NO_SPIN}`} />
                <select value={dodatniPodaci.idOdjela} onChange={(e) => setDodatniPodaci({ ...dodatniPodaci, idOdjela: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500">
                  <option value="" style={{ background: "#1a1a2e", color: "#fff" }}>— Odaberi odjel * —</option>
                  {odjeli.map((o) => <option key={o.id} value={o.id} style={{ background: "#1a1a2e", color: "#fff" }}>{o.naziv}</option>)}
                </select>
              </div>
            )}
            {novaUloga === "MEDICINSKO_OSOBLJE" && (
              <div className="space-y-3 mb-4 border border-yellow-500/30 rounded-lg p-3 bg-yellow-500/5">
                <p className="text-xs text-yellow-300 font-medium">Podaci o medicinskom osoblju</p>
                <input value={dodatniPodaci.pozicija} onChange={(e) => setDodatniPodaci({ ...dodatniPodaci, pozicija: e.target.value })} placeholder="Pozicija * (npr. Medicinska sestra)" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500" />
                <select value={dodatniPodaci.idOdjel} onChange={(e) => setDodatniPodaci({ ...dodatniPodaci, idOdjel: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500">
                  <option value="" style={{ background: "#1a1a2e", color: "#fff" }}>— Odaberi odjel * —</option>
                  {odjeli.map((o) => <option key={o.id} value={o.id} style={{ background: "#1a1a2e", color: "#fff" }}>{o.naziv}</option>)}
                </select>
                <input value={dodatniPodaci.radnoVrijeme} onChange={(e) => setDodatniPodaci({ ...dodatniPodaci, radnoVrijeme: e.target.value })} placeholder="Radno vrijeme u satima (default: 8)" type="number" min="1" max="12" className={`w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 ${NO_SPIN}`} />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setUlogaModal(null); resetDodatni(); }} className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white transition-colors">Odustani</button>
              <button onClick={promijeniUlogu} disabled={!novaUloga} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors disabled:opacity-40">Promijeni</button>
            </div>
          </div>
        </div>
      )}

      {/* Potvrda modal */}
      {potvrda && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <p className="text-white text-sm mb-5 leading-relaxed">{potvrda.poruka}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPotvrda(null)} className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-colors">Odustani</button>
              <button onClick={() => { potvrda.onPotvrdi(); setPotvrda(null); }} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">Potvrdi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TAB: RASPORED DOKTORA  (Kanban + Klasifikacija)
// ══════════════════════════════════════════════════════════════

const ODJEL_BOJA: Record<string, { ring: string; bg: string; tag: string }> = {
  "Kardiologija":      { ring: "ring-blue-500/40",   bg: "bg-blue-500/10",   tag: "bg-blue-500/20 text-blue-300" },
  "Neurologija":       { ring: "ring-purple-500/40",  bg: "bg-purple-500/10", tag: "bg-purple-500/20 text-purple-300" },
  "Pedijatrija":       { ring: "ring-green-500/40",   bg: "bg-green-500/10",  tag: "bg-green-500/20 text-green-300" },
  "Ortopedija":        { ring: "ring-orange-500/40",  bg: "bg-orange-500/10", tag: "bg-orange-500/20 text-orange-300" },
  "Interna Medicina":  { ring: "ring-teal-500/40",    bg: "bg-teal-500/10",   tag: "bg-teal-500/20 text-teal-300" },
  "Dermatologija":     { ring: "ring-pink-500/40",    bg: "bg-pink-500/10",   tag: "bg-pink-500/20 text-pink-300" },
  "Ginekologija":      { ring: "ring-rose-500/40",    bg: "bg-rose-500/10",   tag: "bg-rose-500/20 text-rose-300" },
  "Radiologija":       { ring: "ring-indigo-500/40",  bg: "bg-indigo-500/10", tag: "bg-indigo-500/20 text-indigo-300" },
  "Opća medicina":     { ring: "ring-yellow-500/40",  bg: "bg-yellow-500/10", tag: "bg-yellow-500/20 text-yellow-300" },
};
const DEFAULT_BOJA = { ring: "ring-gray-500/40", bg: "bg-gray-500/10", tag: "bg-gray-500/20 text-gray-300" };

// Cyclic palette for departments not in ODJEL_BOJA (same colour sequence)
const PALETA_BOJA = [
  { ring: "ring-blue-500/40",   bg: "bg-blue-500/10",   tag: "bg-blue-500/20 text-blue-300"    },
  { ring: "ring-purple-500/40", bg: "bg-purple-500/10", tag: "bg-purple-500/20 text-purple-300" },
  { ring: "ring-green-500/40",  bg: "bg-green-500/10",  tag: "bg-green-500/20 text-green-300"   },
  { ring: "ring-orange-500/40", bg: "bg-orange-500/10", tag: "bg-orange-500/20 text-orange-300" },
  { ring: "ring-teal-500/40",   bg: "bg-teal-500/10",   tag: "bg-teal-500/20 text-teal-300"    },
  { ring: "ring-pink-500/40",   bg: "bg-pink-500/10",   tag: "bg-pink-500/20 text-pink-300"    },
  { ring: "ring-rose-500/40",   bg: "bg-rose-500/10",   tag: "bg-rose-500/20 text-rose-300"    },
  { ring: "ring-indigo-500/40", bg: "bg-indigo-500/10", tag: "bg-indigo-500/20 text-indigo-300" },
  { ring: "ring-yellow-500/40", bg: "bg-yellow-500/10", tag: "bg-yellow-500/20 text-yellow-300" },
];

function bojaOdjelaIdx(idx: number) {
  return PALETA_BOJA[idx % PALETA_BOJA.length];
}

function bojaOdjela(naziv: string) {
  return ODJEL_BOJA[naziv] ?? DEFAULT_BOJA;
}


const RAZLOG_LABEL: Record<string, string> = {
  BOLOVANJE: "Bolovanje",
  KONFERENCIJA: "Konferencija",
  GODISNJI: "Godišnji odmor",
  ADMIN: "Administrativna izmjena",
};

type DoktorInfo = { id: number; ime: string; prezime: string; specijalizacija: string };
type OsobljeInfo = { id: number; pozicija: string; korisnik: { ime: string; prezime: string }; odjel: { naziv: string } };

type EditModal = { raspored: Raspored };
type IzuzetakModal = { raspored: Raspored };
type NoviModal = { danUSedmici: string };

function TabRaspored() {
  // ── Doctor schedule state ─────────────────────────────────
  const [rasporedi, setRasporedi] = useState<Raspored[]>([]);
  const [doktori, setDoktori] = useState<DoktorInfo[]>([]);
  const [izuzeci, setIzuzeci] = useState<Izuzetak[]>([]);
  // ── Staff schedule state ──────────────────────────────────
  const [rasporediOsoblja, setRasporediOsoblja] = useState<RasporedOsoblja[]>([]);
  const [osobljeList, setOsobljeList] = useState<OsobljeInfo[]>([]);
  // ── UI state ──────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [osvjezavanje, setOsvjezavanje] = useState(false);
  const [notif, setNotif] = useState<{ poruka: string; tip: "uspjeh" | "greska" } | null>(null);
  const [view, setView] = useState<"kanban" | "klasifikacija">("kanban");
  const [podView, setPodView] = useState<"doktori" | "osoblje">("doktori");

  // modals — doktori
  const [editModal, setEditModal] = useState<EditModal | null>(null);
  const [izuzetakModal, setIzuzetakModal] = useState<IzuzetakModal | null>(null);
  const [noviModal, setNoviModal] = useState<NoviModal | null>(null);

  // modals — osoblje
  const [editOsobljeModal, setEditOsobljeModal] = useState<{ raspored: RasporedOsoblja } | null>(null);
  const [noviOsobljeModal, setNoviOsobljeModal] = useState<{ danUSedmici: string } | null>(null);
  const [editOsobljeForma, setEditOsobljeForma] = useState({ vrijemeOd: "08:00", vrijemeDo: "16:00" });
  const [novaOsobljeForma, setNovaOsobljeForma] = useState({ idOsoblje: "", vrijemeOd: "08:00", vrijemeDo: "16:00" });

  // edit form
  const [editForma, setEditForma] = useState({ vrijemeOd: "08:00", vrijemeDo: "16:00" });

  // novi šablon form
  const [novaForma, setNovaForma] = useState({ idDoktor: "", vrijemeOd: "08:00", vrijemeDo: "16:00" });

  // izuzetak form
  const [izuzetakForma, setIzuzetakForma] = useState({
    datum: "", razlog: "ADMIN", vrijemeOd: "08:00", vrijemeDo: "16:00",
    nePradi: false, napomena: "",
  });

  const dohvati = useCallback(async () => {
    setLoading(true);
    try {
      const [resR, resI] = await Promise.all([
        fetch(`${API}/admin/rasporedi`, { headers: authHeader() }),
        fetch(`${API}/admin/izuzeci`, { headers: authHeader() }),
      ]);
      if (resR.ok) setRasporedi(await resR.json());
      if (resI.ok) setIzuzeci(await resI.json());
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  const dohvatiDoktore = useCallback(async () => {
    const res = await fetch(`${API}/doktori`, { headers: authHeader() });
    if (res.ok) setDoktori(await res.json());
  }, []);

  const dohvatiOsoblje = useCallback(async () => {
    try {
      const [resR, resO] = await Promise.all([
        fetch(`${API}/admin/rasporedi-osoblja`, { headers: authHeader() }),
        fetch(`${API}/admin/osoblje-lista`, { headers: authHeader() }),
      ]);
      if (resR.ok) setRasporediOsoblja(await resR.json());
      if (resO.ok) setOsobljeList(await resO.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => { dohvati(); dohvatiDoktore(); dohvatiOsoblje(); }, [dohvati, dohvatiDoktore, dohvatiOsoblje]);

  // ── actions ─────────────────────────────────────────────────
  const osvjeziTermine = async (dani: 1 | 7 | 30) => {
    setOsvjezavanje(true);
    const res = await fetch(`${API}/admin/osvjezi-termine`, {
      method: "POST", headers: authHeader(),
      body: JSON.stringify({ dani }),
    });
    const data = await res.json();
    setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
    setOsvjezavanje(false);
  };

  const snimiEdit = async () => {
    if (!editModal) return;
    const res = await fetch(`${API}/admin/rasporedi/${editModal.raspored.id}`, {
      method: "PUT", headers: authHeader(),
      body: JSON.stringify(editForma),
    });
    const data = await res.json();
    setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
    if (res.ok) { setEditModal(null); dohvati(); }
  };

  const deaktiviraj = async (id: number) => {
    const res = await fetch(`${API}/admin/rasporedi/${id}`, { method: "DELETE", headers: authHeader() });
    const data = await res.json();
    setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
    if (res.ok) { setEditModal(null); dohvati(); }
  };

  const snimiNovi = async () => {
    if (!noviModal || !novaForma.idDoktor) return;
    const res = await fetch(`${API}/admin/rasporedi`, {
      method: "POST", headers: authHeader(),
      body: JSON.stringify({ idDoktor: Number(novaForma.idDoktor), danUSedmici: noviModal.danUSedmici, vrijemeOd: novaForma.vrijemeOd, vrijemeDo: novaForma.vrijemeDo }),
    });
    const data = await res.json();
    setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
    if (res.ok) { setNoviModal(null); setNovaForma({ idDoktor: "", vrijemeOd: "08:00", vrijemeDo: "16:00" }); dohvati(); }
  };

  const snimiIzuzetak = async () => {
    if (!izuzetakModal || !izuzetakForma.datum) return;
    const body: Record<string, unknown> = {
      idDoktor: izuzetakModal.raspored.idDoktor,
      datum: izuzetakForma.datum,
      razlog: izuzetakForma.razlog,
      napomena: izuzetakForma.napomena || null,
      vrijemeOd: izuzetakForma.nePradi ? null : izuzetakForma.vrijemeOd,
      vrijemeDo: izuzetakForma.nePradi ? null : izuzetakForma.vrijemeDo,
    };
    const res = await fetch(`${API}/admin/izuzeci`, { method: "POST", headers: authHeader(), body: JSON.stringify(body) });
    const data = await res.json();
    setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
    if (res.ok) { setIzuzetakModal(null); setIzuzetakForma({ datum: "", razlog: "ADMIN", vrijemeOd: "08:00", vrijemeDo: "16:00", nePradi: false, napomena: "" }); dohvati(); }
  };

  const obrisiIzuzetak = async (id: number) => {
    const res = await fetch(`${API}/admin/izuzeci/${id}`, { method: "DELETE", headers: authHeader() });
    const data = await res.json();
    setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
    if (res.ok) dohvati();
  };

  // ── staff actions ─────────────────────────────────────────────
  const snimiEditOsoblja = async () => {
    if (!editOsobljeModal) return;
    const res = await fetch(`${API}/admin/rasporedi-osoblja/${editOsobljeModal.raspored.id}`, {
      method: "PUT", headers: authHeader(),
      body: JSON.stringify(editOsobljeForma),
    });
    const data = await res.json();
    setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
    if (res.ok) { setEditOsobljeModal(null); dohvatiOsoblje(); }
  };

  const deaktivirajOsoblja = async (id: number) => {
    const res = await fetch(`${API}/admin/rasporedi-osoblja/${id}`, { method: "DELETE", headers: authHeader() });
    const data = await res.json();
    setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
    if (res.ok) { setEditOsobljeModal(null); dohvatiOsoblje(); }
  };

  const snimiNoviOsoblja = async () => {
    if (!noviOsobljeModal || !novaOsobljeForma.idOsoblje) return;
    const res = await fetch(`${API}/admin/rasporedi-osoblja`, {
      method: "POST", headers: authHeader(),
      body: JSON.stringify({ idOsoblje: Number(novaOsobljeForma.idOsoblje), danUSedmici: noviOsobljeModal.danUSedmici, vrijemeOd: novaOsobljeForma.vrijemeOd, vrijemeDo: novaOsobljeForma.vrijemeDo }),
    });
    const data = await res.json();
    setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
    if (res.ok) { setNoviOsobljeModal(null); setNovaOsobljeForma({ idOsoblje: "", vrijemeOd: "08:00", vrijemeDo: "16:00" }); dohvatiOsoblje(); }
  };

  // ── helpers ──────────────────────────────────────────────────
  const aktivni = rasporedi.filter((r) => r.aktivan);
  const kanbanPoDisnima = DANI.reduce<Record<string, Raspored[]>>((acc, dan) => {
    acc[dan] = aktivni.filter((r) => r.danUSedmici === dan);
    return acc;
  }, {});

  // Doctors that have NO template for a given day (for "+ Dodaj" selector)
  const doktoriSaTemplateomZaDan = (dan: string) =>
    new Set(aktivni.filter((r) => r.danUSedmici === dan).map((r) => r.idDoktor));

  // Group by department for classification view
  const poOdjelima = aktivni.reduce<Record<string, Raspored[]>>((acc, r) => {
    const odjel = r.doktor.odjel.naziv;
    if (!acc[odjel]) acc[odjel] = [];
    acc[odjel].push(r);
    return acc;
  }, {});

  // Group by doctor within a department
  const poDoktorima = (items: Raspored[]) =>
    items.reduce<Record<string, Raspored[]>>((acc, r) => {
      const key = `${r.doktor.korisnik.ime} ${r.doktor.korisnik.prezime}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {});

  // ── helpers — osoblje ────────────────────────────────────────
  const aktivniOsoblje = rasporediOsoblja.filter((r) => r.aktivan);

  const kanbanOsobljePoDisnima = DANI.reduce<Record<string, RasporedOsoblja[]>>((acc, dan) => {
    acc[dan] = aktivniOsoblje.filter((r) => r.danUSedmici === dan);
    return acc;
  }, {});

  const osobljePoOdjelima = aktivniOsoblje.reduce<Record<string, RasporedOsoblja[]>>((acc, r) => {
    const odjel = r.osoblje.odjel.naziv;
    if (!acc[odjel]) acc[odjel] = [];
    acc[odjel].push(r);
    return acc;
  }, {});

  const osobljePoOsobama = (items: RasporedOsoblja[]) =>
    items.reduce<Record<string, RasporedOsoblja[]>>((acc, r) => {
      const key = `${r.osoblje.korisnik.ime} ${r.osoblje.korisnik.prezime}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {});

  const osobljeZaDanSet = (dan: string) =>
    new Set(aktivniOsoblje.filter((r) => r.danUSedmici === dan).map((r) => r.idOsoblje));

  // ── input style ──────────────────────────────────────────────
  const inp = "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500";
  const sel = `${inp} [&>option]:bg-[#1a1a2e]`;

  // ── render ───────────────────────────────────────────────────
  return (
    <div>
      {notif && <Notifikacija poruka={notif.poruka} tip={notif.tip} onZatvori={() => setNotif(null)} />}

      {/* ── toolbar ── */}
      <div className="flex flex-wrap gap-2 items-center mb-5">
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          <button onClick={() => setPodView("doktori")} className={`px-4 py-2 text-sm font-medium transition-colors ${podView === "doktori" ? "bg-purple-600 text-white" : "text-white/50 hover:text-white"}`}>
            Doktori
          </button>
          <button onClick={() => setPodView("osoblje")} className={`px-4 py-2 text-sm font-medium transition-colors ${podView === "osoblje" ? "bg-yellow-600 text-white" : "text-white/50 hover:text-white"}`}>
            Medicinsko osoblje
          </button>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          <button onClick={() => setView("kanban")} className={`px-4 py-2 text-sm font-medium transition-colors ${view === "kanban" ? "bg-purple-600 text-white" : "text-white/50 hover:text-white"}`}>
            Kanban
          </button>
          <button onClick={() => setView("klasifikacija")} className={`px-4 py-2 text-sm font-medium transition-colors ${view === "klasifikacija" ? "bg-purple-600 text-white" : "text-white/50 hover:text-white"}`}>
            Klasifikacija
          </button>
        </div>
        <span className="text-xs text-white/30 ml-1">
          {podView === "doktori" ? `${aktivni.length} aktivnih šablona` : `${aktivniOsoblje.length} aktivnih šablona`}
        </span>
        {podView === "doktori" && (
          <div className="ml-auto flex gap-2">
            <button onClick={() => osvjeziTermine(1)} disabled={osvjezavanje} className="px-4 py-2 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {osvjezavanje ? "Generisanje…" : "↻ Danas"}
            </button>
            <button onClick={() => osvjeziTermine(7)} disabled={osvjezavanje} className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {osvjezavanje ? "Generisanje…" : "↻ Sljedeća sedmica"}
            </button>
            <button onClick={() => osvjeziTermine(30)} disabled={osvjezavanje} className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {osvjezavanje ? "Generisanje…" : "↻ Sljedeći mjesec"}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-center text-white/40 py-12">Učitavanje…</p>
      ) : podView === "doktori" ? (
        <>
          {/* ══ DOCTOR KANBAN / KLASIFIKACIJA ══ */}
          {view === "kanban" ? (
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-3 min-w-max">
                {DANI.map((dan) => {
                  const cards = kanbanPoDisnima[dan];
                  return (
                    <div key={dan} className="w-44 flex-shrink-0">
                      <div className="bg-white/5 border border-white/10 rounded-t-lg px-3 py-2 text-center">
                        <span className="text-xs font-bold text-white/70 tracking-wider">{dan}</span>
                      </div>
                      <div className="bg-white/[0.02] border border-t-0 border-white/10 rounded-b-lg p-2 min-h-[120px] flex flex-col gap-2">
                        {cards.map((r) => {
                          const boja = bojaOdjela(r.doktor.odjel.naziv);
                          return (
                            <button key={r.id} onClick={() => { setEditModal({ raspored: r }); setEditForma({ vrijemeOd: formatVrijeme(r.vrijemeOd), vrijemeDo: formatVrijeme(r.vrijemeDo) }); }} className={`w-full text-left rounded-lg p-2.5 ring-1 ${boja.ring} ${boja.bg} hover:brightness-125 transition-all`}>
                              <p className="text-xs font-semibold text-white leading-tight">Dr. {r.doktor.korisnik.ime[0]}. {r.doktor.korisnik.prezime}</p>
                              <p className={`text-[10px] mt-0.5 px-1.5 py-0.5 rounded inline-block ${boja.tag}`}>{r.doktor.odjel.naziv}</p>
                              <p className="text-[11px] text-white/60 mt-1">{formatVrijeme(r.vrijemeOd)}–{formatVrijeme(r.vrijemeDo)}</p>
                            </button>
                          );
                        })}
                        <button onClick={() => { setNoviModal({ danUSedmici: dan }); setNovaForma({ idDoktor: "", vrijemeOd: "08:00", vrijemeDo: "16:00" }); }} className="w-full text-center text-white/25 hover:text-white/60 text-xs py-1 border border-dashed border-white/10 hover:border-white/30 rounded-lg transition-colors">
                          + Dodaj
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(poOdjelima).sort(([a], [b]) => a.localeCompare(b)).map(([odjel, items]) => {
                const boja = bojaOdjela(odjel);
                const poDokt = poDoktorima(items);
                return (
                  <div key={odjel} className={`rounded-xl border ${boja.ring.replace("ring-", "border-")} overflow-hidden`}>
                    <div className={`px-4 py-2.5 ${boja.bg} flex items-center gap-2`}>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${boja.tag}`}>{odjel}</span>
                      <span className="text-xs text-white/40">{items.length} {items.length === 1 ? "šablon" : "šablona"}</span>
                    </div>
                    <div className="divide-y divide-white/5">
                      {Object.entries(poDokt).map(([doktor, rasps]) => (
                        <div key={doktor} className="px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 items-start">
                          <p className="text-sm font-semibold text-white w-44 flex-shrink-0">Dr. {doktor}</p>
                          <div className="flex flex-wrap gap-2">
                            {rasps.sort((a, b) => DANI.indexOf(a.danUSedmici) - DANI.indexOf(b.danUSedmici)).map((r) => (
                              <button key={r.id} onClick={() => { setEditModal({ raspored: r }); setEditForma({ vrijemeOd: formatVrijeme(r.vrijemeOd), vrijemeDo: formatVrijeme(r.vrijemeDo) }); }} className={`text-xs px-2.5 py-1 rounded-lg ring-1 ${boja.ring} ${boja.bg} hover:brightness-125 transition-all`}>
                                <span className="font-semibold text-white/80">{r.danUSedmici.slice(0, 3)}</span>
                                <span className="text-white/50 ml-1">{formatVrijeme(r.vrijemeOd)}–{formatVrijeme(r.vrijemeDo)}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {Object.keys(poOdjelima).length === 0 && <p className="text-center text-white/40 py-12">Nema aktivnih šablona.</p>}
            </div>
          )}

          {/* ── izuzeci lista ── */}
          {izuzeci.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Nadolazeći izuzeci</h3>
              <div className="space-y-1.5">
                {izuzeci.slice(0, 10).map((iz) => (
                  <div key={iz.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm">
                    <span className="text-white/40 text-xs w-20 flex-shrink-0">{new Date(iz.datum).toLocaleDateString("bs", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                    <span className="text-white font-medium">Dr. {iz.doktor.korisnik.ime} {iz.doktor.korisnik.prezime}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${iz.razlog === "BOLOVANJE" ? "bg-red-500/20 text-red-300" : iz.razlog === "KONFERENCIJA" ? "bg-blue-500/20 text-blue-300" : iz.razlog === "GODISNJI" ? "bg-green-500/20 text-green-300" : "bg-gray-500/20 text-gray-300"}`}>
                      {RAZLOG_LABEL[iz.razlog]}
                    </span>
                    {iz.vrijemeOd
                      ? <span className="text-white/50 text-xs">{formatVrijeme(iz.vrijemeOd)}–{formatVrijeme(iz.vrijemeDo!)}</span>
                      : <span className="text-red-300 text-xs">Ne radi</span>}
                    {iz.napomena && <span className="text-white/30 text-xs italic truncate max-w-xs">{iz.napomena}</span>}
                    <button onClick={() => obrisiIzuzetak(iz.id)} className="ml-auto text-xs text-red-400/60 hover:text-red-400 transition-colors">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* ══ STAFF KANBAN / KLASIFIKACIJA ══ */}
          {view === "kanban" ? (
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-3 min-w-max">
                {DANI.map((dan) => {
                  const cards = kanbanOsobljePoDisnima[dan];
                  return (
                    <div key={dan} className="w-48 flex-shrink-0">
                      <div className="bg-white/5 border border-white/10 rounded-t-lg px-3 py-2 text-center">
                        <span className="text-xs font-bold text-white/70 tracking-wider">{dan}</span>
                      </div>
                      <div className="bg-white/[0.02] border border-t-0 border-white/10 rounded-b-lg p-2 min-h-[120px] flex flex-col gap-2">
                        {cards.map((r) => {
                          const boja = bojaOdjela(r.osoblje.odjel.naziv);
                          return (
                            <button key={r.id} onClick={() => { setEditOsobljeModal({ raspored: r }); setEditOsobljeForma({ vrijemeOd: formatVrijeme(r.vrijemeOd), vrijemeDo: formatVrijeme(r.vrijemeDo) }); }} className={`w-full text-left rounded-lg p-2.5 ring-1 ${boja.ring} ${boja.bg} hover:brightness-125 transition-all`}>
                              <p className="text-xs font-semibold text-white leading-tight">{r.osoblje.korisnik.ime} {r.osoblje.korisnik.prezime}</p>
                              <p className="text-[10px] mt-0.5 px-1.5 py-0.5 rounded inline-block bg-yellow-500/20 text-yellow-300">{r.osoblje.pozicija}</p>
                              <p className="text-[10px] text-white/40 mt-0.5">{r.osoblje.odjel.naziv}</p>
                              <p className="text-[11px] text-white/60 mt-1">{formatVrijeme(r.vrijemeOd)}–{formatVrijeme(r.vrijemeDo)}</p>
                            </button>
                          );
                        })}
                        <button onClick={() => { setNoviOsobljeModal({ danUSedmici: dan }); setNovaOsobljeForma({ idOsoblje: "", vrijemeOd: "08:00", vrijemeDo: "16:00" }); }} className="w-full text-center text-white/25 hover:text-white/60 text-xs py-1 border border-dashed border-white/10 hover:border-white/30 rounded-lg transition-colors">
                          + Dodaj
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(osobljePoOdjelima).sort(([a], [b]) => a.localeCompare(b)).map(([odjel, items]) => {
                const boja = bojaOdjela(odjel);
                const poOsoblju = osobljePoOsobama(items);
                return (
                  <div key={odjel} className={`rounded-xl border ${boja.ring.replace("ring-", "border-")} overflow-hidden`}>
                    <div className={`px-4 py-2.5 ${boja.bg} flex items-center gap-2`}>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${boja.tag}`}>{odjel}</span>
                      <span className="text-xs text-white/40">{items.length} {items.length === 1 ? "šablon" : "šablona"}</span>
                    </div>
                    <div className="divide-y divide-white/5">
                      {Object.entries(poOsoblju).map(([osoba, rasps]) => (
                        <div key={osoba} className="px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 items-start">
                          <div className="w-52 flex-shrink-0">
                            <p className="text-sm font-semibold text-white">{osoba}</p>
                            <p className="text-xs text-yellow-400/70">{rasps[0].osoblje.pozicija}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {rasps.sort((a, b) => DANI.indexOf(a.danUSedmici) - DANI.indexOf(b.danUSedmici)).map((r) => (
                              <button key={r.id} onClick={() => { setEditOsobljeModal({ raspored: r }); setEditOsobljeForma({ vrijemeOd: formatVrijeme(r.vrijemeOd), vrijemeDo: formatVrijeme(r.vrijemeDo) }); }} className={`text-xs px-2.5 py-1 rounded-lg ring-1 ${boja.ring} ${boja.bg} hover:brightness-125 transition-all`}>
                                <span className="font-semibold text-white/80">{r.danUSedmici.slice(0, 3)}</span>
                                <span className="text-white/50 ml-1">{formatVrijeme(r.vrijemeOd)}–{formatVrijeme(r.vrijemeDo)}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {Object.keys(osobljePoOdjelima).length === 0 && <p className="text-center text-white/40 py-12">Nema aktivnih šablona za medicinsko osoblje.</p>}
            </div>
          )}
        </>
      )}

      {/* ══ EDIT TEMPLATE MODAL ══ */}
      {editModal && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-white/40 mb-0.5">{editModal.raspored.danUSedmici}</p>
                <h3 className="text-base font-semibold text-white">
                  Dr. {editModal.raspored.doktor.korisnik.ime} {editModal.raspored.doktor.korisnik.prezime}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${bojaOdjela(editModal.raspored.doktor.odjel.naziv).tag}`}>
                  {editModal.raspored.doktor.odjel.naziv}
                </span>
              </div>
              <button onClick={() => setEditModal(null)} className="text-white/40 hover:text-white text-lg leading-none">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Radno od</label>
                <input type="time" value={editForma.vrijemeOd} onChange={(e) => setEditForma({ ...editForma, vrijemeOd: e.target.value })} className={inp} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Radno do</label>
                <input type="time" value={editForma.vrijemeDo} onChange={(e) => setEditForma({ ...editForma, vrijemeDo: e.target.value })} className={inp} />
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button onClick={snimiEdit} className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors">Sačuvaj promjene</button>
              <button onClick={() => deaktiviraj(editModal.raspored.id)} className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm transition-colors">Deaktiviraj</button>
            </div>

            <div className="border-t border-white/10 pt-4">
              <button
                onClick={() => { setIzuzetakModal({ raspored: editModal.raspored }); setEditModal(null); }}
                className="w-full py-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-sm font-medium transition-colors"
              >
                + Dodaj izuzetak za specifični datum
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ NOVI ŠABLON MODAL ══ */}
      {noviModal && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Novi šablon — {noviModal.danUSedmici}</h3>
              <button onClick={() => setNoviModal(null)} className="text-white/40 hover:text-white text-lg leading-none">✕</button>
            </div>

            <div className="mb-3">
              <label className="text-xs text-white/40 mb-1 block">Doktor</label>
              <select value={novaForma.idDoktor} onChange={(e) => setNovaForma({ ...novaForma, idDoktor: e.target.value })} className={sel}>
                <option value="">— Odaberite —</option>
                {doktori
                  .filter((d) => !doktoriSaTemplateomZaDan(noviModal.danUSedmici).has(d.id))
                  .map((d) => <option key={d.id} value={d.id}>Dr. {d.ime} {d.prezime} — {d.specijalizacija}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Od</label>
                <input type="time" value={novaForma.vrijemeOd} onChange={(e) => setNovaForma({ ...novaForma, vrijemeOd: e.target.value })} className={inp} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Do</label>
                <input type="time" value={novaForma.vrijemeDo} onChange={(e) => setNovaForma({ ...novaForma, vrijemeDo: e.target.value })} className={inp} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setNoviModal(null)} className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white border border-white/10 transition-colors">Odustani</button>
              <button onClick={snimiNovi} disabled={!novaForma.idDoktor} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors disabled:opacity-40">Sačuvaj</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ STAFF EDIT MODAL ══ */}
      {editOsobljeModal && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-white/40 mb-0.5">{editOsobljeModal.raspored.danUSedmici}</p>
                <h3 className="text-base font-semibold text-white">
                  {editOsobljeModal.raspored.osoblje.korisnik.ime} {editOsobljeModal.raspored.osoblje.korisnik.prezime}
                </h3>
                <div className="flex gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded inline-block ${bojaOdjela(editOsobljeModal.raspored.osoblje.odjel.naziv).tag}`}>
                    {editOsobljeModal.raspored.osoblje.odjel.naziv}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded inline-block bg-yellow-500/20 text-yellow-300">
                    {editOsobljeModal.raspored.osoblje.pozicija}
                  </span>
                </div>
              </div>
              <button onClick={() => setEditOsobljeModal(null)} className="text-white/40 hover:text-white text-lg leading-none">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Radno od</label>
                <input type="time" value={editOsobljeForma.vrijemeOd} onChange={(e) => setEditOsobljeForma({ ...editOsobljeForma, vrijemeOd: e.target.value })} className={inp} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Radno do</label>
                <input type="time" value={editOsobljeForma.vrijemeDo} onChange={(e) => setEditOsobljeForma({ ...editOsobljeForma, vrijemeDo: e.target.value })} className={inp} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={snimiEditOsoblja} className="flex-1 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium transition-colors">Sačuvaj promjene</button>
              <button onClick={() => deaktivirajOsoblja(editOsobljeModal.raspored.id)} className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm transition-colors">Deaktiviraj</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ STAFF NOVI ŠABLON MODAL ══ */}
      {noviOsobljeModal && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Novi šablon — {noviOsobljeModal.danUSedmici}</h3>
              <button onClick={() => setNoviOsobljeModal(null)} className="text-white/40 hover:text-white text-lg leading-none">✕</button>
            </div>
            <div className="mb-3">
              <label className="text-xs text-white/40 mb-1 block">Osoblje</label>
              <select value={novaOsobljeForma.idOsoblje} onChange={(e) => setNovaOsobljeForma({ ...novaOsobljeForma, idOsoblje: e.target.value })} className={sel}>
                <option value="">— Odaberite —</option>
                {osobljeList
                  .filter((o) => !osobljeZaDanSet(noviOsobljeModal.danUSedmici).has(o.id))
                  .map((o) => <option key={o.id} value={o.id}>{o.korisnik.ime} {o.korisnik.prezime} — {o.pozicija} ({o.odjel.naziv})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Od</label>
                <input type="time" value={novaOsobljeForma.vrijemeOd} onChange={(e) => setNovaOsobljeForma({ ...novaOsobljeForma, vrijemeOd: e.target.value })} className={inp} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Do</label>
                <input type="time" value={novaOsobljeForma.vrijemeDo} onChange={(e) => setNovaOsobljeForma({ ...novaOsobljeForma, vrijemeDo: e.target.value })} className={inp} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setNoviOsobljeModal(null)} className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white border border-white/10 transition-colors">Odustani</button>
              <button onClick={snimiNoviOsoblja} disabled={!novaOsobljeForma.idOsoblje} className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium transition-colors disabled:opacity-40">Sačuvaj</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ IZUZETAK MODAL ══ */}
      {izuzetakModal && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Izuzetak rasporeda</h3>
                <p className="text-xs text-white/40 mt-0.5">
                  Dr. {izuzetakModal.raspored.doktor.korisnik.ime} {izuzetakModal.raspored.doktor.korisnik.prezime}
                  {" · "}{izuzetakModal.raspored.danUSedmici}
                </p>
              </div>
              <button onClick={() => setIzuzetakModal(null)} className="text-white/40 hover:text-white text-lg leading-none">✕</button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Datum</label>
                <input type="date" value={izuzetakForma.datum} onChange={(e) => setIzuzetakForma({ ...izuzetakForma, datum: e.target.value })} min={new Date().toISOString().split("T")[0]} className={inp} />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1 block">Razlog</label>
                <select value={izuzetakForma.razlog} onChange={(e) => setIzuzetakForma({ ...izuzetakForma, razlog: e.target.value })} className={sel}>
                  {Object.entries(RAZLOG_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={izuzetakForma.nePradi} onChange={(e) => setIzuzetakForma({ ...izuzetakForma, nePradi: e.target.checked })} className="w-4 h-4 accent-purple-500" />
                <span className="text-sm text-white/70">Doktor ne radi taj dan</span>
              </label>

              {!izuzetakForma.nePradi && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Od</label>
                    <input type="time" value={izuzetakForma.vrijemeOd} onChange={(e) => setIzuzetakForma({ ...izuzetakForma, vrijemeOd: e.target.value })} className={inp} />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Do</label>
                    <input type="time" value={izuzetakForma.vrijemeDo} onChange={(e) => setIzuzetakForma({ ...izuzetakForma, vrijemeDo: e.target.value })} className={inp} />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-white/40 mb-1 block">Napomena (opcionalno)</label>
                <input type="text" value={izuzetakForma.napomena} onChange={(e) => setIzuzetakForma({ ...izuzetakForma, napomena: e.target.value })} placeholder="npr. Zamjenjuje Dr. Kovač" className={inp} />
              </div>

              {(izuzetakForma.razlog === "BOLOVANJE" || izuzetakForma.razlog === "KONFERENCIJA") && (
                <p className="text-xs text-orange-300/80 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
                  ✉ Automatski će se poslati email obavijest o zahvaćenim terminima.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setIzuzetakModal(null)} className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white border border-white/10 transition-colors">Odustani</button>
              <button onClick={snimiIzuzetak} disabled={!izuzetakForma.datum} className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium transition-colors disabled:opacity-40">Sačuvaj izuzetak</button>
            </div>
          </div>
        </div>
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
//  TAB: ODJELI
// ══════════════════════════════════════════════════════════════
function TabOdjeli() {
  const [odjeli, setOdjeli] = useState<OdjelDetalj[]>([]);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState<{ poruka: string; tip: "uspjeh" | "greska" } | null>(null);
  const [noviModal, setNoviModal] = useState(false);
  const [novaForma, setNovaForma] = useState({ naziv: "", opis: "" });
  const [editModal, setEditModal] = useState<OdjelDetalj | null>(null);
  const [potvrda, setPotvrda] = useState<{ poruka: string; onPotvrdi: () => void } | null>(null);

  const dohvati = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/odjeli`, { headers: authHeader() });
      if (res.ok) {
        const data: OdjelDetalj[] = await res.json();
        setOdjeli(data);
        // Keep edit modal in sync if it's open
        setEditModal(prev => prev ? (data.find(o => o.id === prev.id) ?? null) : null);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { dohvati(); }, [dohvati]);

  const snimiNovi = async () => {
    if (!novaForma.naziv.trim()) return;
    const res = await fetch(`${API}/admin/odjeli`, {
      method: "POST", headers: authHeader(),
      body: JSON.stringify({ naziv: novaForma.naziv, opis: novaForma.opis }),
    });
    const data = await res.json();
    setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
    if (res.ok) { setNoviModal(false); setNovaForma({ naziv: "", opis: "" }); dohvati(); }
  };

  const obrisiOdjel = (o: OdjelDetalj) => {
    if (o.doktori.length > 0 || o.osoblje.length > 0) {
      setNotif({ poruka: `Odjel ima ${o.doktori.length} doktora i ${o.osoblje.length} osoblja. Prvo premjestite sve članove.`, tip: "greska" });
      return;
    }
    setPotvrda({
      poruka: `Da li ste sigurni da želite obrisati odjel "${o.naziv}"?`,
      onPotvrdi: async () => {
        const res = await fetch(`${API}/admin/odjeli/${o.id}`, { method: "DELETE", headers: authHeader() });
        const data = await res.json();
        setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
        if (res.ok) dohvati();
      },
    });
  };

  const ukloniDoktora = (odjel: OdjelDetalj, d: OdjelDetalj["doktori"][0]) => {
    setPotvrda({
      poruka: `Dr. ${d.korisnik.ime} ${d.korisnik.prezime} će biti uklonjen/a iz odjela i dobit će ulogu PACIJENT. Ova akcija je nepovratna.`,
      onPotvrdi: async () => {
        const res = await fetch(`${API}/admin/odjeli/${odjel.id}/doktori/${d.id}`, {
          method: "DELETE", headers: authHeader(),
        });
        const data = await res.json();
        setNotif({ poruka: data.poruka, tip: res.ok ? "uspjeh" : "greska" });
        if (res.ok) dohvati();
      },
    });
  };

  const inp = "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500";

  if (loading) return <p className="text-center text-white/40 py-16">Učitavanje…</p>;

  return (
    <div>
      {notif && <Notifikacija poruka={notif.poruka} tip={notif.tip} onZatvori={() => setNotif(null)} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {odjeli.map((o, idx) => {
          const boja = bojaOdjelaIdx(idx);
          const imaClanova = o.doktori.length > 0 || o.osoblje.length > 0;
          return (
            <div key={o.id} className={`rounded-xl ring-1 ${boja.ring} overflow-hidden flex flex-col cursor-pointer group`}
              onClick={() => setEditModal(o)}>
              {/* Card header */}
              <div className={`${boja.bg} px-4 py-3 flex items-start justify-between gap-2`}>
                <div className="min-w-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${boja.tag} inline-block`}>{o.naziv}</span>
                  <p className="text-xs text-white/40 mt-1.5 leading-tight">
                    {o.doktori.length} {o.doktori.length === 1 ? "doktor" : "doktora"}
                    {o.osoblje.length > 0 && ` · ${o.osoblje.length} osoblje`}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); obrisiOdjel(o); }}
                  title={imaClanova ? "Nije moguće obrisati — odjel ima članove" : "Obriši odjel"}
                  className={`flex-shrink-0 text-sm leading-none mt-0.5 transition-colors ${imaClanova ? "text-white/10 cursor-not-allowed" : "text-white/25 hover:text-red-400"}`}
                >
                  ✕
                </button>
              </div>

              {/* Card body */}
              <div className="bg-white/[0.02] group-hover:bg-white/[0.04] transition-colors px-4 py-3 flex-1 min-h-[90px]">
                {o.opis && <p className="text-[11px] text-white/35 italic mb-2">{o.opis}</p>}
                {o.doktori.length === 0 ? (
                  <p className="text-xs text-white/20">Nema doktora</p>
                ) : (
                  <ul className="space-y-0.5">
                    {o.doktori.slice(0, 4).map((d) => (
                      <li key={d.id} className="text-xs text-white/55">Dr. {d.korisnik.ime} {d.korisnik.prezime}</li>
                    ))}
                    {o.doktori.length > 4 && (
                      <li className="text-xs text-white/25">+ još {o.doktori.length - 4}</li>
                    )}
                  </ul>
                )}
                <p className="text-[10px] text-white/20 mt-2 group-hover:text-white/40 transition-colors">Klikni za upravljanje →</p>
              </div>
            </div>
          );
        })}

        {/* Add new card */}
        <button
          onClick={() => setNoviModal(true)}
          className="rounded-xl ring-1 ring-white/10 border border-dashed border-white/20 hover:border-purple-500/50 bg-white/[0.01] hover:bg-purple-500/5 transition-all flex flex-col items-center justify-center gap-2 min-h-[140px] text-white/25 hover:text-purple-400"
        >
          <span className="text-3xl leading-none">+</span>
          <span className="text-xs font-medium">Novi odjel</span>
        </button>
      </div>

      {/* ── Edit / upravljanje odjelom modal ── */}
      {editModal && (() => {
        const idx = odjeli.findIndex(o => o.id === editModal.id);
        const boja = bojaOdjelaIdx(idx >= 0 ? idx : 0);
        return (
          <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditModal(null)}>
            <div className="bg-[#1a1a2e] border border-white/10 rounded-xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>

              {/* Modal header */}
              <div className={`${boja.bg} px-5 py-4 flex items-center justify-between`}>
                <div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${boja.tag}`}>{editModal.naziv}</span>
                  {editModal.opis && <p className="text-[11px] text-white/40 mt-1 italic">{editModal.opis}</p>}
                </div>
                <button onClick={() => setEditModal(null)} className="text-white/40 hover:text-white text-lg leading-none">✕</button>
              </div>

              <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">

                {/* Trenutni doktori */}
                <div>
                  <p className="text-xs text-white/40 font-semibold uppercase tracking-wide mb-2">
                    Trenutni doktori ({editModal.doktori.length})
                  </p>
                  {editModal.doktori.length === 0 ? (
                    <p className="text-xs text-white/25 italic">Nema doktora u ovom odjelu.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {editModal.doktori.map((d) => (
                        <li key={d.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-sm text-white">Dr. {d.korisnik.ime} {d.korisnik.prezime}</span>
                          <button
                            onClick={() => ukloniDoktora(editModal, d)}
                            className="text-xs text-red-400/60 hover:text-red-400 transition-colors ml-3 flex-shrink-0"
                          >
                            Ukloni
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Medicinsko osoblje */}
                <div className="border-t border-white/10 pt-4">
                  <p className="text-xs text-white/40 font-semibold uppercase tracking-wide mb-2">
                    Medicinsko osoblje ({editModal.osoblje.length})
                  </p>
                  {editModal.osoblje.length === 0 ? (
                    <p className="text-xs text-white/25 italic">Nema medicinskog osoblja u ovom odjelu.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {editModal.osoblje.map((o) => (
                        <li key={o.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-sm text-white">{o.korisnik.ime} {o.korisnik.prezime}</span>
                          <span className="text-xs text-white/40 ml-3 flex-shrink-0">{o.pozicija}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Obriši odjel */}
                <div className="border-t border-white/10 pt-4">
                  <button
                    onClick={() => { setEditModal(null); obrisiOdjel(editModal); }}
                    className={`w-full py-2 rounded-lg text-sm transition-colors ${editModal.doktori.length > 0 || editModal.osoblje.length > 0 ? "bg-white/5 text-white/25 cursor-not-allowed" : "bg-red-500/10 hover:bg-red-500/20 text-red-400"}`}
                    disabled={editModal.doktori.length > 0 || editModal.osoblje.length > 0}
                  >
                    Obriši odjel
                  </button>
                  {(editModal.doktori.length > 0 || editModal.osoblje.length > 0) && (
                    <p className="text-[11px] text-white/25 mt-1 text-center">Uklonite sve članove prije brisanja odjela.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Novi odjel modal */}
      {noviModal && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4" onClick={() => setNoviModal(false)}>
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-white mb-4">Novi odjel</h3>
            <div className="space-y-3 mb-5">
              <input value={novaForma.naziv} onChange={(e) => setNovaForma({ ...novaForma, naziv: e.target.value })} onKeyDown={(e) => e.key === "Enter" && snimiNovi()} placeholder="Naziv odjela *" className={inp} />
              <input value={novaForma.opis} onChange={(e) => setNovaForma({ ...novaForma, opis: e.target.value })} placeholder="Opis (opcionalno)" className={inp} />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setNoviModal(false); setNovaForma({ naziv: "", opis: "" }); }} className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white border border-white/10 transition-colors">Odustani</button>
              <button onClick={snimiNovi} disabled={!novaForma.naziv.trim()} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors disabled:opacity-40">Sačuvaj</button>
            </div>
          </div>
        </div>
      )}

      {/* Potvrda modal */}
      {potvrda && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <p className="text-white text-sm mb-5 leading-relaxed">{potvrda.poruka}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPotvrda(null)} className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-colors">Odustani</button>
              <button onClick={() => { potvrda.onPotvrdi(); setPotvrda(null); }} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">Potvrdi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TAB: ANALITIKA
// ══════════════════════════════════════════════════════════════
function TabAnalitika() {
  const [data, setData] = useState<AnalitikaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterOdjel, setFilterOdjel] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/admin/analitika`, { headers: authHeader() });
        if (res.ok) setData(await res.json());
      } catch { /* silent */ }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <p className="text-center text-white/40 py-16">Učitavanje analitike…</p>;
  if (!data) return <p className="text-center text-red-400 py-16">Greška pri učitavanju analitike.</p>;

  const mjesecNaziv = new Date().toLocaleDateString("bs", { month: "long", year: "numeric" });
  const odjeliUnikati = [...new Set(data.poDoktoru.map((d) => d.odjel))].sort();
  const filtrovaniDoktori = filterOdjel ? data.poDoktoru.filter((d) => d.odjel === filterOdjel) : data.poDoktoru;
  const maxOdjelZakazano = Math.max(...data.poOdjelu.map((o) => o.zakazani), 1);

  return (
    <div className="space-y-7">

      {/* ── Ključne metrike ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Termini danas</p>
          <p className="text-3xl font-bold text-white">{data.terminDanas}</p>
          <p className="text-xs text-white/30 mt-1">zakazana posjeta</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Termini ove sedmice</p>
          <p className="text-3xl font-bold text-teal-400">{data.terminSedmica}</p>
          <p className="text-xs text-white/30 mt-1">zakazana posjeta</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Otkazani / propušteni</p>
          <p className={`text-3xl font-bold ${data.procenatOtkazanih > 20 ? "text-red-400" : data.procenatOtkazanih > 10 ? "text-orange-400" : "text-green-400"}`}>
            {data.procenatOtkazanih}%
          </p>
          <p className="text-xs text-white/30 mt-1">
            {data.otkazaniMjesec} otk. + {data.propusteniMjesec} prop. ovog mj.
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Prosječno čekanje (hitni)</p>
          <p className="text-3xl font-bold text-purple-400">
            {data.prosjecnoVrijemeCekanja !== null ? `${data.prosjecnoVrijemeCekanja}d` : "—"}
          </p>
          <p className="text-xs text-white/30 mt-1">od zakazivanja do termina</p>
        </div>
      </div>

      {/* ── Termini po odjelima ── */}
      <div>
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">
          Termini po odjelima — {mjesecNaziv}
        </h2>
        <div className="space-y-2">
          {data.poOdjelu.length === 0 ? (
            <p className="text-center text-white/40 py-8">Nema podataka za tekući mjesec.</p>
          ) : (
            data.poOdjelu.map((o) => {
              const iskorPct = o.ukupno > 0 ? Math.round((o.zakazani / o.ukupno) * 100) : 0;
              const otkazPct = o.ukupno > 0 ? Math.round((o.otkazani / o.ukupno) * 100) : 0;
              const barPct = Math.round((o.zakazani / maxOdjelZakazano) * 100);
              return (
                <div key={o.naziv} className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{o.naziv}</span>
                    <div className="flex gap-4 text-xs">
                      <span className="text-teal-400">{o.zakazani} zakazano</span>
                      <span className="text-red-400">{o.otkazani} otkazano</span>
                      <span className="text-white/30">{o.slobodni} slobodno</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${barPct}%` }} />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-white/30">
                    <span>{iskorPct}% iskorištenost</span>
                    <span>{otkazPct}% stopa otkazivanja</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Termini po doktorima ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">
            Termini po doktorima — {mjesecNaziv}
          </h2>
          <select
            value={filterOdjel}
            onChange={(e) => setFilterOdjel(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
          >
            <option value="" style={{ background: "#1a1a2e" }}>Svi odjeli</option>
            {odjeliUnikati.map((o) => (
              <option key={o} value={o} style={{ background: "#1a1a2e" }}>{o}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-white/60">
              <tr>
                <th className="px-4 py-3 text-left w-8">#</th>
                <th className="px-4 py-3 text-left">Doktor</th>
                <th className="px-4 py-3 text-left">Odjel</th>
                <th className="px-4 py-3 text-right">Zakazano</th>
                <th className="px-4 py-3 text-right">Otkazano</th>
                <th className="px-4 py-3 text-right">Slobodni</th>
                <th className="px-4 py-3 text-left w-28">Opterećenost</th>
              </tr>
            </thead>
            <tbody className="text-white/80">
              {filtrovaniDoktori.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-white/40">Nema podataka.</td></tr>
              ) : (
                filtrovaniDoktori.map((d, i) => {
                  const barPct = d.ukupno > 0 ? Math.round((d.zakazani / d.ukupno) * 100) : 0;
                  const isNajvise = i === 0 && filtrovaniDoktori.length > 1;
                  const isNajmanje = i === filtrovaniDoktori.length - 1 && filtrovaniDoktori.length > 1;
                  return (
                    <tr key={`${d.ime}-${d.prezime}-${d.odjel}`} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-white/30 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-medium">
                        Dr. {d.ime} {d.prezime}
                        {isNajvise && <span className="ml-2 text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded">Najopterećeniji</span>}
                        {isNajmanje && <span className="ml-2 text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded">Najmanji broj</span>}
                      </td>
                      <td className="px-4 py-3 text-white/50 text-xs">{d.odjel}</td>
                      <td className="px-4 py-3 text-right font-semibold text-teal-400">{d.zakazani}</td>
                      <td className="px-4 py-3 text-right text-red-400">{d.otkazani}</td>
                      <td className="px-4 py-3 text-right text-white/30">{d.slobodni}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden w-20 flex-shrink-0">
                            <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${barPct}%` }} />
                          </div>
                          <span className="text-[11px] text-white/40">{barPct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  GLAVNI ADMIN PANEL
// ══════════════════════════════════════════════════════════════
type Tab = "korisnici" | "raspored" | "termini" | "odjeli" | "analitika";

export default function AdminPanel() {
  const [aktivniTab, setAktivniTab] = useState<Tab>("korisnici");
  const navigate = useNavigate();

  const tabovi: { key: Tab; label: string; opis: string }[] = [
    { key: "korisnici", label: "Korisnici", opis: "Upravljanje nalozima, ulogama i pristupom" },
    { key: "raspored", label: "Raspored", opis: "Radno vrijeme i smjene doktora" },
    { key: "termini", label: "Termini", opis: "Pregled svih zakazanih termina" },
    { key: "odjeli", label: "Odjeli", opis: "Pregled, dodavanje i brisanje odjela" },
    { key: "analitika", label: "Analitika", opis: "Statistike bukiranja po odjelu i doktoru" },
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
        {aktivniTab === "odjeli" && <TabOdjeli />}
        {aktivniTab === "analitika" && <TabAnalitika />}
      </div>
    </div>
  );
}