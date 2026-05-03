import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../config";


type KorisnikInfo = {
  ime: string;
  prezime: string;
  uloga: string;
};

type Odjel = {
  id: number;
  naziv: string;
};

type Doktor = {
  id: number;
  ime: string;
  prezime: string;
  specijalizacija: string;
};

type Termin = {
  id: number;
  datum: string;
  vrijeme: number;
  status: string;
};

type RezervacijaFormData = {
  odjelId: number;
  idDoktor: number;
  idTermina: number;
  idTipPregleda: number;
};

const formatVrijeme = (minute: number): string => {
  const sati = Math.floor(minute / 60).toString().padStart(2, "0");
  const min = (minute % 60).toString().padStart(2, "0");
  return `${sati}:${min}`;
};

function RezervacijaPacijent() {
  const [korisnik] = useState<KorisnikInfo>({ ime: "Marko", prezime: "Marković", uloga: "PACIJENT" });
  const [doktori, setDoktori] = useState<Doktor[]>([]);
  const [termini, setTermini] = useState<Termin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uspjeh, setUspjeh] = useState(false);
  //const apiUrl = import.meta.env.VITE_API_URL;
  const [form, setForm] = useState<RezervacijaFormData>({
    odjelId: 0,
    idDoktor: 0,
    idTermina: 0,
    idTipPregleda: 1,
  });

  const odjeli: Odjel[] = [
    { id: 1, naziv: "Opća medicina" },
    { id: 2, naziv: "Pedijatrija" },
  ];

  const tipoviPregleda = [
    { id: 1, naziv: "Preventivni pregled" },
    { id: 2, naziv: "Kontrolni pregled" },
    { id: 3, naziv: "Hitni pregled" },
  ];

  // DOHVATI DOKTORE kad se izabere odjel
  useEffect(() => {
    if (form.odjelId === 0) {
      setDoktori([]);
      return;
    }
    const fetchDoktori = async () => {
      try {
        const res = await fetch(`${API_URL}/api/doktori?odjelId=${form.odjelId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setDoktori(data);
      } catch {
        setError("Nije moguće učitati doktore.");
      }
    };
    fetchDoktori();
  }, [form.odjelId]);

  // DOHVATI TERMINE kad se izabere doktor
  useEffect(() => {
    if (form.idDoktor === 0) {
      setTermini([]);
      return;
    }
    const fetchTermini = async () => {
      try {
        const res = await fetch(`${API_URL}/api/termini?doktorId=${form.idDoktor}`);
        if (!res.ok) throw new Error();
       const data: Termin[] = await res.json(); 

        // Sortiranje koristeći tvoj tip "Termin"
        const sortiraniTermini = [...data].sort((a, b) => {
          // 1. Sortiranje po datumu (datum je string npr. "2026-05-02")
          const datumCompare = a.datum.localeCompare(b.datum);
          if (datumCompare !== 0) return datumCompare;
          
          // 2. Sortiranje po vremenu (vrijeme je number, npr. 900 ili 1430)
          // Za brojeve koristimo jednostavno oduzimanje
          return a.vrijeme - b.vrijeme;
        });

        setTermini(sortiraniTermini);
        //setTermini(data);
      } catch {
        setError("Nije moguće učitati termine.");
      }
    };
    fetchTermini();
  }, [form.idDoktor]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    const broj = parseInt(value);

    setForm((prev) => {
      if (name === "odjelId") {
        return { ...prev, odjelId: broj, idDoktor: 0, idTermina: 0 };
      }
      if (name === "idDoktor") {
        return { ...prev, idDoktor: broj, idTermina: 0 };
      }
      return { ...prev, [name]: broj };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (form.idDoktor === 0 || form.idTermina === 0) {
      alert("Molimo odaberite doktora i termin.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setUspjeh(false);

      // 1. Zaključaj termin (NFR-22)
      const lockRes = await fetch(`${API_URL}/api/termini/${form.idTermina}/zakljucaj`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!lockRes.ok) throw new Error("Termin je nedostupan. Pokušajte drugi termin.");

      // 2. Kreiraj rezervaciju
<<<<<<< HEAD
      const rezervRes = await fetch(`${API_URL}/api/rezervacije`, {
=======
    
const rezervRes = await fetch(`${apiUrl}/api/rezervacije`, {
>>>>>>> 5096eb19b2e18405208c75844bf4da170f8dda55
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idTermina: form.idTermina,
          idDoktor: form.idDoktor,
          idTipPregleda: form.idTipPregleda,
        }),
      });

      if (!rezervRes.ok) {
        const data = await rezervRes.json();
        throw new Error(data.poruka || "Greška pri rezervaciji.");
      }

      setUspjeh(true);
      setForm({ odjelId: 0, idDoktor: 0, idTermina: 0, idTipPregleda: 1 });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stranica">
      <div className="pacijent-kartica">
        <p className="pacijent-oznaka">Prijavljeni pacijent</p>
        <h2 className="pacijent-ime">{korisnik.ime} {korisnik.prezime}</h2>
      </div>

      <h1 className="forma-naslov">Nova rezervacija</h1>

      {uspjeh && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Rezervacija uspješno kreirana!
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="forma-sadrzaj">

        {/* ODJEL */}
        <div className="forma-polje">
          <label className="polje-oznaka">Izaberite odjel:</label>
          <select
            name="odjelId"
            value={form.odjelId}
            onChange={handleChange}
            className="polje-select"
          >
            <option value={0}>--- Odaberite ---</option>
            {odjeli.map((o) => (
              <option key={o.id} value={o.id}>{o.naziv}</option>
            ))}
          </select>
        </div>

        {/* DOKTOR */}
        <div className="forma-polje">
          <label className="polje-oznaka">Izaberite doktora:</label>
          <select
            name="idDoktor"
            value={form.idDoktor}
            onChange={handleChange}
            className="polje-select"
            disabled={form.odjelId === 0}
          >
            <option value={0}>--- Prvo odaberite odjel ---</option>
            {doktori.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.ime} {d.prezime} — {d.specijalizacija}
              </option>
            ))}
          </select>
        </div>

        {/* TIP PREGLEDA */}
        <div className="forma-polje">
          <label className="polje-oznaka">Tip pregleda:</label>
          <select
            name="idTipPregleda"
            value={form.idTipPregleda}
            onChange={handleChange}
            className="polje-select"
          >
            {tipoviPregleda.map((t) => (
              <option key={t.id} value={t.id}>{t.naziv}</option>
            ))}
          </select>
        </div>

        {/* TERMINI */}
        <div className="forma-polje">
          <label className="polje-oznaka">Dostupni termini:</label>
          <select
            name="idTermina"
            value={form.idTermina}
            onChange={handleChange}
            className="polje-select"
            disabled={form.idDoktor === 0}
          >
            <option value={0}>--- Prvo odaberite doktora ---</option>
            {termini
              .filter((t) => t.status === "SLOBODAN")
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {new Date(t.datum).toLocaleDateString("hr-HR")}, {formatVrijeme(t.vrijeme)}
                </option>
              ))}
          </select>
        </div>

        <button
          type="submit"
          className="dugme-rezervisi"
          disabled={loading || form.idDoktor === 0 || form.idTermina === 0}
        >
          {loading ? "Rezervišem..." : "Potvrdi i rezerviši"}
        </button>

        <Link to="/" className="dugme-odustani">
          Nazad na početnu stranicu
        </Link>

      </form>
    </div>
  );
}

export default RezervacijaPacijent;
