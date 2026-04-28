import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, ArrowLeft, CheckCircle } from "lucide-react";

type Department = "Svi" | "Kardiologija" | "Dermatologija";

interface Doctor {
  id: number;
  fullName: string;
  department: Exclude<Department, "Svi">;
  nextAvailableSlot: string;
}

interface Patient {
  id: number;
  fullName: string;
  jmbg: string;
}

const patients: Patient[] = [
  { id: 1, fullName: "Marko Marković", jmbg: "1234567890123" },
  { id: 2, fullName: "Emina Hadžić", jmbg: "9876543210987" },
  { id: 3, fullName: "Kenan Delić", jmbg: "1112223334445" },
];

const RezervacijaSpecijalista: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [selectedDepartment, setSelectedDepartment] =
    useState<Department>("Svi");

  const departments: Department[] = [
    "Svi",
    "Kardiologija",
    "Dermatologija",
  ];

  const doctors: Doctor[] = [
    {
      id: 1,
      fullName: "Dr. Nejra Karić",
      department: "Kardiologija",
      nextAvailableSlot: "Danas 14:00",
    },
    {
      id: 2,
      fullName: "Dr. Ivan Jurić",
      department: "Dermatologija",
      nextAvailableSlot: "Sutra 09:30",
    },
    {
      id: 3,
      fullName: "Dr. Selman Krnjić",
      department: "Kardiologija",
      nextAvailableSlot: "Četvrtak 11:00",
    },
  ];

  const filteredDoctors =
    selectedDepartment === "Svi"
      ? doctors
      : doctors.filter((doc) => doc.department === selectedDepartment);

  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setStep(2);
  };

  const resetBooking = () => {
    setStep(1);
    setSelectedDoctor(null);
    setSelectedPatient(null);
  };

  const canConfirm = selectedDoctor && selectedPatient;

  return (
    <div className="page">
      <div className="container">

        <Link to="/doctor-panel" className="backLink">
          <ArrowLeft size={18} /> Nazad na panel
        </Link>

        <h1 className="title">Rezervacija specijaliste</h1>
        <p className="subtitle">Odabir doktora i zakazivanje termina</p>

        <div className="layout">

          {/* FILTER */}
          <div className="sidebar">
            <h3 className="sectionTitle">
              <Search size={16} /> Filter
            </h3>

            <label>Odjel</label>
            <select
              value={selectedDepartment}
              onChange={(e) =>
                setSelectedDepartment(e.target.value as Department)
              }
              className="input"
            >
              {departments.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
          </div>

          {/* CONTENT */}
          <div className="content">

            {step === 1 ? (
              <>
                <h3 className="sectionTitle">Dostupni specijalisti</h3>

                {filteredDoctors.map((doctor) => (
                  <div key={doctor.id} className="card">
                    <div>
                      <h4 className="doctorName">{doctor.fullName}</h4>
                      <p className="department">{doctor.department}</p>

                      <p className="slot">
                        <Calendar size={12} /> {doctor.nextAvailableSlot}
                      </p>
                    </div>

                    <button
                      className="btn"
                      onClick={() => handleSelectDoctor(doctor)}
                    >
                      Rezerviši
                    </button>
                  </div>
                ))}
              </>
            ) : (
              <div className="confirmBox">
                <h3>Potvrda rezervacije</h3>

                {/* DOCTOR */}
                <div className="infoRow">
                  <span>Doktor:</span>
                  <strong>{selectedDoctor?.fullName}</strong>
                </div>

                {/* PATIENT - FIXED + VISIBLE */}
                <div className="sectionBox">
                  <h4 className="sectionTitle">Pacijent</h4>

                  <select
                    className="input"
                    value={selectedPatient?.id || ""}
                    onChange={(e) => {
                      const patient = patients.find(
                        (p) => p.id === Number(e.target.value)
                      );
                      setSelectedPatient(patient || null);
                    }}
                  >
                    <option value="">-- Odaberi pacijenta --</option>

                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName}
                      </option>
                    ))}
                  </select>

                  {/* 👇 VIDLJIV PRIKAZ */}
                  <div className="patientPreview">
                    {selectedPatient ? (
                      <>
                        <p className="patientName">
                          {selectedPatient.fullName}
                        </p>
                        <p className="patientMeta">
                          JMBG: {selectedPatient.jmbg}
                        </p>
                      </>
                    ) : (
                      <p className="patientEmpty">
                        Nema odabranog pacijenta
                      </p>
                    )}
                  </div>
                </div>

                {/* SLOT */}
                <div className="infoRow">
                  <span>Termin:</span>
                  <strong className="green">
                    {selectedDoctor?.nextAvailableSlot}
                  </strong>
                </div>

                {/* ACTIONS */}
                <div className="actions">
                  <button className="btnSecondary" onClick={resetBooking}>
                    Nazad
                  </button>

                  <button
                    className="btnSuccess"
                    disabled={!canConfirm}
                    onClick={() => {
                      alert(
                        `Termin zakazan za ${selectedPatient?.fullName}`
                      );
                      resetBooking();
                    }}
                  >
                    <CheckCircle size={16} /> Potvrdi
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default RezervacijaSpecijalista;