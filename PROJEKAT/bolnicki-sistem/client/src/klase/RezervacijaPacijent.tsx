import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

type KorisnikInfo = {
  ime: string;
  prezime: string;
  uloga: string;
};

type RezervacijaFormData = {
  odjelId: number;
  doktorId: number;
  terminId: number;
  tipPregledaId: number;
};

function RezervacijaPacijent() {
  const [korisnik, setKorisnik] = useState<KorisnikInfo | null>(null);

  const [form, setForm] = useState<RezervacijaFormData>({
    odjelId: 0,
    doktorId: 0,
    terminId: 0,
    tipPregledaId: 0,
  });

// mock podaci
  const odjeli = [
    { id: 1, naziv: "Opća medicina" },
    { id: 2, naziv: "Pedijatrija" },
  ];

  const doktori = [
    { id: 1, ime: "Dr. Amar Hadžić", odjelId: 1 },
    { id: 2, ime: "Dr. Aida Nukić", odjelId: 2 },
  ];

  const termini = [
    { id: 1, label: "13.04.2026 09:00", doktorId: 1 },
    { id: 2, label: "13.04.2026 09:30", doktorId: 1 },
    { id: 3, label: "13.04.2026 10:00", doktorId: 2 },
  ];

  // ─────────────────────────────────────────────
  useEffect(() => {
    setKorisnik({
      ime: "Marko",
      prezime: "Marković",
      uloga: "PACIJENT",
    });
  }, []);

  const filtriraniDoktori = doktori.filter(
    (d) => d.odjelId === form.odjelId
  );

  const filtriraniTermini = termini.filter(
    (t) => t.doktorId === form.doktorId
  );

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    const num = parseInt(value);

    setForm((prev) => {
      if (name === "odjelId") {
        return {
          ...prev,
          odjelId: num,
          doktorId: 0,
          terminId: 0,
        };
      }

      if (name === "doktorId") {
        return {
          ...prev,
          doktorId: num,
          terminId: 0,
        };
      }

      return { ...prev, [name]: num };
    });
  };

  // ─────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      form.odjelId === 0 ||
      form.doktorId === 0 ||
      form.terminId === 0 ||
      form.tipPregledaId === 0
    ) {
      alert("Molimo odaberite sva polja.");
      return;
    }

    console.log("FORM DATA:", form);
    alert("Uspješno rezervisano");
  };

  // ─────────────────────────────────────────────
  return (
    <div className="stranica">
      <div className="pacijent-kartica">
        <p className="pacijent-oznaka">Prijavljeni pacijent</p>
        <h2 className="pacijent-ime">
          {korisnik ? `${korisnik.ime} ${korisnik.prezime}` : "Učitavanje..."}
        </h2>
      </div>

      <h1 className="forma-naslov">Nova rezervacija</h1>

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
            name="doktorId"
            onChange={handleChange}
            value={form.doktorId}
            className="polje-select"
          >
            <option value={0}>--- Prvo odaberite odjel ---</option>
            {filtriraniDoktori.map((d) => (
              <option key={d.id} value={d.id}>
                {d.ime}
              </option>
            ))}
          </select>
        </div>

        {/* TIP PREGLEDA */}
        <div className="forma-polje">
          <label className="polje-oznaka">Tip pregleda:</label>
          <select
            name="tipPregledaId"
            onChange={handleChange}
            value={form.tipPregledaId}
            className="polje-select"
          >
            <option value={0}>--- Odaberite ---</option>
            <option value={1}>Preventivni pregled</option>
          </select>
        </div>

        {/* TERMINI */}
        <div className="forma-polje">
          <label className="polje-oznaka">Slobodni termini:</label>
          <select
            name="terminId"
            onChange={handleChange}
            value={form.terminId}
            className="polje-select"
          >
            <option value={0}>--- Prvo odaberite doktora ---</option>
            {filtriraniTermini.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="dugme-rezervisi">
          Potvrdi i rezerviši
        </button>

        <Link to="/" className="dugme-odustani">
          Nazad na početnu stranicu
        </Link>
      </form>
    </div>
  );
}

export default RezervacijaPacijent;