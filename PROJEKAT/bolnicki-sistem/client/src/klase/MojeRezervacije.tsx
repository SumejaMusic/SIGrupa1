import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  User,
  Clock,
  XCircle,
  CalendarX,
  ArrowLeft,
  Loader2
} from "lucide-react";

interface Termin {
  datum: string;
  vrijeme: string;
}

interface Doktor {
  korisnik: {
    ime: string;
    prezime: string;
  };
}

interface Rezervacija {
  id: number;
  termin: Termin;
  doktor: Doktor;
  komentar?: string;
}

interface Poruka {
  tip: 'success' | 'error';
  tekst: string;
}

const MojeRezervacije = () => {
  const [rezervacije, setRezervacije] = useState<Rezervacija[]>([]);
  const [loading, setLoading] = useState(true);
  const [poruka, setPoruka] = useState<Poruka | null>(null);

  // DOHVATANJE PODATAKA SA BACKENDA (US-05/US-10)
  useEffect(() => {
    const fetchRezervacije = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/rezervacije/moje');
        if (!response.ok) throw new Error('Greška na serveru');
        const data = await response.json();
        setRezervacije(data);
      } catch (err) {
        console.error("Greška pri učitavanju:", err);
        setPoruka({ tip: 'error', tekst: "Nije moguće učitati rezervacije." });
      } finally {
        setLoading(false);
      }
    };

    fetchRezervacije();
  }, []);

  // PROVJERA 24h (NFR-10)
  const mozeSeOtkazati = (datum: string, vrijeme: string) => {
    const termin = new Date(`${datum}T${vrijeme}`);
    const sada = new Date();
    return (termin.getTime() - sada.getTime()) / (1000 * 60 * 60) > 24;
  };

  // OTKAZIVANJE TERMINA (US-10, NFR-09, NFR-11)
  const handleOtkazi = async (id: number) => {
    if (!window.confirm("Jeste li sigurni da želite otkazati ovaj termin?")) return;

    try {
      const response = await fetch(`/api/rezervacije/${id}/otkazi/pacijent`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setRezervacije(prev => prev.filter(r => r.id !== id));
        setPoruka({ tip: 'success', tekst: "Rezervacija uspješno otkazana. Email obavijest je poslana." });
      } else {
        const data = await response.json();
        throw new Error(data.poruka || "Greška na serveru");
      }
    } catch (err: any) {
      setPoruka({ tip: 'error', tekst: err.message || "Otkazivanje nije uspjelo. Pokušajte ponovo." });
    }

    setTimeout(() => setPoruka(null), 4000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="mr-page">
      <div className="mr-container">

        <div className="mr-top-nav">
          <Link to="/" className="mr-nazad-btn">
            <ArrowLeft size={16} />
            Nazad na početnu stranicu
          </Link>
        </div>

        <h1 className="mr-heading">
          <Calendar size={26} color="#2563eb" />
          Moje Rezervacije
        </h1>

        {poruka && (
          <div className={`mr-alert mr-alert--${poruka.tip}`}>
            {poruka.tip === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {poruka.tekst}
          </div>
        )}

        <div className="mr-list">
          {rezervacije.length > 0 ? (
            rezervacije.map((res) => {
              const dozvoljeno = mozeSeOtkazati(res.termin.datum, res.termin.vrijeme);

              return (
                <div key={res.id} className="mr-card">
                  <div className="mr-card__left">
                    <div className="mr-doctor-name">
                      <User size={18} color="#2563eb" />
                      Dr. {res.doktor.korisnik.ime} {res.doktor.korisnik.prezime}
                    </div>

                    <div className="mr-meta-row">
                      <span className="mr-meta-badge">
                        <Calendar size={14} />
                        {new Date(res.termin.datum).toLocaleDateString('hr-HR')}
                      </span>
                      <span className="mr-meta-badge">
                        <Clock size={14} />
                        {res.termin.vrijeme}
                      </span>
                    </div>

                    {res.komentar && (
                      <div className="mr-komentar">
                        <p className="mr-komentar__label">Napomena:</p>
                        <p className="mr-komentar__tekst">{res.komentar}</p>
                      </div>
                    )}
                  </div>

                  <div className="mr-card__right">
                    {dozvoljeno ? (
                      <button
                        className="mr-otkazi-btn"
                        onClick={() => handleOtkazi(res.id)}
                      >
                        <XCircle size={16} /> Otkaži termin
                      </button>
                    ) : (
                      <div className="mr-zakljucano">
                        <span className="mr-zakljucano__badge">Zaključano</span>
                        <p className="mr-zakljucano__tekst">
                          Manje od 24h do termina. Otkazivanje nije moguće.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="mr-prazno">
              <CalendarX size={52} className="mr-prazno__ikona" />
              <p className="mr-prazno__tekst">Nemate zakazanih termina.</p>
              <Link to="/rezervacija-pacijent" className="mr-zakazi-btn">
                Zakaži odmah
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MojeRezervacije;
