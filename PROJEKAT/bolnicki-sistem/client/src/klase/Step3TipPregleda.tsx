import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Layout from "../components/Layout";

type TipPregleda = {
  id: number;
  naziv: string;
  opis: string;
  icona: string;
};
const apiUrl = import.meta.env.VITE_API_URL;
function Step3TipPregleda() {
  const [tipoviPregleda, setTipoviPregleda] = useState<TipPregleda[]>([]);
  const navigate = useNavigate();
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [selectedDoktor, setSelectedDoktor] = useState<number | null>(null);

  /*const tipoviPregleda: TipPregleda[] = [
    {
      id: 1,
      naziv: "Preventivni pregled",
      opis: "Redovna provjera zdravlja i prevencija bolesti",
      icona: "🏥",
    },
    {
      id: 2,
      naziv: "Kontrolni pregled",
      opis: "Praćenje postojećeg stanja i bolesti",
      icona: "📋",
    },
    {
      id: 3,
      naziv: "Hitni pregled",
      opis: "Urgentna medicinska pomoć",
      icona: "🚨",
    },
  ];*/

  useEffect(() => {
    const stored = localStorage.getItem("selectedDoktor");
    if (stored) {
      setSelectedDoktor(parseInt(stored));
    } else {
      navigate("/step2-doktori");
    }
  }, [navigate]);

  useEffect(() => {
  const apiUrl = import.meta.env.VITE_API_URL;
  fetch(`${apiUrl}/api/tippregleda`)
    .then(res => res.json())
    .then(setTipoviPregleda)
    .catch(() => setTipoviPregleda([]));
   }, []);
  const handleSelectTip = (tipId: number) => {
    setSelectedTip(tipId);
    localStorage.setItem("selectedTip", tipId.toString());
    setTimeout(() => navigate("/step4-termini"), 300);
  };

  const handleBack = () => {
    navigate("/step2-doktori");
  };

  return (
    <Layout step={3} totalSteps={5} breadcrumbs={["1. Izbor Odjela", "2. Izbor Doktora", "3. Termini", "4. Podaci", "5. Potvrda"]}>
      <div className="max-w-4xl">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Tip Pregleda</h1>
          <p className="text-gray-600 text-lg">Odaberite vrstu pregleda</p>
        </div>

        {/* Tipovi Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {tipoviPregleda.map((tip) => (
            <div
              key={tip.id}
              onClick={() => handleSelectTip(tip.id)}
              className={`bg-white rounded-2xl p-8 border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-sm hover:shadow-lg ${
                selectedTip === tip.id
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              {/* Icon */}
              <div className="text-5xl mb-4">{tip.icona}</div>

              {/* Title */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">{tip.naziv}</h3>
              <p className="text-sm text-gray-600 mb-6">{tip.opis}</p>

              {/* Button */}
              <button
                type="button"
                onClick={() => handleSelectTip(tip.id)}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  selectedTip === tip.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-600"
                }`}
              >
                {selectedTip === tip.id ? "✓ Odabrаno" : "Izaberi"}
              </button>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-between">
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            Nazad
          </button>
          <button
            disabled={!selectedTip}
            onClick={() => selectedTip && navigate("/step4-termini")}
            className={`py-3 px-8 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              selectedTip
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

export default Step3TipPregleda;
