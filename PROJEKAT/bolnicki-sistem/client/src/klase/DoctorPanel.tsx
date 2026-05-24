import React, { useState, useEffect } from "react";
import { Calendar, Users, Clock, ArrowRight, ArrowLeft, Settings, X, Activity } from "lucide-react";
import { Link } from "react-router-dom";

// 1. Ažuriran Interface prema tvojoj Prisma bazi
interface Appointment {
  id: number;
  termin: {
    vrijeme: number;
    datum: string;
  };
  pacijent: {
    id: number;
    korisnik: {
      ime: string;
      prezime: string;
    };
    hronicniBolesnik?: boolean; // Iz Prisma Studija
    reviewPeriodDays?: number;  // Iz Prisma Studija
  };
  status?: string;
}

const DoctorPanel: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  
  // STATE ZA MODAL I UNOS
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);
  const [isChronic, setIsChronic] = useState(false);
  const [period, setPeriod] = useState<number>(30);

  const apiUrl = import.meta.env.VITE_API_URL;

  // DOHVATANJE PODATAKA
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

  // OTVARANJE MODALA
  const openChronicModal = (app: Appointment) => {
    setSelectedApp(app);
    setIsChronic(app.pacijent.hronicniBolesnik || false);
    setPeriod(app.pacijent.reviewPeriodDays || 30);
  };

  // SLANJE PODATAKA NA BACKEND
  const handleSaveChronicStatus = async () => {
    if (!selectedApp) return;

    try {
      const response = await fetch(`${apiUrl}/api/pacijenti/${selectedApp.pacijent.id}/chronic-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hronicniBolesnik: isChronic,
          reviewPeriodDays: isChronic ? period : null
        })
      });

      if (response.ok) {
        // Ažuriraj lokalni state da se promjena vidi odmah
        setAppointments(prev => prev.map(app => 
          app.pacijent.id === selectedApp.pacijent.id 
          ? { ...app, pacijent: { ...app.pacijent, hronicniBolesnik: isChronic, reviewPeriodDays: period }} 
          : app
        ));
        setSelectedApp(null);
        alert("Status pacijenta uspješno ažuriran!");
      } else {
        alert("Greška na serveru prilikom spašavanja.");
      }
    } catch (err) {
      alert("Nije moguće povezati se sa serverom.");
    }
  };

  const statusFlow = ["ČEKA", "U TOKU", "ZAVRŠENO"];

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
          <div className="navItem active"><Calendar size={18} /><span>Raspored</span></div>
          <div className="navItem"><Users size={18} /><span>Pacijenti</span></div>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="main">
        <Link to="/" className="backLink">
          <ArrowLeft size={16} /> Nazad na početnu stranicu
        </Link>

        <header className="header">
          <div>
            <h1 className="title">Dobrodošli, Dr. Amare</h1>
            <p className="subtitle">Danas je 28. April 2026.</p>
          </div>
          <Link to="/rezervacija-specijalista" className="primaryButton">
            <ArrowRight size={18} /> Rezervacija specijaliste
          </Link>
        </header>

        <h3 className="cardTitle"><Clock size={18} /> Današnji pregledi</h3>

        <section className="grid">
          <div className="list">
            {loading ? (
              <p>Učitavanje rezervacija...</p>
            ) : appointments.length > 0 ? (
              appointments.map((a) => (
                <div key={a.id} className="listItem">
                  <span className="time">{getTimeFromMinutes(a.termin.vrijeme)}</span>
                  
                  <span className="name">
                    {a.pacijent.korisnik.ime} {a.pacijent.korisnik.prezime}
                    {/* Vizuelni indikator ako je pacijent već hronični */}
                    {a.pacijent.hronicniBolesnik && (
                      <span className="chronicTag" style={chronicTagStyle}>
                        <Activity size={12} /> HRONIČNI
                      </span>
                    )}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Ikona za otvaranje podešavanja */}
                    <Settings 
                      size={20} 
                      className="settingsIcon" 
                      onClick={() => openChronicModal(a)} 
                      style={{cursor: 'pointer', color: '#888'}}
                      title="Podešavanja hroničnog bolesnika"
                    />

                    <span
                      className={`badge ${(a.status || "ČEKA").toLowerCase()}`}
                      onClick={() => handleStatusChange(a.id)}
                      style={{ cursor: "pointer" }}
                    >
                      {a.status || "ČEKA"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p>Nema rezervacija za danas.</p>
            )}
          </div>
        </section>
      </main>

      {/* MODAL ZA HRONIČNOG PACIJENTA */}
      {selectedApp && (
        <div className="modalOverlay" style={modalOverlayStyle}>
          <div className="modalContent" style={modalContentStyle}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
              <h3 style={{margin:0}}>Status pacijenta</h3>
              <X onClick={() => setSelectedApp(null)} style={{cursor:'pointer', color:'#666'}} />
            </div>
            
            <p style={{marginBottom: '20px'}}>
              Podešavate parametre za: <br />
              <strong>{selectedApp.pacijent.korisnik.ime} {selectedApp.pacijent.korisnik.prezime}</strong>
            </p>
            
            <div style={{margin: '20px 0'}}>
              <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '16px'}}>
                <input 
                  type="checkbox" 
                  style={{width: '18px', height: '18px'}}
                  checked={isChronic} 
                  onChange={(e) => setIsChronic(e.target.checked)} 
                />
                Pacijent je hronični bolesnik
              </label>
            </div>

            {isChronic && (
              <div style={{marginBottom: '25px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px'}}>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                  Period rutinskog pregleda (u danima):
                </label>
                <input 
                  type="number" 
                  min="8"
                  value={period} 
                  onChange={(e) => setPeriod(parseInt(e.target.value))}
                  style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc'}}
                />
                <p style={{fontSize: '12px', color: '#666', marginTop: '8px'}}>
                   Sistem će poslati SMS podsjetnik 7 dana prije isteka ovog perioda.
                </p>
              </div>
            )}

            <div style={{display:'flex', gap:'10px'}}>
               <button 
                onClick={() => setSelectedApp(null)}
                style={{flex: 1, padding: '12px', backgroundColor: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer'}}
              >
                Odustani
              </button>
              <button 
                onClick={handleSaveChronicStatus}
                className="primaryButton"
                style={{flex: 2, padding: '12px', borderRadius: '6px'}}
              >
                Spasi promjene
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- POMOĆNI STILOVI ---
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '420px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
};

const chronicTagStyle: React.CSSProperties = {
  fontSize: '10px', marginLeft: '10px', backgroundColor: '#fee2e2', color: '#dc2626', 
  padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px'
};

export default DoctorPanel;