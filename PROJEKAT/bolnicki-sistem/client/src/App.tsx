import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';


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


import { useAutoLogout } from './hooks/useAutoLogout';
import { AutoLogoutModal } from './components/AutoLogoutModal';
import { isTokenValid, handleExpiredSession } from './utils/auth';

import './App.css';

// ─── Helper: čita uloga iz JWT tokena ─────────────────────────────────────
function getUloga(): string | null {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.uloga ?? null;
  } catch {
    return null;
  }
}

// ─── Helper: default ruta za svaku ulogu ──────────────────────────────────
function getDefaultRoute(uloga: string | null): string {
  switch (uloga) {
    case "DOKTOR": return "/doktor-rezervacije";
    case "PACIJENT": return "/moje-rezervacije";
    case "MEDICINSKO_OSOBLJE": return "/";
    case "ADMINISTRATOR": return "/";
    case "VLASNIK": return "/";
    default: return "/prijava";
  }
}

type Uloga = "ADMINISTRATOR" | "PACIJENT" | "DOKTOR" | "MEDICINSKO_OSOBLJE" | "VLASNIK";

// ─── ProtectedRoute ────────────────────────────────────────────────────────
function ProtectedRoute({ children, allowedUloge }: {
  children: React.ReactNode;
  allowedUloge?: Uloga[];
}) {
  const token = localStorage.getItem("token");

  if (!token || !isTokenValid()) {
    if (token) handleExpiredSession();
    return <Navigate to="/prijava" replace />;
  }

  // Provjeri ulogu samo ako su specificirane dozvoljene uloge
  if (allowedUloge && allowedUloge.length > 0) {
    const uloga = getUloga();
    if (!uloga || !allowedUloge.includes(uloga as Uloga)) {
      return <Navigate to={getDefaultRoute(uloga)} replace />;
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

  {/* Samo pacijent (+ admin može sve) */}
  <Route path="/moje-rezervacije" element={
    <ProtectedRoute allowedUloge={["PACIJENT", "ADMINISTRATOR"]}>
      <MojeRezervacije />
    </ProtectedRoute>
  } />

  {/* Samo doktor (+ admin može sve) */}
  <Route path="/doktor-rezervacije" element={
    <ProtectedRoute allowedUloge={["DOKTOR", "ADMINISTRATOR"]}>
      <DoktorRezervacije />
    </ProtectedRoute>
  } />

  {/* Rezervacija — pacijent, doktor i admin */}
  <Route path="/step1-odjeli" element={
    <ProtectedRoute allowedUloge={["PACIJENT", "DOKTOR", "ADMINISTRATOR"]}><Step1Odjeli /></ProtectedRoute>
  } />
  <Route path="/step2-doktori" element={
    <ProtectedRoute allowedUloge={["PACIJENT", "DOKTOR", "ADMINISTRATOR"]}><Step2Doktori /></ProtectedRoute>
  } />
  <Route path="/step3-tip-pregleda" element={
    <ProtectedRoute allowedUloge={["PACIJENT", "DOKTOR", "ADMINISTRATOR"]}><Step3TipPregleda /></ProtectedRoute>
  } />
  <Route path="/step4-termini" element={
    <ProtectedRoute allowedUloge={["PACIJENT", "DOKTOR", "ADMINISTRATOR"]}><Step4Termini /></ProtectedRoute>
  } />
  <Route path="/step5-potvrda" element={
    <ProtectedRoute allowedUloge={["PACIJENT", "DOKTOR", "ADMINISTRATOR"]}><Step5Potvrda /></ProtectedRoute>
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