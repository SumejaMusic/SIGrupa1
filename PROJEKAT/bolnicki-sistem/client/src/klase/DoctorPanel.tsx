import React, { useState } from "react";
import { Calendar, Users, Clock, ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface Appointment {
  id: number;
  patientName: string;
  time: string;
  status: "ZAVRŠENO" | "U TOKU" | "ČEKA";
}

const DoctorPanel: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: 1, patientName: "Emina Hadžić", time: "09:00", status: "ZAVRŠENO" },
    { id: 2, patientName: "Marko Marković", time: "10:30", status: "U TOKU" },
    { id: 3, patientName: "Kenan Delić", time: "11:15", status: "ČEKA" },
  ]);

  // Redoslijed statusa
  const statusFlow: Appointment["status"][] = [
    "ČEKA",
    "U TOKU",
    "ZAVRŠENO",
  ];

  // Promjena statusa klikom
  const handleStatusChange = (id: number) => {
    setAppointments((prev) =>
      prev.map((app) => {
        if (app.id !== id) return app;

        const currentIndex = statusFlow.indexOf(app.status);
        const nextIndex = (currentIndex + 1) % statusFlow.length;

        return { ...app, status: statusFlow[nextIndex] };
      })
    );
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
              {appointments.map((a) => (
                <div key={a.id} className="listItem">
                  <span className="time">{a.time}</span>

                  <span className="name">{a.patientName}</span>

                  {/* STATUS - KLIK */}
                  <span
                    className={`badge ${a.status.toLowerCase()}`}
                    onClick={() => handleStatusChange(a.id)}
                    style={{ cursor: "pointer" }}
                    title="Klikni za promjenu statusa"
                  >
                    {a.status}
                  </span>
                </div>
              ))}
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