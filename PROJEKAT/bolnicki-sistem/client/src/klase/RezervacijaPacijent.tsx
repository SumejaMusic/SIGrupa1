import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';

type KorisnikInfo = {
  ime: string;
  prezime: string;
  uloga: string;
};

type RezervacijaFormData = {
  idPacijent: number;
  idDoktor: number;
  idTermina: number;
  idTipPregleda: number;
  komentar: string;
  hitnost: boolean;
};

function RezervacijaPacijent() {
  const [korisnik, setKorisnik] = useState<KorisnikInfo | null>(null);

  const [form, setForm] = useState<RezervacijaFormData>({
    idPacijent: 1,
    idDoktor: 0,
    idTermina: 0,
    idTipPregleda: 0,
    komentar: "",
    hitnost: false
  });

  // SIMULACIJA ULOGOVANOG KORISNIKA
  // useEffect simulira poziv API-ju koji provjerava ko je ulogovan
  useEffect(() => {
    // Ovako bi izgledao poziv: fetch('/api/auth/me').then(...)
    setKorisnik({
      ime: "Marko",
      prezime: "Marković",
      uloga: "PACIJENT"
    });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : name.startsWith('id') ? parseInt(value) : value;

    setForm({ ...form, [name]: val });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Slanje rezervacije za pacijenta ID:", form.idPacijent);
    alert(`Pacijent ${korisnik?.ime} ${korisnik?.prezime} je uspješno rezervisao termin!`);
  };

  return (
    <div className="stranica">

      {/* Kartica s imenom prijavljenog pacijenta */}
      <div className="pacijent-kartica">
        <p className="pacijent-oznaka">Prijavljeni pacijent</p>
        <h2 className="pacijent-ime">
          {korisnik ? `${korisnik.ime} ${korisnik.prezime}` : "Učitavanje..."}
        </h2>
      </div>

      <h1 className="forma-naslov">Nova Rezervacija</h1>

      <form onSubmit={handleSubmit} className="forma-sadrzaj">

        {/* DOKTOR */}
        <div className="forma-polje">
          <label className="polje-oznaka">Izaberite doktora:</label>
          <select name="idDoktor" onChange={handleChange} className="polje-select">
            <option value="0">--- Odaberite ---</option>
            <option value="10">Dr. Amar Arslanagić</option>
            <option value="11">Dr. Sara Sarić</option>
          </select>
        </div>

        {/* TERMIN */}
        <div className="forma-polje">
          <label className="polje-oznaka">Dostupni termini:</label>
          <select name="idTermina" onChange={handleChange} className="polje-select">
            <option value="0">--- Odaberite vrijeme ---</option>
            <option value="101">Danas, 10:00h</option>
            <option value="102">Danas, 11:30h</option>
          </select>
        </div>

        {/* HITNOST */}
        <div className="hitnost-red">
          <input
            type="checkbox"
            name="hitnost"
            checked={form.hitnost}
            onChange={handleChange}
            id="hitno"
            className="hitnost-checkbox"
          />
          <label htmlFor="hitno" className="hitnost-oznaka">Označi kao HITAN slučaj</label>
        </div>

        {/* KOMENTAR */}
        <div className="forma-polje">
          <label className="polje-oznaka">Dodatna napomena:</label>
          <textarea
            name="komentar"
            value={form.komentar}
            onChange={handleChange}
            className="polje-textarea"
            placeholder="Unesite simptome ili razlog posjete..."
          />
        </div>

        <button type="submit" className="dugme-rezervisi">
          Potvrdi i Rezerviši
        </button>
        <Link to="/" className="dugme-odustani">
          Odustani
        </Link>
      </form>
    </div>
  );
}

export default RezervacijaPacijent;