import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

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
  odjelId: number;
};

type Termin = {
  id: number;
  datum: string;
  vrijeme: string;
  status: string;
};

type RezervacijaFormData = {
  idPacijent: number;
  odjelId: number;
  idDoktor: number;
  idTermina: number;
  idTipPregleda: number;
  komentar: string;
  hitnost: boolean;
};

function RezervacijaPacijent() {
  const [korisnik, setKorisnik] = useState<KorisnikInfo | null>(null);
  const [doktori, setDoktori] = useState<Doktor[]>([]);
  const [termini, setTermini] = useState<Termin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<RezervacijaFormData>({
    idPacijent: 1, // hardkodirano za testiranje
    odjelId: 0,
    idDoktor: 0,
    idTermina: 0,
    idTipPregleda: 0,
    komentar: "",
    hitnost: false,
  });

  // Mock odjeli — zamijeniti API pozivom kada backend endpoint bude spreman
  const odjeli: Odjel[] = [
    { id: 1, naziv: "Opća medicina" },
    { id: 2, naziv: "Pedijatrija" },
  ];

  // SIMULACIJA ULOGOVANOG KORISNIKA
  useEffect(() => {
    setKorisnik({
      ime: "Marko",
      prezime: "Marković",
      uloga: "PACIJENT",
    });
  }, []);

  // DOHVATI DOKTORE SA BACKENDA (filtrirano po odjelu)
  useEffect(() => {
    if (form.odjelId === 0) {
      setDoktori([]);
      return;
    }

    const fetchDoktori = async () => {
      try {
        const response = await fetch(`/api/doktori?odjelId=${form.odjelId}`);
        if (!response.ok) throw new Error("Greška pri učitavanju doktora");
        const data = await response.json();
        setDoktori(data);
      } catch (err) {
        console.error("Greška pri učitavanju doktora:", err);
        setError("Nije moguće učitati doktore");
      }
    };
    fetchDoktori();
  }, [form.odjelId]);

  // DOHVATI TERMINE KADA SE IZABERE DOKTOR
  useEffect(() => {
    if (form.idDoktor === 0) {
      setTermini([]);
      return;
    }

    const fetchTermini = async () => {
      try {
        const response = await fetch(`/api/termini?doktorId=${form.idDoktor}`);
        if (!response.ok) throw new Error("Greška pri učitavanju termina");
        const data = await response.json();
        setTermini(data);
      } catch (err) {
        console.error("Greška pri učitavanju termina:", err);
        setError("Nije moguće učitati termine");
      }
    };
    fetchTermini();
  }, [form.idDoktor]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const val =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : ["odjelId", "idDoktor", "idTermina", "idTipPregleda"].includes(name)
        ? parseInt(value)
        : value;

    setForm((prev) => {
      // Reset downstream fields when odjel changes
      if (name === "odjelId") {
        return { ...prev, odjelId: parseInt(value), idDoktor: 0, idTermina: 0 };
      }
      // Reset termin when doktor changes
      if (name === "idDoktor") {
        return { ...prev, idDoktor: parseInt(value), idTermina: 0 };
      }
      return { ...prev, [name]: val };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      form.odjelId === 0 ||
      form.idDoktor === 0 ||
      form.idTermina === 0 ||
      form.idTipPregleda === 0
    ) {
      alert("Molimo odaberite sva polja.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/rezervacije", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idPacijent: form.idPacijent,
          idDoktor: form.idDoktor,
          idTermina: form.idTermina,
          idTipPregleda: form.idTipPregleda,
          komentar: form.komentar,
          hitnost: form.hitnost,
        }),
      });

      if (!response.ok) throw new Error("Greška pri rezervaciji");

      alert("Uspješno rezervisano!");
    } catch (err) {
      console.error("Greška pri rezervaciji:", err);
      setError("Rezervacija nije uspjela. Pokušajte ponovo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stranica">
      <div className="pacijent-kartica">
        <p className="pacijent-oznaka">Prijavljeni pacijent</p>
        <h2 className="pacijent-ime">
          {korisnik ? `${korisnik.ime} ${korisnik.prezime}` : "Učitavanje..."}
        </h2>
      </div>

      <h1 className="forma-naslov">Nova rezervacija</h1>

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
            onChange={handleChange}
            value={form.odjelId}
            className="polje-select"
          >
            <option value={0}>--- Odaberite ---</option>
            {odjeli.map((o) => (
              <option key={o.id} value={o.id}>
                {o.naziv}
              </option>
            ))}
          </select>
        </div>

        {/* DOKTOR */}
        <div className="forma-polje">
          <label className="polje-oznaka">Izaberite doktora:</label>
          <select
            name="idDoktor"
            onChange={handleChange}
            value={form.idDoktor}
            className="polje-select"
            disabled={form.odjelId === 0}
          >
            <option value={0}>--- Prvo odaberite odjel ---</option>
            {doktori.map((d) => (
              <option key={d.id} value={d.id}>
                {d.ime} {d.prezime}
              </option>
            ))}
          </select>
        </div>

        {/* TIP PREGLEDA */}
        <div className="forma-polje">
          <label className="polje-oznaka">Tip pregleda:</label>
          <select
            name="idTipPregleda"
            onChange={handleChange}
            value={form.idTipPregleda}
            className="polje-select"
          >
            <option value={0}>--- Odaberite ---</option>
            <option value={1}>Preventivni pregled</option>
            <option value={2}>Kontrolni pregled</option>
            <option value={3}>Hitni pregled</option>
          </select>
        </div>

        {/* TERMINI */}
        <div className="forma-polje">
          <label className="polje-oznaka">Dostupni termini:</label>
          <select
            name="idTermina"
            onChange={handleChange}
            value={form.idTermina}
            className="polje-select"
            disabled={form.idDoktor === 0}
          >
            <option value={0}>--- Prvo odaberite doktora ---</option>
            {termini
              .filter((t) => t.status === "SLOBODAN")
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {new Date(t.datum).toLocaleDateString("hr-HR")}, {t.vrijeme}
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
