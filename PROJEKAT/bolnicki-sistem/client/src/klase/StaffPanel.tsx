import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, AlertTriangle, XCircle, UserPlus, FileText } from "lucide-react";


interface Appointment {
  id: number;
  patientName: string;
  doctorName: string;
  time: string;
  status: "ZAKAZAN" | "OTKAZAN";
  isUrgent: boolean;
}

const StaffPanel: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: 1, patientName: "Adnan Cerić", doctorName: "Dr. Amar", time: "08:00", status: "ZAKAZAN", isUrgent: false },
    { id: 2, patientName: "Emina Begić", doctorName: "Dr. Sara", time: "08:30", status: "ZAKAZAN", isUrgent: true },
    { id: 3, patientName: "Haris Mujić", doctorName: "Dr. Amar", time: "09:00", status: "ZAKAZAN", isUrgent: false },
  ]);

  const toggleUrgent = (id: number) => {
    setAppointments(prev =>
      prev.map(a => a.id === id ? { ...a, isUrgent: !a.isUrgent } : a)
    );
  };

  const cancelAppointment = (id: number) => {
    if (window.confirm("Da li ste sigurni da želite otkazati termin?")) {
      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, status: "OTKAZAN" } : a)
      );
    }
  };

  return (
    <div className="staff-layout">

      {/* SIDEBAR */}
      <aside className="staff-sidebar">
        <h2 className="staff-logo">Medicinsko osoblje</h2>

        <nav className="staff-nav">
          <Link to="/staff-panel" className="nav-item active">
            <Clock size={18} /> Dnevni plan
          </Link>

          <Link to="/laboratorija" className="nav-item">
            <FileText size={18} /> Laboratorija
          </Link>

          <Link to="/" className="nav-item logout">
            <XCircle size={18} /> Odjava
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
                <th className="center">Akcije</th>
              </tr>
            </thead>

            <tbody>
              {appointments.map(a => (
                <tr
                  key={a.id}
                  className={`table-row ${
                    a.isUrgent && a.status !== "OTKAZAN" ? "urgent-row" : ""
                  }`}
                >
                  <td className="time">{a.time}</td>

                  <td>
                    <div className="patient-cell">
                      {a.patientName}

                      {a.isUrgent && a.status !== "OTKAZAN" && (
                        <span className="urgent-badge">HITNO</span>
                      )}
                    </div>
                  </td>

                  <td>{a.doctorName}</td>

                  <td>
                    <span
                      className={`status-badge ${
                        a.status === "OTKAZAN" ? "canceled" : "scheduled"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>

                  <td className="actions-cell">
                    {a.status !== "OTKAZAN" && (
                      <>
                        <button
                          onClick={() => toggleUrgent(a.id)}
                          className={`icon-button ${
                            a.isUrgent ? "disabled" : "danger"
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
              ))}
            </tbody>

          </table>
        </div>

      </main>
    </div>
  );
};

export default StaffPanel;