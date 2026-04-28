import React, { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  User,
  Clock,
  XCircle,
  CalendarX,
  ArrowLeft
} from "lucide-react";

interface Rezervacija {
  id: number;
  doktorIme: string;
  datum: string;
  vrijeme: string;
  komentar: string;
}

interface Poruka {
  tip: 'success' | 'error';
  tekst: string;
}

const mockRezervacije = [
  { id: 1, doktorIme: "Dr. Amar Kovačević", datum: "2026-05-10", vrijeme: "09:00", komentar: "Kontrolni pregled" },
  { id: 2, doktorIme: "Dr. Sara Hadžić", datum: "2026-04-29", vrijeme: "08:30", komentar: "" },
  { id: 3, doktorIme: "Dr. Emir Selimović", datum: "2026-05-02", vrijeme: "11:00", komentar: "Donijeti nalaze" },
];

const MojeRezervacije = () => {
  const [rezervacije, setRezervacije] = useState<Rezervacija[]>(mockRezervacije);
  const [poruka, setPoruka] = useState<Poruka | null>(null);

  const mozeSeOtkazati = (datum: string, vrijeme: string) => {
  const termin = new Date(`${datum}T${vrijeme}`);
  const sada = new Date();
  return (termin.getTime() - sada.getTime()) / (1000 * 60 * 60) > 24;
};

  const handleOtkazi = (id: number) => {
    if (!window.confirm("Da li ste sigurni da želite otkazati ovaj termin?")) return;
    setRezervacije(prev => prev.filter(r => r.id !== id));
    setPoruka({ tip: 'success', tekst: "Termin uspješno otkazan." });
    setTimeout(() => setPoruka(null), 4000);
  };

  return (
    <div className="mr-page">
      <div className="mr-container">

        <div className="mr-top-nav">
          <a href="/" className="mr-nazad-btn">
            <ArrowLeft size={16} />
            Nazad na početnu stranicu
          </a>
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
              const dozvoljeno = mozeSeOtkazati(res.datum, res.vrijeme);
              return (
                <div key={res.id} className="mr-card">
                  <div className="mr-card__left">
                    <div className="mr-doctor-name">
                      <User size={18} color="#2563eb" />
                      {res.doktorIme}
                    </div>

                    <div className="mr-meta-row">
                      <span className="mr-meta-badge">
                        <Calendar size={14} />
                        {new Date(res.datum).toLocaleDateString('hr-HR')}
                      </span>
                      <span className="mr-meta-badge">
                        <Clock size={14} />
                        {res.vrijeme}
                      </span>
                    </div>

                    {res.komentar && (
                      <div className="mr-komentar">
                        <p className="mr-komentar__label">Napomena</p>
                        <p className="mr-komentar__tekst">{res.komentar}</p>
                      </div>
                    )}
                  </div>

                  <div className="mr-card__right">
                    {dozvoljeno ? (
                      <button className="mr-otkazi-btn" onClick={() => handleOtkazi(res.id)}>
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
              <a href="/rezervacija-pacijent" className="mr-zakazi-btn">
                Zakaži odmah
              </a>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MojeRezervacije;