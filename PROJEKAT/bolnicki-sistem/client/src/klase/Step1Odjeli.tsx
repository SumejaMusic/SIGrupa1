import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Heart, Brain, Baby, Bone, ChevronRight, Star } from "lucide-react";
import Layout from "../components/Layout";

type Odjel = {
  id: number;
  naziv: string;
  opis: string;
};

type OdjelInfo = {
  specijalizacije: string[];
  nagrade: string[];
};

const ikoneMap: { [key: string]: React.ReactNode } = {
  "Kardiologija": <Heart size={48} />,
  "Neurologija": <Brain size={48} />,
  "Pedijatrija": <Baby size={48} />,
  "Ortopedija": <Bone size={48} />,
  "Interna Medicina": <Heart size={48} />,
  "Dermatologija": <Brain size={48} />,
  "Ginekologija": <Baby size={48} />,
  "Radiologija": <Bone size={48} />,
  "Opća medicina": <Heart size={48} />,
};

const odjelInfoMap: { [key: string]: OdjelInfo } = {
  "Kardiologija": {
    specijalizacije: ["Preventivna kardiologija", "Interventna kardiologija", "Elektrofiziologija"],
    nagrade: ["Europska nagrada za kardiologiju 2022", "Best Cardiology Department 2023"],
  },
  "Neurologija": {
    specijalizacije: ["Neurohirurgija", "Neurofiziologija", "Klinička neurologija"],
    nagrade: ["Excellence in Neurology Award 2023"],
  },
  "Pedijatrija": {
    specijalizacije: ["Neonatologija", "Razvojna pedijatrija", "Pedijatrijska gastroenterologija"],
    nagrade: ["Best Pediatric Department 2023", "Child Health Excellence Award"],
  },
  "Ortopedija": {
    specijalizacije: ["Sportska medicina", "Ortopedska hirurgija", "Artroplastika"],
    nagrade: ["Orthopedic Excellence Award 2023"],
  },
  "Interna Medicina": {
    specijalizacije: ["Gastroenterologija", "Pulmonologija", "Endokrinologija"],
    nagrade: ["Best Internal Medicine 2023"],
  },
  "Dermatologija": {
    specijalizacije: ["Estetska dermatologija", "Dermatopatologija", "Laserska terapija"],
    nagrade: ["Excellence in Dermatology 2023"],
  },
  "Ginekologija": {
    specijalizacije: ["Ginekološka hirurgija", "Reproduktivna medicina", "Materno-fetalna medicina"],
    nagrade: ["Best Gynecology Award 2023"],
  },
  "Radiologija": {
    specijalizacije: ["Dijagnostička radiologija", "Interventna radiologija", "Neuroradiologija"],
    nagrade: ["Best Radiology Department 2023"],
  },
  "Opća medicina": {
    specijalizacije: ["Obiteljska medicina", "Preventivna medicina", "Hitna medicina"],
    nagrade: ["Community Health Award 2023"],
  },
};

const defaultInfo: OdjelInfo = {
  specijalizacije: ["Opća specijalizacija", "Klinička praksa"],
  nagrade: ["Certifikat kvalitete 2023"],
};
const apiUrl = import.meta.env.VITE_API_URL;
  //const apiUrl = "http://localhost:5000";

function Step1Odjeli() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredOdjel, setHoveredOdjel] = useState<number | null>(null);
  const [hoveredNaziv, setHoveredNaziv] = useState<string>("");
  const [selectedOdjel, setSelectedOdjel] = useState<number | null>(null);
  const [odjeli, setOdjeli] = useState<Odjel[]>([]);

 useEffect(() => {
  fetch(`${apiUrl}/api/odjeli`)
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) setOdjeli(data);
      else setOdjeli([]);
    })
    .catch(() => setOdjeli([]));
}, []);

  const filteredOdjeli = odjeli
  .filter((o) => o.naziv.toLowerCase() !== "testni odjel")
  .filter((o) => o.naziv.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSelectOdjel = (odjelId: number) => {
    setSelectedOdjel(odjelId);
    localStorage.setItem("selectedOdjel", odjelId.toString());
    setTimeout(() => navigate("/step2-doktori"), 300);
  };

  return (
    <Layout step={1} totalSteps={5} breadcrumbs={["1. Izbor Odjela", "2. Izbor Doktora", "3. Termini", "4. Podaci", "5. Potvrda"]}>
      <div className="max-w-6xl">
        {/* Title and Search */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Izbor Odjela</h1>
          <p className="text-gray-600 text-lg mb-6">Department Selection</p>

          <div className="flex gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Traži odjel / Search Department"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg">
              Traži odjel
            </button>
          </div>
        </div>

        {/* Odjeli Grid */}
        {filteredOdjeli.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <p className="text-gray-600 text-lg">Nema pronađenih odjela sa tim nazivom</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredOdjeli.map((odjel) => {
              const info = odjelInfoMap[odjel.naziv] ?? defaultInfo;

              return (
                <div
                  key={odjel.id}
                  className="relative"
                  onMouseEnter={() => { setHoveredOdjel(odjel.id); setHoveredNaziv(odjel.naziv); }}
                  onMouseLeave={() => { setHoveredOdjel(null); setHoveredNaziv(""); }}
                >
                  {/* Hover Popup - rendered INSIDE the relative div, above the card */}
                  {/* Promijeni poziciju iz 'bottom-full mb-3' u 'top-full mt-3' */}
{hoveredOdjel === odjel.id && (
  <div className="absolute left-0 top-full mt-3 w-72 bg-white border-2 border-blue-400 rounded-xl shadow-2xl z-[999] p-5">
    
    {/* Strelica - okreni je prema GORE */}
    <div className="absolute top-[-10px] left-8 w-4 h-4 bg-white border-l-2 border-t-2 border-blue-400 rotate-45"></div>

   

                      <h3 className="font-bold text-base text-gray-900 mb-1">{odjel.naziv}</h3>
                      <p className="text-xs text-gray-500 mb-3 leading-relaxed">{odjel.opis}</p>

                      {/* Specijalizacije */}
                      <div className="mb-3">
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Specijalizacije</p>
                        <ul className="space-y-1">
                          {info.specijalizacije.map((spec, idx) => (
                            <li key={idx} className="text-xs text-gray-700 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                              {spec}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Nagrade */}
                      <div className="border-t border-gray-100 pt-3">
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Nagrade</p>
                        <ul className="space-y-1">
                          {info.nagrade.map((nagrada, idx) => (
                            <li key={idx} className="text-xs text-amber-700 flex items-start gap-1.5">
                              <Star size={12} className="mt-0.5 flex-shrink-0 fill-amber-400 text-amber-400" />
                              {nagrada}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Card */}
                  <div
                    onClick={() => handleSelectOdjel(odjel.id)}
                    className={`bg-white rounded-2xl p-6 border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-sm hover:shadow-lg ${
                      selectedOdjel === odjel.id
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-colors ${
                      selectedOdjel === odjel.id ? "bg-blue-100 text-blue-600" : "bg-blue-50 text-blue-500"
                    }`}>
                      {ikoneMap[odjel.naziv] ?? <Heart size={48} />}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">{odjel.naziv}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{odjel.opis}</p>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleSelectOdjel(odjel.id); }}
                      className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                        selectedOdjel === odjel.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-600"
                      }`}
                    >
                      {selectedOdjel === odjel.id ? "✓ Odabrano" : "Izaberi"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Next Button */}
        <div className="mt-8 flex justify-end gap-4">
          <button
            disabled={!selectedOdjel}
            onClick={() => selectedOdjel && navigate("/step2-doktori")}
            className={`py-3 px-8 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
              selectedOdjel
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl"
                : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
            }`}
          >
            Dalje
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default Step1Odjeli;