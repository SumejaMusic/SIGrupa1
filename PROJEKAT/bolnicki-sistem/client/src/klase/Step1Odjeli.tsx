import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Heart, Brain, Baby, Bone, ChevronRight } from "lucide-react";
import Layout from "../components/Layout";

type Odjel = {
  id: number;
  naziv: string;
  ikona: React.ReactNode;
  opis: string;
  specijalizacije: string[];
  doktori: string[];
  nagrade: string[];
};

function Step1Odjeli() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredOdjel, setHoveredOdjel] = useState<number | null>(null);
  const [selectedOdjel, setSelectedOdjel] = useState<number | null>(null);

  const odjeli: Odjel[] = [
    {
      id: 1,
      naziv: "Kardiologija",
      ikona: <Heart size={48} />,
      opis: "Reassuring menthw about and arallcy cardiology.",
      specijalizacije: ["Preventivna kardiologija", "Interventna kardiologija", "Elektrofiziologija"],
      doktori: ["Dr. Amira Hadžić", "Dr. Miloš Đurić"],
      nagrade: ["Europska nagrada za kardiologiju 2022", "Best Cardiologist 2023"],
    },
    {
      id: 2,
      naziv: "Neurologija",
      ikona: <Brain size={48} />,
      opis: "Neurollgia is roosesse and rosure and neurologija.",
      specijalizacije: ["Neurohirurgija", "Neurofiziologija", "Klinička neuronika"],
      doktori: ["Dr. Petar Nikolić", "Dr. Jelena Stanković"],
      nagrade: ["Najlepši doktor 2023", "Excellence in Neurology Award"],
    },
    {
      id: 3,
      naziv: "Pedijatrija",
      ikona: <Baby size={48} />,
      opis: "Pediatrica to ensure your paremats and chiltren.",
      specijalizacije: ["Neonatologija", "Razvojna pedijatrija", "Pedijatrijska gastroenterologija"],
      doktori: ["Dr. Ana Marković", "Dr. Nikola Jovanović"],
      nagrade: ["Best Pediatrician 2023", "Child Health Excellence"],
    },
    {
      id: 4,
      naziv: "Ortopedija",
      ikona: <Bone size={48} />,
      opis: "Orthopedics is podical shoes, arcopodins, and bone.",
      specijalizacije: ["Sportska medicina", "Ortopedska hirurgija", "Artoplastika"],
      doktori: ["Dr. Marko Lazarević", "Dr. Sanja Đorđević"],
      nagrade: ["Orthopedic Excellence Award 2023"],
    },
    {
      id: 5,
      naziv: "Interna Medicina",
      ikona: <Heart size={48} />,
      opis: "Reassuring everney consectetur carlipscing.",
      specijalizacije: ["Kardiologija", "Gastroeneterologija", "Pulmonologija"],
      doktori: ["Dr. Marko Petrović", "Dr. Ivana Nikolić"],
      nagrade: ["Best Internal Medicine 2023"],
    },
    {
      id: 6,
      naziv: "Dermatologija",
      ikona: <Brain size={48} />,
      opis: "Reassuring uncaseohogiy and sermatewlogija.",
      specijalizacije: ["Estetska dermatologija", "Dermatopatologija", "Laserska terapija"],
      doktori: ["Dr. Svetlana Marić", "Dr. Nenad Kostić"],
      nagrade: ["Excellence in Dermatology 2023"],
    },
    {
      id: 7,
      naziv: "Ginekologija",
      ikona: <Baby size={48} />,
      opis: "Lorem ipsum dolor sit amet, consectetur adipiscing.",
      specijalizacije: ["Ginekološka hirurgija", "Reproduktivna medicina", "Materno-fetalna medicina"],
      doktori: ["Dr. Milica Jovanović", "Dr. Mirko Stanojević"],
      nagrade: ["Best Gynecology Award 2023"],
    },
    {
      id: 8,
      naziv: "Radiologija",
      ikona: <Bone size={48} />,
      opis: "Lorem ipsum oncoankarology and radialogija.",
      specijalizacije: ["Dijagnostička radiologija", "Intervenciona radiologija", "Neuroradiologija"],
      doktori: ["Dr. Aleksandar Stojanović", "Dr. Biserka Nikolić"],
      nagrade: ["Best Radiology Department 2023"],
    },
  ];

  const filteredOdjeli = odjeli.filter((o) =>
    o.naziv.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

          {/* Search */}
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
            {filteredOdjeli.map((odjel) => (
              <div
                key={odjel.id}
                className="relative"
                onMouseEnter={() => setHoveredOdjel(odjel.id)}
                onMouseLeave={() => setHoveredOdjel(null)}
              >
                {/* Card */}
                <div
                  onClick={() => handleSelectOdjel(odjel.id)}
                  className={`bg-white rounded-2xl p-6 border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-sm hover:shadow-lg ${
                    selectedOdjel === odjel.id
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {/* Icon Background */}
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-colors ${
                    selectedOdjel === odjel.id ? "bg-blue-100 text-blue-600" : "bg-blue-50 text-blue-500"
                  }`}>
                    {odjel.ikona}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{odjel.naziv}</h3>

                  {/* Short Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{odjel.opis}</p>

                  {/* Button */}
                  <button
                    type="button"
                    onClick={() => handleSelectOdjel(odjel.id)}
                    className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      selectedOdjel === odjel.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-600"
                    }`}
                  >
                    {selectedOdjel === odjel.id ? "✓ Odabrано" : "Izaberi / Select"}
                  </button>
                </div>

                {/* Hover Popup - appears above card */}
                {hoveredOdjel === odjel.id && (
                  <div className="absolute left-0 bottom-full mb-2 w-96 bg-white border-2 border-blue-400 rounded-xl shadow-2xl z-50 p-6 animate-fade-in-up">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{odjel.naziv}</h3>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">{odjel.opis}</p>

                    {/* Specijalizacije */}
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Specijalizacije:</p>
                      <ul className="space-y-1.5">
                        {odjel.specijalizacije.map((spec, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            {spec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Doktori */}
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Poznati doktori:</p>
                      <ul className="space-y-1.5">
                        {odjel.doktori.map((doktor, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                            {doktor}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Nagrade */}
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Nagrade:</p>
                      <ul className="space-y-1.5">
                        {odjel.nagrade.map((nagrada, idx) => (
                          <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                            <span className="text-lg mt-0.5">⭐</span>
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
