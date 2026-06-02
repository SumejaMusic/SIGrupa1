import { useState, useCallback, useEffect } from "react";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";
const API = `${BASE_URL}/api`;

function authHeader(): Record<string, string> {
  const token = localStorage.getItem("token");
  if (!token) return { "Content-Type": "application/json" };
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

interface Paginacija {
  ukupno: number;
  stranica: number;
  limit: number;
  ukupnoStranica: number;
}

interface AuditLog {
  id: number;
  tipAkcije: string;
  vrijemeAkcije: string;
  izmenjenaTabela: string;
  stariPodaci: string | null;
  noviPodaci: string | null;
  ipAdresa: string | null;
  korisnik: {
    ime: string;
    prezime: string;
    email: string;
    uloga: string;
  };
}

// ── Boje za značke akcija ──────────────────────────────────────
const AKCIJE_BOJE: Record<string, string> = {
  CREATE:                                  "bg-emerald-500/20 text-emerald-300",
  UPDATE:                                  "bg-blue-500/20 text-blue-300",
  UPSERT:                                  "bg-teal-500/20 text-teal-300",
  DELETE:                                  "bg-red-500/20 text-red-300",
  PROMJENA_ULOGE:                          "bg-purple-500/20 text-purple-300",
  BLOKIRANJE_NALOGA:                       "bg-orange-500/20 text-orange-300",
  DEBLOKIRANJE_NALOGA:                     "bg-green-500/20 text-green-300",
  EMAIL_VERIFIKOVAN:                       "bg-indigo-500/20 text-indigo-300",
  LOGIN_NEUSPJESAN:                        "bg-rose-600/20 text-rose-400 font-medium",
  LOGIN_USPJESAN_RESET_NEUSPJELIH_PRIJAVA: "bg-cyan-500/20 text-cyan-300",
  LOGIN_NALOG_ZAKLJUCAN:                   "bg-red-600/30 text-red-400 font-bold border border-red-500/40",
};

// ─────────────────────────────────────────────────────────────
//  Utility: siguran JSON parse koji uvijek vraća objekt ili null
// ─────────────────────────────────────────────────────────────
function safeParseJSON(str: string | null | undefined): Record<string, any> | null {
  if (!str) return null;
  if (typeof str === "object") return str as any;
  try {
    const parsed = JSON.parse(str);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
//  Dohvati korisnika po ID-u (fallback za stare zapise)
// ─────────────────────────────────────────────────────────────
function PrikazKorisnikaPrekoId({
  id,
  labela,
  boja = "red",
}: {
  id: string;
  labela: string;
  boja?: "red" | "amber";
}) {
  const [tekst, setTekst] = useState<string>("Učitavanje...");

  useEffect(() => {
    if (!id || id.length < 1) return;
    fetch(`${BASE_URL}/api/admin/users/${id}`, { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => {
        if (d?.ime) setTekst(`${d.ime} ${d.prezime} (${d.email})`);
        else setTekst(`Korisnik [ID: ${String(id).substring(0, 8)}...]`);
      })
      .catch(() => setTekst(`Korisnik [ID: ${String(id).substring(0, 8)}...]`));
  }, [id]);

  return (
    <div className="p-2 bg-black/20 rounded border border-white/5">
      <span className="text-white/40 block text-[10px] uppercase mb-0.5">{labela}</span>
      <span className={boja === "amber" ? "text-amber-300 font-medium text-sm" : "text-red-300 font-medium text-sm"}>
        {tekst}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Prikaz promjene uloge
//  Podržava novi format (sa ime/prezime) i stari (samo uloga)
// ─────────────────────────────────────────────────────────────
function PrikazPromjeneUloge({ log }: { log: AuditLog }) {
  const stari = safeParseJSON(log.stariPodaci);
  const novi  = safeParseJSON(log.noviPodaci);

  const staraUloga = stari?.uloga ?? "—";
  const novaUloga  = novi?.uloga  ?? "—";

  // Novi format: backend šalje ime/prezime/email u noviPodaci
  const imaIme = !!(novi?.ime);

  // Stari format: noviPodaci nije parsiran objekt, ali ima dvotačke ili je broj
  const jeStariStringFormat =
    !novi &&
    log.noviPodaci &&
    (log.noviPodaci.includes(":") || /^\d+$/.test(log.noviPodaci.trim()));

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 space-y-4">
      <span className="block text-[10px] font-bold text-white/30 uppercase tracking-widest">
        Promjena uloge
      </span>

      {/* Vizualni prikaz stara → nova uloga */}
      <div className="flex items-center gap-4">
        <div>
          <div className="text-[10px] text-white/30 uppercase mb-1.5">Stara uloga</div>
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-300 border border-red-500/20">
            {staraUloga}
          </span>
        </div>
        <span className="text-white/25 text-xl mt-4">→</span>
        <div>
          <div className="text-[10px] text-white/30 uppercase mb-1.5">Nova uloga</div>
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500/15 text-green-300 border border-green-500/20">
            {novaUloga}
          </span>
        </div>
      </div>

      <div className="border-t border-white/5 pt-3 space-y-2">
        {/* NOVI FORMAT: backend šalje ime direktno u noviPodaci */}
        {imaIme && (
          <div className="p-2 bg-black/20 rounded border border-white/5">
            <span className="text-white/40 block text-[10px] uppercase mb-0.5">
              👤 Korisnik kojemu je mijenjana uloga
            </span>
            <span className="text-red-300 font-medium text-sm">
              {novi!.ime} {novi!.prezime}
              {novi!.email && (
                <span className="text-red-300/60 font-normal"> ({novi!.email})</span>
              )}
            </span>
          </div>
        )}

        {/* STARI FORMAT: id je u raw stringu — dohvati po API-ju */}
        {!imaIme && jeStariStringFormat && log.noviPodaci && (
          <PrikazKorisnikaPrekoId
            id={log.noviPodaci.split(":")[0]}
            labela="👤 Korisnik kojemu je mijenjana uloga"
            boja="red"
          />
        )}

        {/* Nema podataka ni na jedan način */}
        {!imaIme && !jeStariStringFormat && (
          <div className="p-2 bg-black/20 rounded border border-white/5 text-xs text-white/30 italic">
            Podaci o korisniku nisu sačuvani u ovom zapisu.
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Prikaz blokiranja / deblokiranja
//  Podržava novi format (sa ime/prezime) i stari (samo boolean)
// ─────────────────────────────────────────────────────────────
function PrikazBlokiranja({ log }: { log: AuditLog }) {
  const novi = safeParseJSON(log.noviPodaci);
  const jeBlokiranje = log.tipAkcije === "BLOKIRANJE_NALOGA";

  // Novi format: backend šalje ime/prezime/email
  const imaIme = !!(novi?.ime);

  // Stari format: noviPodaci je objekt ali bez imena (samo nalogZakljucan)
  const imaStariFormat = novi && !novi.ime;

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 space-y-3">
      <span className="block text-[10px] font-bold text-white/30 uppercase tracking-widest">
        Status naloga
      </span>

      {/* Vizualni prikaz promjene statusa */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${jeBlokiranje ? "bg-green-500" : "bg-red-500"}`} />
          <span className={`text-sm ${jeBlokiranje ? "text-green-300/60" : "text-red-300/60"}`}>
            {jeBlokiranje ? "Aktivan" : "Blokiran"}
          </span>
        </div>
        <span className="text-white/25">→</span>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${jeBlokiranje ? "bg-red-500" : "bg-green-500"}`} />
          <span className={`text-sm font-semibold ${jeBlokiranje ? "text-red-300" : "text-green-300"}`}>
            {jeBlokiranje ? "Blokiran" : "Odblokiran"}
          </span>
        </div>
      </div>

      <div className="border-t border-white/5 pt-3 space-y-2">
        {/* NOVI FORMAT: ima ime */}
        {imaIme && (
          <div className="p-2 bg-black/20 rounded border border-white/5">
            <span className="text-white/40 block text-[10px] uppercase mb-0.5">
              👤 {jeBlokiranje ? "Blokiran korisnik" : "Odblokiran korisnik"}
            </span>
            <span className="text-red-300 font-medium text-sm">
              {novi!.ime} {novi!.prezime}
              {novi!.email && (
                <span className="text-red-300/60 font-normal"> ({novi!.email})</span>
              )}
            </span>
          </div>
        )}

        {/* STARI FORMAT: objekt bez imena — obavijest */}
        {imaStariFormat && (
          <div className="p-3 bg-amber-500/[0.04] border border-amber-500/20 rounded-lg">
            <span className="text-[10px] text-amber-400/70 uppercase font-bold block mb-1">
              ℹ️ Stariji zapis
            </span>
            <span className="text-xs text-white/40">
              Ovaj zapis je kreiran prije nego što je sistem počeo bilježiti ime korisnika.
              Akciju je izvršio{" "}
              <span className="text-amber-300">
                {log.korisnik.ime} {log.korisnik.prezime}
              </span>.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Generički prikaz stari/novi podaci
// ─────────────────────────────────────────────────────────────
function PrikazPodataka({
  podaci,
  boja,
  naslov,
  praznoPoruka,
}: {
  podaci: string | null;
  boja: "red" | "green";
  naslov: string;
  praznoPoruka: string;
}) {
  if (!podaci) {
    return (
      <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center text-xs text-white/30 italic">
        {praznoPoruka}
      </div>
    );
  }

  const parsed = safeParseJSON(podaci);

  // ── Parsiran JSON objekt ──
  if (parsed) {
    const rowBorder = boja === "red" ? "border-red-500/5"        : "border-green-500/5";
    const rowHover  = boja === "red" ? "hover:bg-red-500/[0.05]" : "hover:bg-green-500/[0.05]";
    const keyCls    = boja === "red"
      ? "text-red-400/70 bg-red-500/[0.02] border-red-500/10"
      : "text-green-400/70 bg-green-500/[0.02] border-green-500/10";
    const valCls  = boja === "red" ? "text-red-300/90" : "text-green-200";
    const wrapCls = boja === "red"
      ? "bg-red-500/[0.03] border-red-500/20"
      : "bg-green-500/[0.03] border-green-500/20";
    const prefiks = boja === "red" ? "−" : "+";

    return (
      <div className={`${wrapCls} border rounded-xl overflow-hidden font-mono text-xs`}>
        {Object.entries(parsed).map(([kljuc, vrijednost]) => (
          <div key={kljuc} className={`flex border-b ${rowBorder} ${rowHover} transition-colors`}>
            <div className={`w-1/3 px-4 py-2 ${keyCls} border-r select-none truncate`}>
              {prefiks} {kljuc}
            </div>
            <div className={`w-2/3 px-4 py-2 ${valCls} whitespace-pre-wrap break-all`}>
              {typeof vrijednost === "object"
                ? JSON.stringify(vrijednost, null, 2)
                : String(vrijednost)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── String s dvotačkama (sigurnosni format: id:adminId:hash) ──
  if (podaci.includes(":")) {
    const dijelovi = podaci.split(":");
    const titleCls = boja === "red" ? "text-red-400" : "text-green-400";

    return (
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
        <span className={`text-[10px] font-bold ${titleCls} uppercase tracking-wider block`}>
          {naslov}
        </span>
        {dijelovi[0] && (
          <div className="p-2 bg-black/20 rounded border border-white/5">
            <span className="text-white/40 block text-[10px] uppercase mb-0.5">👤 ID korisnika</span>
            <span className="text-red-300 font-medium text-xs break-all">{dijelovi[0]}</span>
          </div>
        )}
        {dijelovi[1] && (
          <div className="p-2 bg-black/20 rounded border border-white/5">
            <span className="text-white/40 block text-[10px] uppercase mb-0.5">🛠️ ID administratora / sistema</span>
            <span className="text-amber-300 font-medium text-xs break-all">{dijelovi[1]}</span>
          </div>
        )}
        {dijelovi[2] && (
          <div className="p-2 bg-black/20 rounded border border-white/5">
            <span className="text-white/40 block text-[10px] uppercase mb-0.5">🔐 Sigurnosni kripto hash</span>
            <span className="text-white/25 break-all text-[11px] font-mono">
              {dijelovi.slice(2).join(":")}
            </span>
          </div>
        )}
      </div>
    );
  }

  // ── Čisti string ──
  const textCls =
    boja === "red"
      ? "bg-red-500/[0.03] border-red-500/20 text-red-300"
      : "bg-green-500/[0.03] border-green-500/20 text-green-200";

  return (
    <div className={`p-4 rounded-xl ${textCls} border font-mono text-xs break-all`}>
      {podaci}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Rezime akcije (čitljiv tekst)
// ─────────────────────────────────────────────────────────────
function generisiRezime(log: AuditLog): string {
  const admin = `${log.korisnik.ime} ${log.korisnik.prezime} (${log.korisnik.uloga})`;
  const stari = safeParseJSON(log.stariPodaci);
  const novi  = safeParseJSON(log.noviPodaci);

  switch (log.tipAkcije) {
    case "CREATE":
      return `Administrator ${admin} je kreirao novi zapis u tabeli [${log.izmenjenaTabela}].`;

    case "DELETE":
      return `Administrator ${admin} je OBRISAO zapis iz tabele [${log.izmenjenaTabela}].`;

    case "PROMJENA_ULOGE": {
      const staraUloga = stari?.uloga ?? "?";
      const novaUloga  = novi?.uloga  ?? "?";
      if (novi?.ime) {
        return `Administrator ${admin} je promijenio ulogu korisniku ${novi.ime} ${novi.prezime} iz "${staraUloga}" u "${novaUloga}".`;
      }
      return `Administrator ${admin} je promijenio ulogu korisniku iz "${staraUloga}" u "${novaUloga}".`;
    }

    case "BLOKIRANJE_NALOGA": {
      const koIme = novi?.ime ? `${novi.ime} ${novi.prezime}` : "nepoznatom korisniku";
      return `Administrator ${admin} je BLOKIRAO nalog korisniku ${koIme}.`;
    }

    case "DEBLOKIRANJE_NALOGA": {
      const koIme = novi?.ime ? `${novi.ime} ${novi.prezime}` : "nepoznatom korisniku";
      return `Administrator ${admin} je ODBLOKIRAO nalog korisniku ${koIme}.`;
    }

    case "LOGIN_NALOG_ZAKLJUCAN":
      return `Sistem je automatski zaključao nalog zbog previše neuspješnih pokušaja prijave.`;

    case "LOGIN_NEUSPJESAN":
      return `Zabilježen neuspješan pokušaj prijave.`;

    case "LOGIN_USPJESAN_RESET_NEUSPJELIH_PRIJAVA":
      return `Uspješna prijava — broj neuspjelih pokušaja je resetiran na 0.`;

    case "UPDATE": {
      if (!stari || !novi) {
        return `Administrator ${admin} je ažurirao zapis u tabeli [${log.izmenjenaTabela}].`;
      }
      const razlike = Object.keys(novi)
        .filter((k) => k !== "profilPodaci" && stari[k] !== novi[k])
        .map((k) => `[${k}] "${stari[k] ?? "prazno"}" → "${novi[k] ?? "prazno"}"`);
      return razlike.length > 0
        ? `Administrator ${admin} je ažurirao [${log.izmenjenaTabela}] za ${novi.ime ?? ""} ${novi.prezime ?? ""}. Izmjene: ${razlike.join(", ")}`
        : `Administrator ${admin} je sačuvao formu za [${log.izmenjenaTabela}] bez izmjena vrijednosti.`;
    }

    case "UPSERT":
      return `Administrator ${admin} je kreirao ili ažurirao šablon u tabeli [${log.izmenjenaTabela}].`;

    default:
      return `Administrator ${admin} je izvršio akciju [${log.tipAkcije}] nad tabelom [${log.izmenjenaTabela}].`;
  }
}

// ─────────────────────────────────────────────────────────────
//  Stari/Novi blok (za generičke tipove)
// ─────────────────────────────────────────────────────────────
function StariNoviBlok({ log }: { log: AuditLog }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Stari Podaci (Prije akcije)
          </h4>
        </div>
        <PrikazPodataka
          podaci={log.stariPodaci}
          boja="red"
          naslov="Sigurnosni zapis (Prije izmjene)"
          praznoPoruka="Nema prethodnih podataka"
        />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Novi Podaci (Nakon akcije)
          </h4>
        </div>
        <PrikazPodataka
          podaci={log.noviPodaci}
          boja="green"
          naslov="Sigurnosni zapis (Nakon izmjene)"
          praznoPoruka="Nema novih podataka"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Glavna komponenta
// ─────────────────────────────────────────────────────────────
export default function TabAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [paginacija, setPaginacija] = useState<Paginacija | null>(null);
  const [stranica, setStranica] = useState(1);
  const [filterAkcija, setFilterAkcija] = useState("");
  const [filterTabela, setFilterTabela] = useState("");
  const [datumOd, setDatumOd] = useState("");
  const [datumDo, setDatumDo] = useState("");
  const [loading, setLoading] = useState(false);
  const [odabraniLog, setOdabraniLog] = useState<AuditLog | null>(null);

  const dohvati = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ stranica: String(stranica), limit: "20" });
      if (filterAkcija) params.set("tipAkcije", filterAkcija);
      if (filterTabela) params.set("izmenjenaTabela", filterTabela);
      if (datumOd) params.set("datumOd", new Date(`${datumOd}T00:00:00.000Z`).toISOString());
      if (datumDo) params.set("datumDo", new Date(`${datumDo}T23:59:59.999Z`).toISOString());

      const res  = await fetch(`${API}/admin/audit-logs?${params}`, { headers: authHeader() });
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs);
        setPaginacija(data.paginacija);
      }
    } catch {
      console.error("Greška pri dohvatanju audit logova");
    }
    setLoading(false);
  }, [stranica, filterAkcija, filterTabela, datumOd, datumDo]);

  useEffect(() => { dohvati(); }, [dohvati]);

  const formatVrijeme = (iso: string) => {
    const d   = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
    const dd  = String(d.getDate()).padStart(2, "0");
    const mm  = String(d.getMonth() + 1).padStart(2, "0");
    const hh  = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss  = String(d.getSeconds()).padStart(2, "0");
    return `${dd}.${mm}.${d.getFullYear()}. u ${hh}:${min}:${ss}`;
  };

  function renderModalSadrzaj(log: AuditLog) {
    switch (log.tipAkcije) {
      case "PROMJENA_ULOGE":
        return <PrikazPromjeneUloge log={log} />;
      case "BLOKIRANJE_NALOGA":
      case "DEBLOKIRANJE_NALOGA":
        return <PrikazBlokiranja log={log} />;
      default:
        return <StariNoviBlok log={log} />;
    }
  }

  return (
    <div>
      {/* ── Filteri ── */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={filterAkcija}
          onChange={(e) => { setFilterAkcija(e.target.value); setStranica(1); }}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="" style={{ background: "#1a1a2e" }}>Sve akcije</option>
          {Object.keys(AKCIJE_BOJE).map((a) => (
            <option key={a} value={a} style={{ background: "#1a1a2e" }}>{a}</option>
          ))}
        </select>

        <select
          value={filterTabela}
          onChange={(e) => { setFilterTabela(e.target.value); setStranica(1); }}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="" style={{ background: "#1a1a2e" }}>Sve tabele</option>
          {["Korisnik","RasporedDoktora","Termin","Odjel","Pacijent",
            "MedicinskiKarton","Uputnica","Recept","Racun"].map((t) => (
            <option key={t} value={t} style={{ background: "#1a1a2e" }}>{t}</option>
          ))}
        </select>

        <input
          type="date" value={datumOd}
          onChange={(e) => { setDatumOd(e.target.value); setStranica(1); }}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
        />
        <input
          type="date" value={datumDo}
          onChange={(e) => { setDatumDo(e.target.value); setStranica(1); }}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
        />

        <span className="ml-auto text-xs text-white/30 self-center">
          {paginacija?.ukupno ?? 0} zapisa ukupno
        </span>
      </div>

      {/* ── Tabela ── */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/60">
            <tr>
              <th className="px-4 py-3 text-left">Vrijeme</th>
              <th className="px-4 py-3 text-left">Administrator</th>
              <th className="px-4 py-3 text-left">Akcija</th>
              <th className="px-4 py-3 text-left">Tabela</th>
              <th className="px-4 py-3 text-left">IP adresa</th>
              <th className="px-4 py-3 text-right">Detalji</th>
            </tr>
          </thead>
          <tbody className="text-white/80">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/40">Učitavanje...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/40">Nema zapisa.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">
                    {formatVrijeme(log.vrijemeAkcije)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm">{log.korisnik.ime} {log.korisnik.prezime}</div>
                    <div className="text-xs text-white/40">{log.korisnik.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      AKCIJE_BOJE[log.tipAkcije] ?? "bg-gray-500/20 text-gray-300"
                    }`}>
                      {log.tipAkcije}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/50 text-xs">{log.izmenjenaTabela}</td>
                  <td className="px-4 py-3 text-white/30 text-xs font-mono">{log.ipAdresa ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {(log.stariPodaci || log.noviPodaci) && (
                      <button
                        onClick={() => setOdabraniLog(log)}
                        className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        Pregledaj
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Paginacija ── */}
      {paginacija && paginacija.ukupnoStranica > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={stranica === 1}
            onClick={() => setStranica(stranica - 1)}
            className="px-3 py-1 rounded bg-white/10 text-sm disabled:opacity-30 hover:bg-white/20"
          >
            ← Prethodna
          </button>
          <span className="px-3 py-1 text-sm text-white/50">
            {stranica} / {paginacija.ukupnoStranica}
          </span>
          <button
            disabled={stranica === paginacija.ukupnoStranica}
            onClick={() => setStranica(stranica + 1)}
            className="px-3 py-1 rounded bg-white/10 text-sm disabled:opacity-30 hover:bg-white/20"
          >
            Sljedeća →
          </button>
        </div>
      )}

      {/* ── Modal ── */}
      {odabraniLog && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOdabraniLog(null)}
        >
          <div
            className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Zaglavlje */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide uppercase ${
                    AKCIJE_BOJE[odabraniLog.tipAkcije] ?? "bg-gray-500/20 text-gray-300"
                  }`}>
                    {odabraniLog.tipAkcije}
                  </span>
                  <span className="text-xs text-white/40 font-mono">ID: #{odabraniLog.id}</span>
                </div>
                <p className="text-sm text-white/60">
                  Entitet:{" "}
                  <span className="text-purple-400 font-medium">{odabraniLog.izmenjenaTabela}</span>
                  {" · "}
                  {formatVrijeme(odabraniLog.vrijemeAkcije)}
                </p>
              </div>
              <button
                onClick={() => setOdabraniLog(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Sadržaj */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Rezime */}
              <div className="p-4 rounded-xl bg-purple-500/[0.04] border border-purple-500/20 text-sm text-purple-200/90 leading-relaxed">
                <span className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">
                  Rezime akcije
                </span>
                {generisiRezime(odabraniLog)}
              </div>

              {/* Specijalizovani ili generički prikaz */}
              {renderModalSadrzaj(odabraniLog)}
            </div>

            {/* Podnožje */}
            <div className="p-4 border-t border-white/5 bg-white/[0.01] text-right">
              <button
                onClick={() => setOdabraniLog(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-all"
              >
                Zatvori pregled
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}