import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';

import HomePage from './Pages/HomePage';
import MojeRezervacije from './klase/MojeRezervacije';
import Step1Odjeli from './klase/Step1Odjeli';
import Step2Doktori from './klase/Step2Doktori';
import Step3TipPregleda from './klase/Step3TipPregleda';
import Step4Termini from './klase/Step4Termini';
import Step5Potvrda from './klase/Step5Potvrda';
import DoktorRezervacije from './Pages/DoktorRezervacije';
import RegistracijaPage from './Pages/RegistracijaPage';
import PrijavaPage from './Pages/PrijavaPage';
import ForgotPasswordPage from './Pages/ForgotPasswordPage';
import ResetPasswordPage from './Pages/ResetPasswordPage';

import { useAutoLogout } from './hooks/useAutoLogout';
import { AutoLogoutModal } from './components/AutoLogoutModal';

import './App.css';

// ─── Helper: čita uloga iz JWT tokena ─────────────────────────────────────
function getUloga(): string | null {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.uloga ?? null; // "DOKTOR" ili "PACIJENT"
  } catch {
    return null;
  }
}

// ─── ProtectedRoute ────────────────────────────────────────────────────────
function ProtectedRoute({ children, allowedUloga }: {
  children: React.ReactNode;
  allowedUloga?: "DOKTOR" | "PACIJENT";
}) {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/prijava" replace />;

  // Provjeri ulogu samo ako je specificirana
  if (allowedUloga) {
    const uloga = getUloga();
    if (uloga !== allowedUloga) {
      return <Navigate to={uloga === "DOKTOR" ? "/doktor-rezervacije" : "/moje-rezervacije"} replace />;
    }
  }

  return <>{children}</>;
}

function AppContent() {
  const [prikaziModal, setPrikaziModal] = useState(false);

  const { odjavi, resetujTimer } = useAutoLogout(
    () => setPrikaziModal(true),
    () => setPrikaziModal(false),
  );

  const handleProduzeSesiju = () => {
    setPrikaziModal(false);
    resetujTimer();
  };

  const handleOtkazi = () => {
    setPrikaziModal(false);
    odjavi();
  };

  return (
    <>
      <Routes>
  <Route path="/" element={<HomePage />} />

  {/* Javne rute — bez prijave */}
  <Route path="/registracija"    element={<RegistracijaPage />} />
  <Route path="/prijava"         element={<PrijavaPage />} />
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
  <Route path="/reset-password"  element={<ResetPasswordPage />} />

  {/* Stara ruta */}
  <Route path="/doctor-view" element={<Navigate to="/doktor-rezervacije" replace />} />

  {/* Samo pacijent */}
  <Route path="/moje-rezervacije" element={
    <ProtectedRoute allowedUloga="PACIJENT">
      <MojeRezervacije />
    </ProtectedRoute>
  } />

  {/* Samo doktor */}
  <Route path="/doktor-rezervacije" element={
    <ProtectedRoute allowedUloga="DOKTOR">
      <DoktorRezervacije />
    </ProtectedRoute>
  } />

  {/* Prijavljeni korisnici — i pacijent i doktor */}
  <Route path="/step1-odjeli" element={
    <ProtectedRoute><Step1Odjeli /></ProtectedRoute>
  } />
  <Route path="/step2-doktori" element={
    <ProtectedRoute><Step2Doktori /></ProtectedRoute>
  } />
  <Route path="/step3-tip-pregleda" element={
    <ProtectedRoute><Step3TipPregleda /></ProtectedRoute>
  } />
  <Route path="/step4-termini" element={
    <ProtectedRoute><Step4Termini /></ProtectedRoute>
  } />
  <Route path="/step5-potvrda" element={
    <ProtectedRoute><Step5Potvrda /></ProtectedRoute>
  } />
</Routes>

      {prikaziModal && (
        <AutoLogoutModal
          onProduzeSesiju={handleProduzeSesiju}
          onOtkazi={handleOtkazi}
        />
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;