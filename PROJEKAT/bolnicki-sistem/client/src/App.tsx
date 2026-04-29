import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import { Calendar, FileText } from 'lucide-react';


import RezervacijaPacijent from './klase/RezervacijaPacijent';

import MojeRezervacije from './klase/MojeRezervacije';

const HomePage = () => {
  return (
    <div className="homepage">
      <h1 className="homepage-title">Bolnički sistem</h1>
      <p className="homepage-subtitle">Odaberite uslugu</p>
      <div className="homepage-grid">

        <Link to="/rezervacija-pacijent" className="hp-card">
          <Calendar size={40} />
          <span>Zakaži termin</span>
        </Link>

        <Link to="/moje-rezervacije" className="hp-card">
          <FileText size={40} />
          <span>Moje rezervacije</span>
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
        <Route path="/rezervacija-pacijent" element={<RezervacijaPacijent />} />
        <Route path="/RezervacijaPacijent" element={<RezervacijaPacijent />} />
        <Route path="/moje-rezervacije" element={<MojeRezervacije />} />
      </Routes>
    </Router>
  );
}

export default App;
