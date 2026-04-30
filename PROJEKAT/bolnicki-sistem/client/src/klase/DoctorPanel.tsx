import React, { useState, useEffect } from "react";
import { Calendar, Users, Clock, ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface Appointment {
  id: number;
  termin: {
    vrijeme: number;
    datum: string;
  };
  pacijent: {
    korisnik: {
      ime: string;
      prezime: string;
    };
  };
  status?: string;
}

const DoctorPanel: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  // DOHVATI REZERVACIJE ZA DOKTORA (hardkodirano doktorId = 1)
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/api/rezervacije/doktor/1`);
        if (!response.ok) throw new Error('Greška pri učitavanju rezervacija');
        const data = await response.json();
        setAppointments(data);
      } catch (err) {
        console.error('Greška pri učitavanju rezervacija:', err);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  // Redoslijed statusa
  const statusFlow = ["ČEKA", "U TOKU", "ZAVRŠENO"];

  // Promjena statusa klikom
  const handleStatusChange = (id: number) => {
    setAppointments((prev) =>
      prev.map((app) => {
        if (app.id !== id) return app;
        const currentIndex = statusFlow.indexOf(app.status || "ČEKA");
        const nextIndex = (currentIndex + 1) % statusFlow.length;
        return { ...app, status: statusFlow[nextIndex] };
      })
    );
  };

  const getTimeFromMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  return (
    <div className="dashboard">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2 className="logo">Bolnički Sistem</h2>

        <nav className="nav">
          <div className="navItem active">
            <Calendar size={18} />
            <span>Raspored</span>
          </div>

          <div className="navItem">
            <Users size={18} />
            <span>Pacijenti</span>
          </div>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="main">

        <Link to="/" className="backLink">
          <ArrowLeft size={16} /> Nazad na početnu stranicu
        </Link>

        {/* HEADER */}
        <header className="header">
          <div>
            <h1 className="title">Dobrodošli, Dr. Amare</h1>
            <p className="subtitle">Danas je 28. April 2026.</p>
          </div>

          <Link to="/rezervacija-specijalista" className="primaryButton">
            <ArrowRight size={18} />
            Rezervacija specijaliste
          </Link>
        </header>

        <h3 className="cardTitle">
          <Clock size={18} />
          Današnji pregledi
          </h3>

        {/* CONTENT */}
        <section className="grid">

          {/* APPOINTMENTS */}


            <div className="list">
              {loading ? (
                <p>Učitavanje rezervacija...</p>
              ) : appointments.length > 0 ? (
                appointments.map((a) => (
                  <div key={a.id} className="listItem">
                    <span className="time">{getTimeFromMinutes(a.termin.vrijeme)}</span>

                    <span className="name">{a.pacijent.korisnik.ime} {a.pacijent.korisnik.prezime}</span>

                    {/* STATUS - KLIK */}
                    <span
                      className={`badge ${(a.status || "ČEKA").toLowerCase()}`}
                      onClick={() => handleStatusChange(a.id)}
                      style={{ cursor: "pointer" }}
                      title="Klikni za promjenu statusa"
                    >
                      {a.status || "ČEKA"}
                    </span>
                  </div>
                ))
              ) : (
                <p>Nema rezervacija za danas.</p>
              )}
            </div>

            {/* INFO */}
            <h3 className="cardTitle">Informacije</h3>
            <div className="list">
              <div className="listItem">
                <span className="name">Sljedeći pacijent:</span>
                <span>Marko Marković</span>
                </div>
                <div className="listItem">
                  <span className="name">Napomena:</span>
                  <span>Provjeriti nalaz krvi</span>
                </div>
              </div>

        </section>
      </main>
    </div>
  );
};

export default DoctorPanel;