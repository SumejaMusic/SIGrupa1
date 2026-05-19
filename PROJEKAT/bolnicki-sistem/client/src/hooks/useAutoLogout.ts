import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const NEAKTIVNOST_MS = 3 * 60 * 1000; // 15 minuta → prikaži upozorenje
const UPOZORENJE_MS  =  1 * 60 * 1000; // 2 minute → automatska odjava ako nema reakcije
//const NEAKTIVNOST_MS = 15 * 1000; // 10 sekundi
//const UPOZORENJE_MS  =  5 * 1000; // 5 sekundi
export function useAutoLogout(onUpozorenje: () => void, onZatvoriModal: () => void) {
  const navigate = useNavigate();
  const timerNeaktivnosti = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerOdjave       = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Čisti oba tajmera ──────────────────────────────────────────────────────
  const ocistiTimere = useCallback(() => {
    if (timerNeaktivnosti.current) clearTimeout(timerNeaktivnosti.current);
    if (timerOdjave.current)       clearTimeout(timerOdjave.current);
  }, []);

  // ── Stvarna odjava ─────────────────────────────────────────────────────────
  const odjavi = useCallback(() => {
    ocistiTimere();
    localStorage.removeItem("token");
    localStorage.removeItem("korisnik");
    
    // OVO JE KLJUČNO: Šaljemo signal Navbaru da osvježi prikaz
    window.dispatchEvent(new Event("istekla-sesija")); 

    onZatvoriModal();
    //navigate("/");
    // Umjesto navigate('/'), koristi ovo:
  window.location.replace('/prijava');
  }, [ocistiTimere, navigate, onZatvoriModal]);
  // ── Pokretanje / resetovanje tajmera ───────────────────────────────────────
  const resetujTimer = useCallback(() => {
    // Ne radi ništa ako korisnik nije prijavljen
    if (!localStorage.getItem("token")) return;

    ocistiTimere();

    // Nakon 15 min neaktivnosti — prikaži upozorenje
    timerNeaktivnosti.current = setTimeout(() => {
      onUpozorenje();

      // Nakon još 2 minute bez reakcije — automatska odjava
      timerOdjave.current = setTimeout(() => {
        odjavi();
      }, UPOZORENJE_MS);
    }, NEAKTIVNOST_MS);
  }, [ocistiTimere, onUpozorenje, odjavi]);

  // ── Registracija event listenera ───────────────────────────────────────────
  useEffect(() => {
    const eventi = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    eventi.forEach(e => window.addEventListener(e, resetujTimer));
    resetujTimer(); // Pokreni na mount

    return () => {
      ocistiTimere();
      eventi.forEach(e => window.removeEventListener(e, resetujTimer));
    };
  }, [resetujTimer, ocistiTimere]);

  return { odjavi, resetujTimer };
}