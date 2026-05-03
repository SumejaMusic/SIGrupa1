import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, AlertCircle, CheckCircle2, Heart, Brain, Baby, Bone, Search, Home, Calendar, Building2, User, Menu, X } from "lucide-react";

type KorisnikInfo = {
  ime: string;
  prezime: string;
  uloga: string;
};

type Odjel = {
  id: number;
  naziv: string;
  ikona: React.ReactNode;
  opis: string;
  doktori: string[];
  nagrade: string[];
};

type Doktor = {
  id: number;
  ime: string;
  prezime: string;
  specijalizacija: string;
  iskustvo: number;
};

type Termin = {
  id: number;
  datum: string;
  vrijeme: number;
  status: string;
};

type RezervacijaFormData = {
  odjelId: number;
  idDoktor: number;
  idTermina: number;
  idTipPregleda: number;
};

const formatVrijeme = (minute: number): string => {
  const sati = Math.floor(minute / 60).toString().padStart(2, "0");
  const min = (minute % 60).toString().padStart(2, "0");
  return `${sati}:${min}`;
};

function RezervacijaPacijent() {
  const [korisnik] = useState<KorisnikInfo>({ ime: "Marko", prezime: "Marković", uloga: "PACIJENT" });
  const [doktori, setDoktori] = useState<Doktor[]>([]);
  const [termini, setTermini] = useState<Termin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uspjeh, setUspjeh] = useState(false);
  const [hoveredOdjel, setHoveredOdjel] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [step, setStep] = useState(1);

  const [form, setForm] = useState<RezervacijaFormData>({
    odjelId: 0,
    idDoktor: 0,
    idTermina: 0,
    idTipPregleda: 1,
  });

  const odjeli: Odjel[] = [
    {
      id: 1,
      naziv: "Kardiologija",
      ikona: <Heart size={48} />,
      opis: "Specijalnost za bolesti srca i krvnih žila",
      doktori: ["Dr. Amira Hadžić", "Dr. Miloš Đurić"],
      nagrade: ["Europska nagrada za kardiologiju 2022", "Best Cardiologist 2023"],
    },
    {
      id: 2,
      naziv: "Neurologija",
      ikona: <Brain size={48} />,
      opis: "Specijalnost za bolesti nervnog sistema",
      doktori: ["Dr. Petar Nikolić", "Dr. Jelena Stanković"],
      nagrade: ["Najlepši doktor 2023", "Excellence in Neurology Award"],
    },
    {
      id: 3,
      naziv: "Pedijatrija",
      ikona: <Baby size={48} />,
      opis: "Specijalnost za zdravlje djece",
      doktori: ["Dr. Ana Marković", "Dr. Nikola Jovanović"],
      nagrade: ["Best Pediatrician 2023", "Child Health Excellence"],
    },
    {
      id: 4,
      naziv: "Ortopedija",
      ikona: <Bone size={48} />,
      opis: "Specijalnost za bolesti kostiju i zglobova",
      doktori: ["Dr. Marko Lazarević", "Dr. Sanja Đorđević"],
      nagrade: ["Orthopedic Excellence Award 2023"],
    },
  ];

  const tipoviPregleda = [
    { id: 1, naziv: "Preventivni pregled" },
    { id: 2, naziv: "Kontrolni pregled" },
    { id: 3, naziv: "Hitni pregled" },
  ];

  const allDoktori: { [key: number]: Doktor[] } = {
    1: [
      { id: 1, ime: "Amira", prezime: "Hadžić", specijalizacija: "Kardiologija", iskustvo: 15 },
      { id: 2, ime: "Miloš", prezime: "Đurić", specijalizacija: "Kardiologija", iskustvo: 12 },
    ],
    2: [
      { id: 3, ime: "Petar", prezime: "Nikolić", specijalizacija: "Neurologija", iskustvo: 18 },
      { id: 4, ime: "Jelena", prezime: "Stanković", specijalizacija: "Neurologija", iskustvo: 10 },
    ],
    3: [
      { id: 5, ime: "Ana", prezime: "Marković", specijalizacija: "Pedijatrija", iskustvo: 14 },
      { id: 6, ime: "Nikola", prezime: "Jovanović", specijalizacija: "Pedijatrija", iskustvo: 9 },
    ],
    4: [
      { id: 7, ime: "Marko", prezime: "Lazarević", specijalizacija: "Ortopedija", iskustvo: 16 },
      { id: 8, ime: "Sanja", prezime: "Đorđević", specijalizacija: "Ortopedija", iskustvo: 11 },
    ],
  };

  useEffect(() => {
    if (form.odjelId === 0) {
      setDoktori([]);
      return;
    }
    setDoktori(allDoktori[form.odjelId] || []);
  }, [form.odjelId]);

  useEffect(() => {
    if (form.idDoktor === 0) {
      setTermini([]);
      return;
    }
    const mockTermini: Termin[] = [
      { id: 1, datum: "2024-05-15", vrijeme: 900, status: "SLOBODAN" },
      { id: 2, datum: "2024-05-15", vrijeme: 1000, status: "SLOBODAN" },
      { id: 3, datum: "2024-05-16", vrijeme: 1400, status: "SLOBODAN" },
      { id: 4, datum: "2024-05-17", vrijeme: 1100, status: "SLOBODAN" },
    ];
    setTermini(mockTermini);
  }, [form.idDoktor]);

  const handleSelectOdjel = (odjelId: number) => {
    setForm((prev) => ({
      ...prev,
      odjelId,
      idDoktor: 0,
      idTermina: 0,
    }));
    setStep(2);
  };

  const handleSelectDoktor = (doktorId: number) => {
    setForm((prev) => ({
      ...prev,
      idDoktor: doktorId,
      idTermina: 0,
    }));
    setStep(3);
  };

  const handleSelectTermin = (terminId: number) => {
    setForm((prev) => ({
      ...prev,
      idTermina: terminId,
    }));
    setStep(4);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (form.idDoktor === 0 || form.idTermina === 0) {
      setError("Molimo odaberite doktora i termin.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setUspjeh(false);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setUspjeh(true);
      setForm({ odjelId: 0, idDoktor: 0, idTermina: 0, idTipPregleda: 1 });
      setStep(1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const filteredOdjeli = odjeli.filter((o) =>
    o.naziv.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentOdjel = odjeli.find((o) => o.id === form.odjelId);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shadow-sm`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">
              S
            </div>
            {sidebarOpen && <span className="font-bold text-gray-900">SwiftMed</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/" className="sidebar-item">
            <Home size={20} />
            {sidebarOpen && <span>Nasiona</span>}
          </Link>
          <Link to="/moje-rezervacije" className="sidebar-item">
            <Calendar size={20} />
            {sidebarOpen && <span>Moje Rezervacije</span>}
          </Link>
          <button className="sidebar-item w-full bg-blue-50 text-blue-600">
            <Building2 size={20} />
            {sidebarOpen && <span>Odjeli</span>}
          </button>
          <Link to="/" className="sidebar-item">
            <User size={20} />
            {sidebarOpen && <span>Profil</span>}
          </Link>
        </nav>

        {/* Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 border-t border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-semibold text-gray-900">KORAK {step}/5</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
            <span className={step >= 1 ? "text-blue-600 font-semibold" : ""}>1. Izbor Odjela</span>
            <ChevronRight size={16} />
            <span className={step >= 2 ? "text-blue-600 font-semibold" : ""}>2. Izbor Doktora</span>
            <ChevronRight size={16} />
            <span className={step >= 3 ? "text-blue-600 font-semibold" : ""}>3. Termini</span>
            <ChevronRight size={16} />
            <span className={step >= 4 ? "text-blue-600 font-semibold" : ""}>4. Podaci</span>
            <ChevronRight size={16} />
            <span className={step >= 5 ? "text-blue-600 font-semibold" : ""}>5. Potvrda</span>
          </div>

          {/* Title and Search */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Izbor Odjela</h1>
              <p className="text-gray-600 text-sm mt-1">Department Selection</p>
            </div>
            {step === 1 && (
              <div className="flex gap-2">
                <div className="relative w-64">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Traži odjel / Search Department"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Traži odjel
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 overflow-auto">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <h3 className="font-semibold text-red-800">Greška</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {uspjeh && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded flex items-start gap-3">
              <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <h3 className="font-semibold text-green-800">Rezervacija uspješna!</h3>
                <p className="text-green-700 text-sm mt-1">Termin je uspješno rezerviran. Potvrda je poslana na vašu email adresu.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* STEP 1: ODJELI */}
            {(step === 1 || step >= 1) && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredOdjeli.map((odjel) => (
                    <div
                      key={odjel.id}
                      className="relative"
                      onMouseEnter={() => setHoveredOdjel(odjel.id)}
                      onMouseLeave={() => setHoveredOdjel(null)}
                    >
                      <div className={`bg-white rounded-2xl p-6 border-2 transition-all duration-300 cursor-pointer ${
                        form.odjelId === odjel.id
                          ? "border-blue-500 shadow-lg"
                          : "border-gray-200 hover:border-blue-200 shadow-sm hover:shadow-md"
                      }`}>
                        {/* Icon Background */}
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-colors ${
                          form.odjelId === odjel.id ? "bg-blue-100 text-blue-600" : "bg-blue-50 text-blue-500"
                        }`}>
                          {odjel.ikona}
                        </div>

                        {/* Title and Description */}
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{odjel.naziv}</h3>
                        <p className="text-sm text-gray-600 mb-4">{odjel.opis}</p>

                        {/* Button */}
                        <button
                          type="button"
                          onClick={() => handleSelectOdjel(odjel.id)}
                          className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${
                            form.odjelId === odjel.id
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-600"
                          }`}
                        >
                          {form.odjelId === odjel.id ? "✓ Odabrано" : "Izaberi / Select"}
                        </button>
                      </div>

                      {/* Hover Popup */}
                      {hoveredOdjel === odjel.id && (
                        <div className="absolute left-0 top-full mt-2 w-80 bg-white border-2 border-blue-300 rounded-xl shadow-2xl z-50 p-5 animate-fade-in-up">
                          <h3 className="font-bold text-lg text-gray-900 mb-3">{odjel.naziv}</h3>
                          <p className="text-sm text-gray-600 mb-4 leading-relaxed">{odjel.opis}</p>

                          <div className="mb-4">
                            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Poznati doktori:</p>
                            <ul className="space-y-2">
                              {odjel.doktori.map((doktor, idx) => (
                                <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                  <span className="w-2 h-2 bg-blue-600 rounded-full" />
                                  {doktor}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="border-t border-gray-200 pt-4">
                            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Nagrade:</p>
                            <ul className="space-y-2">
                              {odjel.nagrade.map((nagrada, idx) => (
                                <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                                  <span className="text-lg">⭐</span>
                                  <span>{nagrada}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: DOKTORI */}
            {step >= 2 && (
              <div className={`transition-opacity ${form.odjelId === 0 ? "opacity-50 pointer-events-none" : ""}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Izaberite doktora</h2>
                {form.odjelId === 0 ? (
                  <p className="text-gray-500 text-center py-12 bg-white rounded-xl">Prvo trebate odabrati odjel</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {doktori.map((doktor) => (
                      <button
                        key={doktor.id}
                        type="button"
                        onClick={() => handleSelectDoktor(doktor.id)}
                        className={`p-6 rounded-xl border-2 transition-all duration-300 text-left bg-white ${
                          form.idDoktor === doktor.id
                            ? "border-blue-500 shadow-lg bg-blue-50"
                            : "border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg">Dr. {doktor.ime} {doktor.prezime}</h3>
                            <p className="text-sm text-gray-600 mt-2">{doktor.specijalizacija}</p>
                            <p className="text-xs text-gray-500 mt-3">Iskustvo: {doktor.iskustvo} godina</p>
                          </div>
                          {form.idDoktor === doktor.id && <CheckCircle2 size={28} className="text-blue-600 flex-shrink-0" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: TIP PREGLEDA */}
            {step >= 3 && (
              <div className={`transition-opacity ${form.idDoktor === 0 ? "opacity-50 pointer-events-none" : ""}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Tip pregleda</h2>
                {form.idDoktor === 0 ? (
                  <p className="text-gray-500 text-center py-12 bg-white rounded-xl">Prvo trebate odabrati doktora</p>
                ) : (
                  <div className="space-y-3">
                    {tipoviPregleda.map((tip) => (
                      <label
                        key={tip.id}
                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 bg-white ${
                          form.idTipPregleda === tip.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="idTipPregleda"
                          value={tip.id}
                          checked={form.idTipPregleda === tip.id}
                          onChange={(e) => setForm((prev) => ({ ...prev, idTipPregleda: parseInt(e.target.value) }))}
                          className="w-5 h-5 accent-blue-600"
                        />
                        <span className="ml-4 font-semibold text-gray-900">{tip.naziv}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: TERMINI */}
            {step >= 4 && (
              <div className={`transition-opacity ${form.idDoktor === 0 ? "opacity-50 pointer-events-none" : ""}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Odaberite termin</h2>
                {form.idDoktor === 0 ? (
                  <p className="text-gray-500 text-center py-12 bg-white rounded-xl">Prvo trebate odabrati doktora</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {termini.map((termin) => (
                      <button
                        key={termin.id}
                        type="button"
                        onClick={() => handleSelectTermin(termin.id)}
                        className={`p-6 rounded-xl border-2 transition-all duration-300 text-center bg-white font-semibold ${
                          form.idTermina === termin.id
                            ? "border-blue-500 bg-blue-50 text-blue-900 shadow-lg"
                            : "border-gray-200 text-gray-700 hover:border-blue-300 shadow-sm hover:shadow-md"
                        }`}
                      >
                        <div className="text-sm text-gray-600 mb-2">{new Date(termin.datum).toLocaleDateString("hr-HR")}</div>
                        <div className="text-2xl font-bold mb-3">{formatVrijeme(termin.vrijeme)}</div>
                        {form.idTermina === termin.id && <CheckCircle2 size={24} className="text-blue-600 mx-auto" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={form.idDoktor === 0 || form.idTermina === 0 || loading}
                className={`flex-1 py-3 px-6 rounded-lg font-bold text-white transition-all duration-300 ${
                  form.idDoktor === 0 || form.idTermina === 0 || loading
                    ? "bg-gray-400 cursor-not-allowed opacity-50"
                    : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl"
                }`}
              >
                {loading ? "Rezerviše se..." : "Potvrdi i rezerviši"}
              </button>
              <Link
                to="/"
                className="px-6 py-3 bg-white border-2 border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Nazad
              </Link>
            </div>
          </form>
        </main>
      </div>

      <style>{`
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          color: #6b7280;
          font-weight: 500;
          transition: all 0.3s;
          text-decoration: none;
        }
        .sidebar-item:hover {
          background-color: #f3f4f6;
          color: #111827;
        }
      `}</style>
    </div>
  );
}

export default RezervacijaPacijent;
