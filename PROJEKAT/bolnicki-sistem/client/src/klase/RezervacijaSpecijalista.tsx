import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, ArrowLeft, CheckCircle } from "lucide-react";

type Department = "Svi" | "Kardiologija" | "Dermatologija";

interface Doctor {
  id: number;
  ime: string;
  prezime: string;
  specijalizacija: string;
}

interface Patient {
  id: number;
  fullName: string;
  jmbg: string;
}

// Hardkodirani pacijenti — zamijeniti API pozivom kada login bude implementiran (R4)
const patients: Patient[] = [
  { id: 1, fullName: "Marko Marković", jmbg: "1234567890123" },
  { id: 2, fullName: "Emina Hadžić", jmbg: "9876543210987" },
  { id: 3, fullName: "Kenan Delić", jmbg: "1112223334445" },
];



const RezervacijaSpecijalista: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department>("Svi");
  const [search, setSearch] = useState("");

  const departments: Department[] = ["Svi", "Kardiologija", "Dermatologija"];

  // DOHVATI DOKTORE SA BACKENDA (US-05)
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/api/doktori`);
        if (!response.ok) throw new Error('Greška pri učitavanju doktora');
        const data = await response.json();
        setDoctors(data);
      } catch (err) {
        console.error('Greška pri učitavanju doktora:', err);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const filteredDoctors = (
    selectedDepartment === "Svi"
      ? doctors
      : doctors.filter((doc) => doc.specijalizacija === selectedDepartment)
  ).filter((doc) =>
    `${doc.ime} ${doc.prezime}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setStep(2);
  };

  const resetBooking = () => {
    setStep(1);
    setSelectedDoctor(null);
    setSelectedPatient(null);
  };

  return (
    <div className="page">
      <div className="container">

        <div className="navLinks">
          <Link to="/doctor-panel" className="backLink">
            <ArrowLeft size={18} /> Nazad na panel
          </Link>
          <Link to="/" className="backLink">
            <ArrowLeft size={18} /> Nazad na početnu stranicu
          </Link>
        </div>

        <h1 className="title">Rezervacija specijaliste</h1>
        <p className="subtitle">Odabir doktora i zakazivanje termina</p>

        {/* SEARCH + FILTER */}
        <div className="filterBar">
          <input
            type="text"
            placeholder="Pretraži doktora..."
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value as Department)}
            className="input"
          >
            {departments.map((dep) => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
        </div>

        <div className="content">

          {step === 1 ? (
            <>
              <h3 className="sectionTitle">Dostupni specijalisti</h3>

              {loading ? (
                <p>Učitavanje doktora...</p>
              ) : filteredDoctors.length > 0 ? (
                filteredDoctors.map((doctor) => (
                  <div key={doctor.id} className="card">
                    <div>
                      <h4 className="doctorName">Dr. {doctor.ime} {doctor.prezime}</h4>
                      <p className="department">{doctor.specijalizacija}</p>
                    </div>

                    <button className="btn" onClick={() => handleSelectDoctor(doctor)}>
                      Rezerviši
                    </button>
                  </div>
                ))
              ) : (
                <p>Nema dostupnih specijalista.</p>
              )}
            </>
          ) : (
            <div className="confirmBox">
              <h3>Potvrda rezervacije</h3>

              {/* DOKTOR */}
              <div className="infoRow">
                <span>Doktor:</span>
                <strong>Dr. {selectedDoctor?.ime} {selectedDoctor?.prezime}</strong>
              </div>

              {/* PACIJENT */}
              <div className="sectionBox">
                <h4 className="sectionTitle">Pacijent</h4>

                <select
                  className="input"
                  value={selectedPatient?.id || ""}
                  onChange={(e) => {
                    const patient = patients.find((p) => p.id === Number(e.target.value));
                    setSelectedPatient(patient || null);
                  }}
                >
                  <option value="">-- Odaberi pacijenta --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.fullName}</option>
                  ))}
                </select>

                <div className="patientPreview">
                  {selectedPatient ? (
                    <>
                      <p className="patientName">{selectedPatient.fullName}</p>
                      <p className="patientMeta">JMBG: {selectedPatient.jmbg}</p>
                    </>
                  ) : (
                    <p className="patientEmpty">Nema odabranog pacijenta</p>
                  )}
                </div>
              </div>

              {/* TERMIN INFO */}
              <div className="infoRow">
                <span>Termin:</span>
                <strong className="green">Termin će biti dogovoren</strong>
              </div>

              {/* AKCIJE */}
              <div className="actions">
                <button className="btnSecondary" onClick={resetBooking}>
                  Nazad
                </button>

                <button
                  className="btnSuccess"
                  disabled={!selectedPatient}
                  onClick={() => {
                    alert(
                      `Termin za specijalista Dr. ${selectedDoctor?.ime} ${selectedDoctor?.prezime} zakazan za ${selectedPatient?.fullName}`
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
  );
};

export default RezervacijaSpecijalista;
