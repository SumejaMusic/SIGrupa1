import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, UserPlus, FileText } from "lucide-react";

interface Appointment {
  id: number;
  patientName: string;
  doctorName: string;
  time: string;
  status: "ZAKAZAN" | "OTKAZAN";
}

const StaffPanel: React.FC = () => {
  const [appointments] = useState<Appointment[]>([
    { id: 1, patientName: "Adnan Cerić", doctorName: "Dr. Amar", time: "08:00", status: "ZAKAZAN" },
    { id: 2, patientName: "Emina Begić", doctorName: "Dr. Sara", time: "08:30", status: "ZAKAZAN" },
    { id: 3, patientName: "Haris Mujić", doctorName: "Dr. Amar", time: "09:00", status: "ZAKAZAN" },
  ]);

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
              </tr>
            </thead>

            <tbody>
              {appointments.map(a => (
                <tr key={a.id} className="table-row">

                  <td className="time">{a.time}</td>

                  <td>{a.patientName}</td>

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