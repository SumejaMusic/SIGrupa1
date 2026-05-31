import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Users, Download } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";
const API = `${BASE_URL}/api`;

function authHeader(): Record<string, string> {
  const token = localStorage.getItem("token");
  if (!token) return { "Content-Type": "application/json" };
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export default function MenadzmantPanel() {
  const navigate = useNavigate();
  const [korisnici, setKorisnici] = useState<{ uloga: string; broj: number }[]>([]);
  const [terminiStats, setTerminiStats] = useState<any>(null);
  const [od, setOd] = useState("");
  const [do_, setDo] = useState("");
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportGreska, setExportGreska] = useState("");

  useEffect(() => {
    const dohvati = async () => {
      setLoading(true);
      try {
        const [resK, resT] = await Promise.all([
          fetch(`${API}/vlasnik/korisnici-po-ulogama`, { headers: authHeader() }),
          fetch(`${API}/vlasnik/termini-stats`, { headers: authHeader() }),
        ]);
        if (resK.ok) setKorisnici(await resK.json());
        if (resT.ok) setTerminiStats(await resT.json());
      } catch { /* silent */ }
      setLoading(false);
    };
    dohvati();
  }, []);

  const exportCSV = async () => {
    if (!od || !do_) return;
    setExportGreska("");
    setExportLoading(true);
    try {
      const res = await fetch(`${API}/vlasnik/export-csv?period=custom&datumOd=${od}&datumDo=${do_}`, {
        headers: authHeader(),
      });
      if (!res.ok) { setExportGreska("Greška pri exportu."); setExportLoading(false); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `statistika_${od}_${do_}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { setExportGreska("Greška pri exportu."); }
    setExportLoading(false);
  };

  const ulogaConfig: Record<string, { boja: string; label: string }> = {
    ADMINISTRATOR: { boja: "bg-red-50 border-red-200 text-red-700", label: "Administrator" },
    DOKTOR:        { boja: "bg-blue-50 border-blue-200 text-blue-700", label: "Doktor" },
    PACIJENT:      { boja: "bg-green-50 border-green-200 text-green-700", label: "Pacijent" },
    MEDICINSKO_OSOBLJE: { boja: "bg-yellow-50 border-yellow-200 text-yellow-700", label: "Med. osoblje" },
    VLASNIK:       { boja: "bg-purple-50 border-purple-200 text-purple-700", label: "Vlasnik" },
  };

  const inp = "px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-700 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-blue-900">Menadžment Panel</h1>
              <p className="text-xs text-gray-400">Pregled statistike i izvještaji</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            ← Nazad
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Korisnici */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-700" />
                <h2 className="text-base font-semibold text-gray-900">Registrovani korisnici</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {korisnici.map((k) => {
                  const cfg = ulogaConfig[k.uloga];
                  return (
                    <div key={k.uloga} className={`rounded-xl border p-4 ${cfg?.boja ?? "bg-gray-50 border-gray-200 text-gray-700"}`}>
                      <p className="text-2xl font-bold">{k.broj}</p>
                      <p className="text-xs mt-1 font-medium">{cfg?.label ?? k.uloga}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Termini */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-base font-semibold text-gray-900">Zakazani termini po doktoru</h2>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 inline-flex items-center gap-3 mb-5">
                <div>
                  <p className="text-xs text-blue-600 font-medium">Slobodni termini (ukupno)</p>
                  <p className="text-3xl font-bold text-blue-700">{terminiStats?.slobodni ?? 0}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Doktor</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Odjel</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Ukupno</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Zakazanih</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Slobodnih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!terminiStats?.zakazaniPoDoktoru?.length ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Nema zakazanih termina.</td></tr>
                    ) : (
                      terminiStats.zakazaniPoDoktoru.map((d: any, i: number) => {
                        const pct = d.ukupno > 0 ? Math.round((d.brojZakazanih / d.ukupno) * 100) : 0;
                        return (
                          <tr key={d.doktorId} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">Dr. {d.ime} {d.prezime}</td>
                            <td className="px-4 py-3 text-gray-500">{d.odjel}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{d.ukupno}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden hidden sm:block">
                                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="font-semibold text-blue-700">{d.brojZakazanih}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-green-600">{d.brojSlobodnih}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Export */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Download className="w-5 h-5 text-blue-700" />
                <h2 className="text-base font-semibold text-gray-900">Export statistike u Excel</h2>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-sm text-gray-500 mb-5">
                  Exportuje statistiku zakazanih pregleda po doktorima za odabrani period.
                </p>
                <div className="flex flex-wrap gap-4 items-end">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Od datuma</label>
                    <input type="date" value={od} onChange={(e) => setOd(e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Do datuma</label>
                    <input type="date" value={do_} onChange={(e) => setDo(e.target.value)} className={inp} />
                  </div>
                  <button
                    onClick={exportCSV}
                    disabled={!od || !do_ || exportLoading}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium transition-colors disabled:opacity-40"
                  >
                    <Download className="w-4 h-4" />
                    {exportLoading ? "Exportovanje..." : "Exportuj Excel"}
                  </button>
                </div>
                {exportGreska && <p className="text-sm text-red-600 mt-3">{exportGreska}</p>}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}