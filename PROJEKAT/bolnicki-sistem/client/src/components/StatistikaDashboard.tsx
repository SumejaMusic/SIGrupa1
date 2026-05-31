import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";

// ── Tipovi ────────────────────────────────────────────────────
interface AnalitikaOdjel {
  naziv: string;
  slobodni: number;
  zakazani: number;
  otkazani: number;
  ukupno: number;
}

interface AnalitikaDoktor {
  ime: string;
  prezime: string;
  odjel: string;
  slobodni: number;
  zakazani: number;
  otkazani: number;
  ukupno: number;
}

interface AnalitikaData {
  terminDanas: number;
  terminSedmica: number;
  ukupnoMjesec: number;
  otkazaniMjesec: number;
  propusteniMjesec: number;
  procenatOtkazanih: number;
  prosjecnoVrijemeCekanja: number | null;
  poOdjelu: AnalitikaOdjel[];
  poDoktoru: AnalitikaDoktor[];
}

type Period = "danas" | "sedmica" | "mjesec" | "custom";

// ── Konstante ─────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL ?? "";
const API = `${BASE_URL}/api`;

const BOJE_GRAFOVA = ["#7C3AED", "#0D9488", "#D97706", "#DC2626", "#2563EB", "#059669"];
const BOJE_PIE = ["#0D9488", "#D97706", "#DC2626"];

function authHeader(): Record<string, string> {
  const token = localStorage.getItem("token");
  if (!token) return { "Content-Type": "application/json" };
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

// ── Kartica metrike ───────────────────────────────────────────
function MetrikaKartica({
  naslov, vrijednost, podnaslov, boja,
}: {
  naslov: string;
  vrijednost: string | number;
  podnaslov?: string;
  boja?: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <p className="text-xs text-white/40 mb-1">{naslov}</p>
      <p className={`text-3xl font-bold ${boja ?? "text-white"}`}>{vrijednost}</p>
      {podnaslov && <p className="text-xs text-white/30 mt-1">{podnaslov}</p>}
    </div>
  );
}

// ── Tooltip za grafove ────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e1b3a] border border-white/15 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-white/60 mb-1 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ── Glavna komponenta ─────────────────────────────────────────
export default function StatistikaDashboard() {
  const [data, setData] = useState<AnalitikaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [greska, setGreska] = useState(false);
  const [period, setPeriod] = useState<Period>("mjesec");
  const [datumOd, setDatumOd] = useState("");
  const [datumDo, setDatumDo] = useState("");
  const [filterOdjel, setFilterOdjel] = useState("");
  const [vrijemePocetka] = useState(performance.now());
  const [vrijemeUcitavanja, setVrijemeUcitavanja] = useState<number | null>(null);

  const ucitaj = async (p: Period, od?: string, doo?: string) => {
    const start = performance.now();
    setLoading(true);
    setGreska(false);
    try {
      let url = `${API}/admin/analitika?period=${p}`;
      if (p === "custom" && od && doo) url += `&datumOd=${od}&datumDo=${doo}`;
      const res = await fetch(url, { headers: authHeader() });
      if (!res.ok) throw new Error();
      setData(await res.json());
      setVrijemeUcitavanja(Math.round(performance.now() - start));
    } catch {
      setGreska(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    ucitaj("mjesec");
  }, []);

  const primijeniFilter = () => {
    if (period === "custom") {
      if (!datumOd || !datumDo) return;
      ucitaj("custom", datumOd, datumDo);
    } else {
      ucitaj(period);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
        <span className="ml-3 text-white/40 text-sm">Učitavanje analitike…</span>
      </div>
    );

  if (greska)
    return (
      <div className="text-center py-16">
        <p className="text-red-400 mb-2">Greška pri učitavanju analitike.</p>
        <button
          onClick={() => ucitaj(period)}
          className="text-xs text-purple-400 underline"
        >
          Pokušaj ponovo
        </button>
      </div>
    );

  if (!data) return null;

  const odjeliUnikati = [...new Set(data.poDoktoru.map((d) => d.odjel))].sort();
  const filtrovaniDoktori = filterOdjel
    ? data.poDoktoru.filter((d) => d.odjel === filterOdjel)
    : data.poDoktoru;

  // Podaci za pie chart
  const pieData = [
    { name: "Zakazano", value: data.ukupnoMjesec - data.otkazaniMjesec - data.propusteniMjesec },
    { name: "Otkazano", value: data.otkazaniMjesec },
    { name: "Propušteno", value: data.propusteniMjesec },
  ].filter((d) => d.value > 0);

  // Podaci za bar chart doktora (top 8)
  const doktoriChartData = filtrovaniDoktori.slice(0, 8).map((d) => ({
    ime: `${d.ime[0]}. ${d.prezime}`,
    Zakazano: d.zakazani,
    Otkazano: d.otkazani,
    Slobodno: d.slobodni,
  }));

  // Podaci za bar chart odjela
  const odjeliChartData = data.poOdjelu.map((o) => ({
    naziv: o.naziv,
    Zakazano: o.zakazani,
    Otkazano: o.otkazani,
    Slobodno: o.slobodni,
  }));

  const periodLabel: Record<Period, string> = {
    danas: "Danas",
    sedmica: "Ova sedmica",
    mjesec: new Date().toLocaleDateString("bs", { month: "long", year: "numeric" }),
    custom: datumOd && datumDo ? `${datumOd} — ${datumDo}` : "Prilagođeni period",
  };

  const otkazBoja =
    data.procenatOtkazanih > 20
      ? "text-red-400"
      : data.procenatOtkazanih > 10
      ? "text-orange-400"
      : "text-green-400";

  return (
    <div className="space-y-6">

      {/* ── Period filter ── */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="text-xs text-white/40 mb-2">Vremenski period</p>
            <div className="flex gap-1">
              {(["danas", "sedmica", "mjesec", "custom"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    period === p
                      ? "bg-purple-600 text-white"
                      : "bg-white/5 text-white/50 hover:bg-white/10"
                  }`}
                >
                  {p === "custom" ? "Prilagođeno" : periodLabel[p]}
                </button>
              ))}
            </div>
          </div>

          {period === "custom" && (
            <>
              <div>
                <p className="text-xs text-white/40 mb-1">Od</p>
                <input
                  type="date"
                  value={datumOd}
                  onChange={(e) => setDatumOd(e.target.value)}
                  className="bg-white/5 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Do</p>
                <input
                  type="date"
                  value={datumDo}
                  onChange={(e) => setDatumDo(e.target.value)}
                  className="bg-white/5 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-purple-500"
                />
              </div>
            </>
          )}

          <button
            onClick={primijeniFilter}
            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg font-medium transition-colors"
          >
            Primijeni
          </button>

          {vrijemeUcitavanja !== null && (
            <span className={`text-xs ml-auto ${vrijemeUcitavanja <= 3000 ? "text-green-400" : "text-red-400"}`}>
              ⚡ Učitano za {(vrijemeUcitavanja / 1000).toFixed(2)}s
              {vrijemeUcitavanja > 3000 && " (NFR-15 prekoračen)"}
            </span>
          )}
        </div>
      </div>

      {/* ── Ključne metrike ── */}
      <div>
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
          Ključne metrike — {periodLabel[period]}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetrikaKartica
            naslov="Termini danas"
            vrijednost={data.terminDanas}
            podnaslov="zakazana posjeta"
          />
          <MetrikaKartica
            naslov="Termini ove sedmice"
            vrijednost={data.terminSedmica}
            podnaslov="zakazana posjeta"
            boja="text-teal-400"
          />
          <MetrikaKartica
            naslov="Otkazani / propušteni"
            vrijednost={`${data.procenatOtkazanih}%`}
            podnaslov={`${data.otkazaniMjesec} otk. + ${data.propusteniMjesec} prop.`}
            boja={otkazBoja}
          />
          <MetrikaKartica
            naslov="Prosjek čekanja (hitni)"
            vrijednost={data.prosjecnoVrijemeCekanja !== null ? `${data.prosjecnoVrijemeCekanja}d` : "—"}
            podnaslov="od zakazivanja do termina"
            boja="text-purple-400"
          />
        </div>
      </div>

      {/* ── Grafovi — odjeli i pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bar chart — po odjelu */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white/70 mb-4">
            Termini po odjelima — {periodLabel[period]}
          </h3>
          {odjeliChartData.length === 0 ? (
            <p className="text-center text-white/30 py-12 text-sm">Nema podataka za odabrani period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={odjeliChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="naziv"
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)", paddingTop: 8 }}
                />
                <Bar dataKey="Zakazano" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Otkazano" fill="#DC2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Slobodno" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart — raspodjela statusa */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white/70 mb-4">Raspodjela termina</h3>
          {pieData.length === 0 ? (
            <p className="text-center text-white/30 py-12 text-sm">Nema podataka.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={BOJE_PIE[i % BOJE_PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ background: BOJE_PIE[i % BOJE_PIE.length] }}
                      />
                      <span className="text-white/50">{d.name}</span>
                    </div>
                    <span className="text-white font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Opterećenost doktora ── */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-white/70">
            Opterećenost doktora — {periodLabel[period]}
          </h3>
          <select
            value={filterOdjel}
            onChange={(e) => setFilterOdjel(e.target.value)}
            className="bg-white/5 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none focus:border-purple-500"
          >
            <option value="">Svi odjeli</option>
            {odjeliUnikati.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        {doktoriChartData.length === 0 ? (
          <p className="text-center text-white/30 py-12 text-sm">Nema podataka za odabrani filter.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={doktoriChartData}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="ime"
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)", paddingTop: 8 }}
              />
              <Bar dataKey="Zakazano" fill="#7C3AED" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Otkazano" fill="#DC2626" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Tabela odjela ── */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h3 className="text-sm font-medium text-white/70 mb-4">
          Detalji po odjelima
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/30 text-xs border-b border-white/5">
                <th className="text-left pb-3 font-medium">Odjel</th>
                <th className="text-right pb-3 font-medium">Zakazano</th>
                <th className="text-right pb-3 font-medium">Slobodno</th>
                <th className="text-right pb-3 font-medium">Otkazano</th>
                <th className="text-right pb-3 font-medium">Iskorištenost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.poOdjelu.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-white/30 py-8">
                    Nema podataka za odabrani period.
                  </td>
                </tr>
              ) : (
                data.poOdjelu.map((o) => {
                  const iskor = o.ukupno > 0 ? Math.round((o.zakazani / o.ukupno) * 100) : 0;
                  return (
                    <tr key={o.naziv} className="hover:bg-white/3 transition-colors">
                      <td className="py-3 text-white font-medium">{o.naziv}</td>
                      <td className="py-3 text-right text-teal-400">{o.zakazani}</td>
                      <td className="py-3 text-right text-white/40">{o.slobodni}</td>
                      <td className="py-3 text-right text-red-400">{o.otkazani}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${iskor}%` }}
                            />
                          </div>
                          <span className="text-white/60 text-xs w-8 text-right">{iskor}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}