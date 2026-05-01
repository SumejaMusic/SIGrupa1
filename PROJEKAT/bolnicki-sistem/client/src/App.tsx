import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './Pages/HomePage';
import RezervacijaPacijent from './klase/RezervacijaPacijent';
import MojeRezervacije from './klase/MojeRezervacije';
import './App.css';

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