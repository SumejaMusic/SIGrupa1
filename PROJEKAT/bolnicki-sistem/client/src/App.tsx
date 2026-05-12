import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import HomePage from './Stranice/HomePage';
//import RezervacijaPacijent from './klase/RezervacijaPacijent';
import MojeRezervacije from './klase/MojeRezervacije';
import Step1Odjeli from './klase/Step1Odjeli';
import Step2Doktori from './klase/Step2Doktori';
import Step3TipPregleda from './klase/Step3TipPregleda';
import Step4Termini from './klase/Step4Termini';
import Step5Potvrda from './klase/Step5Potvrda';
import './App.css';
import DoktorRezervacije from './Stranice/DoktorRezervacije';
import RegistracijaPage from './Stranice/RegistracijaPage'
import PrijavaPage from './Stranice/PrijavaPage';

import ForgotPasswordPage from './Stranice/ForgotPasswordPage';
import ResetPasswordPage from './Stranice/ResetPasswordPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/moje-rezervacije" element={<MojeRezervacije />} />
        <Route path="/step1-odjeli" element={<Step1Odjeli />} />
        <Route path="/step2-doktori" element={<Step2Doktori />} />
        <Route path="/step3-tip-pregleda" element={<Step3TipPregleda />} />
        <Route path="/step4-termini" element={<Step4Termini />} />
        <Route path="/step5-potvrda" element={<Step5Potvrda />} />
        <Route path="/doctor-view" element={<DoktorRezervacije />} />
        <Route path="/registracija" element={<RegistracijaPage />} />
        <Route path="/prijava" element={<PrijavaPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </Router>
  );
}

export default App;