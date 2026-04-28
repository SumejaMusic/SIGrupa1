import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
// DODAJ OVE IMPORTE ZA IKONICE
import { ClipboardList, Beaker } from 'lucide-react'; 

import DoctorPanel from './klase/DoctorPanel'; 
import RezervacijaPacijent from './klase/RezervacijaPacijent';
import RezervacijaSpecijalista from './klase/RezervacijaSpecijalista'; 
import StaffPanel from './klase/StaffPanel';
import Laboratorija from './klase/Laboratorija';
import MojeRezervacije from './klase/MojeRezervacije';

// --- KOMPONENTA: HOMEPAGE ---
const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-6">
      <h1 className="text-4xl font-bold text-blue-900 mb-4">Dobrodošli u Bolnički Sistem</h1>
      
      {/* Koristimo grid za ljepši raspored dugmadi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <Link to="/RezervacijaPacijent" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg flex items-center justify-center gap-2">
          Zakaži Termin (Pacijent)
        </Link>

        <Link to="/doctor-panel" className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition flex items-center justify-center gap-2">
          Doktorski Panel
        </Link>

        <Link to="/rezervacija-specijalista" className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition flex items-center justify-center gap-2">
          Uputi kod specijaliste
        </Link>

        {/* POPRAVLJEN LINK (zatvoren tag i dodata ikonica) */}
        <Link to="/staff-panel" className="bg-blue-600 text-white p-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg">
          <ClipboardList size={20} /> Panel medicinskog osoblja
        </Link>
  
        <Link to="/laboratorija" className="bg-purple-600 text-white p-4 rounded-lg flex items-center justify-center gap-2 hover:bg-purple-700 shadow-lg">
          <Beaker size={20} /> Laboratorija
        </Link>
        <Link to="/moje-rezervacije" className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition flex items-center justify-center gap-2">
          Moje Rezervacije
        </Link>

      </div>
    </div>
  );
};

// --- GLAVNI APP ---
function App() {
  return (
    <Router>
      <Routes>
        {/* Promijenio sam path sa "/home" na "/" da se vidi odmah pri pokretanju */}
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