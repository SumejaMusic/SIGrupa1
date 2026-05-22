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
  CheckCircle
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

const apiUrl = import.meta.env.VITE_API_URL;

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

  const tc = tipConfig[termin.tip];
  const sc = statusConfig[termin.status];

  useEffect(() => {
    if (tab !== "nalazi") return;

    setLoadingNalazi(true);
    setNalazi([]);

    fetch(`${apiUrl}/api/nalazi/pacijent/${termin.pacijent.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNalazi(data.map((n: any) => ({
            id: n.id,
            naziv: n.naziv,
            datum: isoUTCdatum(n.vrijemeNalaza),
            url: `${apiUrl}/api/nalazi/${n.id}/pdf`,
          })));
        } else {
          setNalazi([]);
        }
      })
      .catch(() => setNalazi([]))
      .finally(() => setLoadingNalazi(false));
  }, [tab, termin.pacijent.id]);

  useEffect(() => {
    if (tab !== "historija") return;

    setLoadingHistorija(true);

    fetch(`${apiUrl}/api/historija/pacijent/${termin.pacijent.id}`)
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

              {termin.tip === "hitni" && (
                <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full animate-pulse">
                  <AlertTriangle size={11} /> HITNO
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

        <div className="flex gap-2 flex-wrap items-center">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${tc.badge}`}>
            {tc.label}
          </span>

          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.cls}`}>
            {sc.label}
          </span>

          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {tc.trajanje} min
          </span>

          {termin.status === "zakazan" && (
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => onPromjenaDuzine(termin)}
                className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 font-semibold transition-colors border border-orange-200"
              >
                <Timer size={10} /> Promijeni dužinu
              </button>

              <button
                onClick={() => onOtkaziTermin(termin)}
                className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200 font-semibold transition-colors border border-red-200"
              >
                <XCircle size={10} /> Otkaži termin
              </button>

              <button
                onClick={() => onZavrsiPregled(termin)}
                className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200 font-semibold transition-colors border border-green-200"
              >
                <CheckCircle size={10} /> Završi pregled
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex border-b border-gray-100">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              tab === t.id
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "info" && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Ime i prezime", value: `${termin.pacijent.ime} ${termin.pacijent.prezime}` },
              { label: "Godište", value: termin.pacijent.godisteRodjenja.toString() },
              { label: "Dob", value: `${getAge(termin.pacijent.godisteRodjenja)} god.` },
              { label: "Pol", value: termin.pacijent.pol === "M" ? "Muški" : "Ženski" },
              { label: "Email", value: termin.pacijent.email },
              { label: "Telefon", value: termin.pacijent.telefon },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-0.5">{item.label}</div>
                <div className="text-sm font-semibold text-gray-800">{item.value}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "komentari" && (
          <div className="flex flex-col gap-3">
            {termin.komentari.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Nema komentara za ovaj termin</p>
              </div>
            ) : (
              termin.komentari.map(k => (
                <div
                  key={k.id}
                  className={`rounded-lg p-3 ${
                    k.jeDoktor ? "bg-blue-50 border border-blue-100" : "bg-gray-50 border border-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-semibold ${k.jeDoktor ? "text-blue-700" : "text-gray-700"}`}>
                      {k.jeDoktor ? "🩺 " : "👤 "}
                      {k.autor}
                    </span>
                    <span className="text-xs text-gray-400">{formatDatumPrikaz(k.datum)}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{k.tekst}</p>
                </div>
              ))
            )}

            <div className="border-t border-gray-100 pt-3 mt-1">
              <p className="text-xs text-gray-500 mb-2 font-medium">Dodaj komentar</p>

              <textarea
                value={noviKomentar}
                onChange={e => setNoviKomentar(e.target.value)}
                placeholder="Unesite komentar..."
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-lg p-2.5 resize-none outline-none focus:border-blue-400 bg-gray-50"
              />

              <button
                onClick={handleSend}
                disabled={!noviKomentar.trim()}
                className={`mt-2 w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  noviKomentar.trim()
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Send size={14} /> Pošalji
              </button>
            </div>
          </div>
        )}

        {tab === "nalazi" && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-3">
              Svi nalazi — {termin.pacijent.ime} {termin.pacijent.prezime}
            </p>

            {loadingNalazi ? (
              <div className="text-center py-10">
                <div className="text-sm text-gray-400">Učitavanje nalaza...</div>
              </div>
            ) : nalazi.length === 0 ? (
              <div className="text-center py-10">
                <FileText size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Nema uploadovanih nalaza</p>
              </div>
            ) : (
              nalazi.map(n => (
                <a
                  key={n.id}
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <FileText size={15} className="text-red-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{n.naziv}</div>
                    <div className="text-xs text-gray-400">{formatDatumPrikaz(n.datum)}</div>
                  </div>

                  <ExternalLink size={14} className="text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                </a>
              ))
            )}
          </div>
        )}

        {tab === "historija" && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-3">
              Historija dolazaka — {termin.pacijent.ime} {termin.pacijent.prezime}
            </p>

            {loadingHistorija ? (
              <div className="text-center py-10 text-sm text-gray-400">Učitavanje historije...</div>
            ) : historija.length === 0 ? (
              <div className="text-center py-10">
                <History size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Nema prethodnih posjeta</p>
              </div>
            ) : (
              historija.map(h => (
                <button
                  key={h.id}
                  onClick={() => setSelectedHistorija(h)}
                  className="w-full text-left bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">
                      {formatDatumPrikaz(h.datumPregleda)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {formatV(h.rezervacija?.termin?.vrijeme)}
                      </span>
                      <ExternalLink size={12} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>

                  <div className="text-sm font-medium text-gray-800 mb-1">{h.dijagnoza}</div>
                  <div className="text-xs text-gray-500">Terapija: {h.terapija}</div>

                  {h.biljeske && (
                    <div className="text-xs text-gray-400 mt-1">Bilješke: {h.biljeske}</div>
                  )}

                  {/* ISPRAVKA: recepti su direktno na h, ne na h.nalaz */}
                  {h.recepti?.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                        {h.recepti.length} recept{h.recepti.length !== 1 ? "a" : ""}
                      </span>
                    </div>
                  )}
                </button>
              ))
            )}

            {/* Modal detalji pregleda */}
            {selectedHistorija && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <History size={16} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white">Detalji pregleda</h2>
                        <p className="text-xs text-blue-200">
                          {formatDatumPrikaz(selectedHistorija.datumPregleda)}
                          {" · "}
                          {formatV(selectedHistorija.rezervacija?.termin?.vrijeme)}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedHistorija(null)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                      <X size={16} className="text-white" />
                    </button>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">Dijagnoza</div>
                        <div className="text-sm font-semibold text-gray-800">{selectedHistorija.dijagnoza}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">Terapija</div>
                        <div className="text-sm text-gray-700">{selectedHistorija.terapija}</div>
                      </div>
                      {selectedHistorija.biljeske && (
                        <div>
                          <div className="text-xs text-gray-400 mb-0.5">Bilješke</div>
                          <div className="text-sm text-gray-600">{selectedHistorija.biljeske}</div>
                        </div>
                      )}
                    </div>

                    {/* ISPRAVKA: recepti su direktno na selectedHistorija, ne na selectedHistorija.nalaz */}
                    {selectedHistorija.recepti?.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Recepti</div>
                        <div className="space-y-2">
                          {selectedHistorija.recepti.map((r: any) => (
                            <div key={r.id} className="bg-green-50 border border-green-100 rounded-lg p-3">
                              <div className="text-sm font-semibold text-green-800">{r.nazivLijeka}</div>
                              <div className="text-xs text-green-600">Doza: {r.doza} · Trajanje: {r.trajanje} dana</div>
                              {r.napomena && <div className="text-xs text-gray-500 mt-1">{r.napomena}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Nalaz/PDF — ostaje ako postoji */}
                    {selectedHistorija.nalaz && (
                      <a
                        href={`${apiUrl}/api/nalazi/${selectedHistorija.nalaz.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                          <FileText size={15} className="text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800">
                            {selectedHistorija.nalaz.naziv}
                          </div>
                          <div className="text-xs text-gray-400">Priloženi nalaz</div>
                        </div>
                        <ExternalLink size={14} className="text-gray-400 group-hover:text-blue-500" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}