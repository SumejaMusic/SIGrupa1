import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import { ClipboardList, Beaker, Calendar, Stethoscope, UserCog, FileText } from 'lucide-react'; 

import DoctorPanel from './klase/DoctorPanel'; 
import RezervacijaPacijent from './klase/RezervacijaPacijent';
import RezervacijaSpecijalista from './klase/RezervacijaSpecijalista'; 
import StaffPanel from './klase/StaffPanel';
import Laboratorija from './klase/Laboratorija';
import MojeRezervacije from './klase/MojeRezervacije';

const HomePage = () => {
  return (
    <div className="homepage">
      <h1 className="homepage-title">Bolnički Sistem</h1>
      <p className="homepage-subtitle">Odaberite uslugu</p>
      <div className="homepage-grid">

        <Link to="/RezervacijaPacijent" className="hp-card">
          <Calendar size={40} />
          <span>Zakaži Termin</span>
        </Link>

        <Link to="/doctor-panel" className="hp-card">
          <Stethoscope size={40} />
          <span>Doktorski Panel</span>
        </Link>

        <Link to="/rezervacija-specijalista" className="hp-card">
          <UserCog size={40} />
          <span>Uputi specijalisti</span>
        </Link>

        <Link to="/staff-panel" className="hp-card">
          <ClipboardList size={40} />
          <span>Medicinsko Osoblje</span>
        </Link>

        <Link to="/laboratorija" className="hp-card">
          <Beaker size={40} />
          <span>Laboratorija</span>
        </Link>

        <Link to="/moje-rezervacije" className="hp-card">
          <FileText size={40} />
          <span>Moje Rezervacije</span>
        </Link>

      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/RezervacijaPacijent" element={<RezervacijaPacijent />} />
        <Route path="/doctor-panel" element={<DoctorPanel />} />
        <Route path="/rezervacija-specijalista" element={<RezervacijaSpecijalista />} />
        <Route path="/staff-panel" element={<StaffPanel />} />
        <Route path="/laboratorija" element={<Laboratorija />} />
        <Route path="/moje-rezervacije" element={<MojeRezervacije />} />
      </Routes>
    </Router>
  );
}

export default App;