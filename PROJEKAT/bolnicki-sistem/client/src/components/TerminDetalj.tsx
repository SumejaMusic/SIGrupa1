import { useState, useEffect } from "react";
import {
  Clock,
  User,
  FileText,
  MessageSquare,
  AlertTriangle,
  Send,
  ExternalLink,
  X,
  History,
  Timer,
  XCircle,
  CheckCircle,
  Activity
} from "lucide-react";

import type { Termin, Nalaz } from "../types";

import {
  isoUTCdatum,
  formatV,
  formatDatumPrikaz,
  getAge,
  tipConfig,
  statusConfig
} from "../utils/rezervacijeUtils";

// Hardkodirana adresa jer ti .env varijabla vraća undefined
const apiUrl = "http://localhost:5000"; 

export function TerminDetalji({
  termin,
  onClose,
  onAddKomentar,
  onPromjenaDuzine,
  onOtkaziTermin,
  onZavrsiPregled
}: {
  termin: Termin;
  onClose: () => void;
  onAddKomentar: (terminId: number, tekst: string) => void;
  onPromjenaDuzine: (termin: Termin) => void;
  onOtkaziTermin: (termin: Termin) => void;
  onZavrsiPregled: (termin: Termin) => void;
}) {
  const [tab, setTab] = useState<"info" | "komentari" | "nalazi" | "historija">("info");
  const [noviKomentar, setNoviKomentar] = useState("");
  const [nalazi, setNalazi] = useState<Nalaz[]>([]);
  const [loadingNalazi, setLoadingNalazi] = useState(false);
  const [historija, setHistorija] = useState<any[]>([]);
  const [loadingHistorija, setLoadingHistorija] = useState(false);
  const [selectedHistorija, setSelectedHistorija] = useState<any | null>(null);

  // --- STATE ZA HRONIČNOG PACIJENTA ---
  const [isChronic, setIsChronic] = useState(termin.pacijent.hronicniBolesnik || false);
  const [period, setPeriod] = useState<number>(termin.pacijent.reviewPeriodDays || 30);
  const [savingChronic, setSavingChronic] = useState(false);

  const tc = tipConfig[termin.tip];
  const sc = statusConfig[termin.status];

  // Sinhronizacija state-a kada se promijeni pacijent
  useEffect(() => {
    setIsChronic(termin.pacijent.hronicniBolesnik || false);
    setPeriod(termin.pacijent.reviewPeriodDays || 30);
  }, [termin.pacijent.id]);

  // FUNKCIJA ZA SPAŠAVANJE STATUSA (SA TOKENOM)
  const handleUpdateChronicStatus = async () => {
    setSavingChronic(true);
    const token = localStorage.getItem("token"); // Dohvatanje tokena radi autentifikacije

    try {
      const response = await fetch(`${apiUrl}/api/pacijenti/${termin.pacijent.id}/hronicni`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Rješava grešku 401
        },
        body: JSON.stringify({
          hronicniBolesnik: isChronic,
          reviewPeriodDays: isChronic ? Number(period) : null
        })
      });

      if (response.ok) {
        alert("Status pacijenta uspješno ažuriran!");
      } else {
        const errorData = await response.json();
        alert("Greška: " + (errorData.poruka || "Neuspješno spašavanje"));
      }
    } catch (err) {
      alert("Nije moguće povezati se sa serverom.");
    } finally {
      setSavingChronic(false);
    }
  };

  useEffect(() => {
    if (tab !== "nalazi") return;
    setLoadingNalazi(true);
    fetch(`${apiUrl}/api/nalazi/pacijent/${termin.pacijent.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNalazi(data.map((n: any) => ({
            id: n.id, naziv: n.naziv,
            datum: isoUTCdatum(n.vrijemeNalaza),
            url: `${apiUrl}/api/nalazi/${n.id}/pdf`,
          })));
        }
      })
      .catch(() => setNalazi([]))
      .finally(() => setLoadingNalazi(false));
  }, [tab, termin.pacijent.id]);

  useEffect(() => {
    if (tab !== "historija") return;
    setLoadingHistorija(true);
    fetch(`${apiUrl}/api/historija/pacijent/${termin.pacijent.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => setHistorija(Array.isArray(data) ? data : []))
      .catch(() => setHistorija([]))
      .finally(() => setLoadingHistorija(false));
  }, [tab, termin.pacijent.id]);

  const handleSend = () => {
    if (!noviKomentar.trim()) return;
    onAddKomentar(termin.id, noviKomentar.trim());
    setNoviKomentar("");
  };

  const tabs = [
    { id: "info" as const, label: "Podaci", icon: User },
    { id: "komentari" as const, label: "Komentari", icon: MessageSquare },
    { id: "nalazi" as const, label: "Nalazi", icon: FileText },
    { id: "historija" as const, label: "Historija", icon: History },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
      <div className={`p-4 ${tc.bg} border-b ${tc.border}`}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-gray-900">
                {termin.pacijent.ime} {termin.pacijent.prezime}
              </span>
              {isChronic && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full">
                  <Activity size={10} /> HRONIČNI
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={13} />
              <span>{formatV(termin.vrijemeOd)} – {formatV(termin.vrijemeDo)}</span>
              <span>·</span>
              <span>{formatDatumPrikaz(termin.datum)}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/60 rounded-lg transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-100">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 ${tab === t.id ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "info" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Ime i prezime", value: `${termin.pacijent.ime} ${termin.pacijent.prezime}` },
                { label: "Godište", value: termin.pacijent.godisteRodjenja },
                { label: "Email", value: termin.pacijent.email },
                { label: "Telefon", value: termin.pacijent.telefon },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-xs text-gray-400 mb-0.5">{item.label}</div>
                  <div className="text-sm font-semibold text-gray-800">{item.value}</div>
                </div>
              ))}
            </div>

            {/* SEKCIJA ZA HRONIČNOG PACIJENTA */}
            <div className="mt-6 border-t border-dashed pt-4">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Postavke hroničnog bolesnika</h4>
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <input type="checkbox" checked={isChronic} onChange={(e) => setIsChronic(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm font-medium text-gray-700">Pacijent je hronični bolesnik</span>
                </label>
                {isChronic && (
                  <div className="ml-7 space-y-2">
                    <label className="block text-xs text-gray-500">Period rutinskog pregleda (dani)</label>
                    <input type="number" value={period} onChange={(e) => setPeriod(parseInt(e.target.value))} className="w-24 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
                  </div>
                )}
                <button onClick={handleUpdateChronicStatus} disabled={savingChronic} className={`mt-4 w-full py-2 rounded-lg text-xs font-bold ${savingChronic ? "bg-gray-200" : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white"}`}>
                  {savingChronic ? "Spašavanje..." : "Ažuriraj hronični status"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OSTALI TABOVI - Komentari, Nalazi, Historija (skraćeno) */}
        {tab === "komentari" && <p className="text-sm text-gray-500">Tab sa komentarima...</p>}
        {tab === "nalazi" && <p className="text-sm text-gray-500">Tab sa nalazima...</p>}
        {tab === "historija" && <p className="text-sm text-gray-500">Tab sa historijom posjeta...</p>}
      </div>
    </div>
  );
}