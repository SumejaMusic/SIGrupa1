import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, UserPlus, AlertTriangle, XCircle } from "lucide-react";

interface Appointment {
  id: number;
  pacijent: {
    korisnik: {
      ime: string;
      prezime: string;
    };
  };
  doktor: {
    korisnik: {
      ime: string;
      prezime: string;
    };
  };
  termin: {
    vrijeme: number;
    datum: string;
  };
  hitnost: boolean;
  status?: string;
}

const StaffPanel: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/api/rezervacije/doktor/1`);
        if (!response.ok) throw new Error("Greška pri učitavanju");

        const data = await response.json();
        setAppointments(data);
      } catch (err) {
        console.error("Greška:", err);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const getTimeFromMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  const toggleUrgent = (id: number) => {
    setAppointments(prev =>
      prev.map(a =>
        a.id === id ? { ...a, hitnost: !a.hitnost } : a
      )
    );
  };

  const cancelAppointment = async (id: number) => {
    if (!window.confirm("Da li ste sigurni da želite otkazati termin?")) return;

    try {
      const response = await fetch(`${apiUrl}/api/rezervacije/${id}/otkazi/osoblje`,
        { method: "PATCH" }
      );

      if (response.ok) {
        setAppointments(prev =>
          prev.map(a =>
            a.id === id ? { ...a, status: "OTKAZAN" } : a
          )
        );
      }
    } catch (err) {
      console.error("Greška pri otkazivanju:", err);
    }
  };

  return (
    <div className="staff-layout">

      {/* SIDEBAR */}
      <aside className="staff-sidebar">
        <h2 className="staff-logo">Medicinsko osoblje</h2>

        <nav className="staff-nav">
          <Link to="/staff-panel" className="nav-item active">
            <Calendar size={18} /> Raspored
          </Link>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="staff-main">

        <Link to="/" className="back-link">
          ← Nazad na početnu
        </Link>

        <div className="header">
          <h1 className="page-title">Dnevni pregledi</h1>

          <Link to="/RezervacijaPacijent" className="add-button">
            <UserPlus size={18} /> Novi termin
          </Link>
        </div>

        {/* TABLE */}
        <div className="table-card">
          <table className="appointments-table">

            <thead>
              <tr>
                <th>Vrijeme</th>
                <th>Pacijent</th>
                <th>Doktor</th>
                <th>Status</th>
                <th>Akcije</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                    Učitavanje rezervacija...
                  </td>
                </tr>
              ) : appointments.length > 0 ? (
                appointments.map(a => (
                  <tr
                    key={a.id}
                    className={`table-row ${
                      a.hitnost && a.status !== "OTKAZAN" ? "urgent-row" : ""
                    }`}
                  >
                    <td className="time">
                      {getTimeFromMinutes(a.termin.vrijeme)}
                    </td>

                    <td>
                      <div className="patient-cell">
                        {a.pacijent.korisnik.ime} {a.pacijent.korisnik.prezime}

                        {a.hitnost && a.status !== "OTKAZAN" && (
                          <span className="urgent-badge">HITNO</span>
                        )}
                      </div>
                    </td>

                    <td>
                      {a.doktor.korisnik.ime} {a.doktor.korisnik.prezime}
                    </td>

                    <td>
                      <span
                        className={`status-badge ${
                          a.status === "OTKAZAN" ? "canceled" : "scheduled"
                        }`}
                      >
                        {a.status || "ZAKAZAN"}
                      </span>
                    </td>

                    <td className="actions-cell">
                      {a.status !== "OTKAZAN" && (
                        <>
                          <button
                            onClick={() => toggleUrgent(a.id)}
                            className={`icon-button ${
                              a.hitnost ? "disabled" : "danger"
                            }`}
                          >
                            <AlertTriangle size={18} />
                          </button>

                          <button
                            onClick={() => cancelAppointment(a.id)}
                            className="icon-button"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                    Nema rezervacija
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

      </main>
    </div>
  );
};

export default StaffPanel;