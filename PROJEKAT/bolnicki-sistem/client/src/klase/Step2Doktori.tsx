import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../components/Layout";
import { ChevronLeft, ChevronRight, Stethoscope, Search } from "lucide-react";
type Doktor = {
  id: number;
  ime: string;
  prezime: string;
  specijalizacija: string;
  iskustvo: number;
  opis: string;
  uziInteres: string;
  slika: string;
  slobodniTermini: string;
};
/*
const doktoriByOdjel: { [key: number]: Doktor[] } = {
  1: [
    { id: 1, ime: "Amira", prezime: "Hadžić", specijalizacija: "Kardiologija", iskustvo: 15, opis: "Specijalizovana za preventivnu i interventnu kardiologiju", uziInteres: "Interventna kardiologija", slika: "https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", slobodniTermini: "Danas" },
    { id: 2, ime: "Miloš", prezime: "Đurić", specijalizacija: "Kardiologija", iskustvo: 12, opis: "Ekspert za kardiovaskularnu elektrofiziologiju", uziInteres: "Elektrofiziologija", slika: "https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", slobodniTermini: "Sutra" },
    { id: 3, ime: "Selma", prezime: "Kovač", specijalizacija: "Kardiologija", iskustvo: 9, opis: "Specijalistkinja za bolesti srčanih zalistaka", uziInteres: "Ehokardiografija", slika: "https://images.pexels.com/photos/5452274/pexels-photo-5452274.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", slobodniTermini: "Danas" },
    { id: 4, ime: "Emir", prezime: "Bašić", specijalizacija: "Kardiologija", iskustvo: 20, opis: "Vodeći kardiolog sa dugogodišnjim iskustvom", uziInteres: "Srčana insuficijencija", slika: "https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", slobodniTermini: "Za 2 dana" },
  ],
  2: [
    { id: 5, ime: "Petar", prezime: "Nikolić", specijalizacija: "Neurologija", iskustvo: 18, opis: "Vodeći neurolog sa 18 godina iskustva", uziInteres: "Epilepsija", slika: "https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", slobodniTermini: "Danas" },
    { id: 6, ime: "Jelena", prezime: "Stanković", specijalizacija: "Neurologija", iskustvo: 10, opis: "Specijalizovana za kliničku neurologiju", uziInteres: "Neuroimaging", slika: "https://images.pexels.com/photos/5452274/pexels-photo-5452274.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", slobodniTermini: "Sutra" },
  ],
  3: [
    { id: 7, ime: "Ana", prezime: "Marković", specijalizacija: "Pedijatrija", iskustvo: 14, opis: "Specijalizovana za dječiju medicinu", uziInteres: "Razvojna pedijatrija", slika: "https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", slobodniTermini: "Danas" },
    { id: 8, ime: "Nikola", prezime: "Jovanović", specijalizacija: "Pedijatrija", iskustvo: 9, opis: "Neonatolog sa bogatim iskustvom", uziInteres: "Neonatologija", slika: "https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", slobodniTermini: "Za 2 dana" },
  ],
  4: [
    { id: 9, ime: "Marko", prezime: "Lazarević", specijalizacija: "Ortopedija", iskustvo: 16, opis: "Hirurg specijalizovan za sportsku medicinu", uziInteres: "Sportska medicina", slika: "https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", slobodniTermini: "Sutra" },
    { id: 10, ime: "Sanja", prezime: "Đorđević", specijalizacija: "Ortopedija", iskustvo: 11, opis: "Specijalista za artroplastiku i rekonstrukciju", uziInteres: "Artroplastika", slika: "https://images.pexels.com/photos/5452274/pexels-photo-5452274.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop", slobodniTermini: "Danas" },
  ],
};

const odjeliNazivi: { [key: number]: string } = {
  1: "Kardiologija", 2: "Neurologija", 3: "Pedijatrija", 4: "Ortopedija",
};
*/
const apiUrl = import.meta.env.VITE_API_URL;
function Step2Doktori() {
  
  const navigate = useNavigate();
  /*const [selectedOdjel, setSelectedOdjel] = useState<number | null>(null);
  const [selectedDoktor, setSelectedDoktor] = useState<number | null>(null); ovo mozda obrisati iz zadnjeg dijela
  const [odjelnaziv, setOdjelNaziv] = useState("");*/
  const [hoveredDoktor, setHoveredDoktor] = useState<number | null>(null);
  const [pretraga, setPretraga] = useState("");
  const [selectedOdjel, setSelectedOdjel] = useState<number | null>(null);
  const [doktori, setDoktori] = useState<Doktor[]>([]);
  const [odjelnaziv, setOdjelNaziv] = useState("");
  const [selectedDoktor, setSelectedDoktor] = useState<number | null>(null);
  /*useEffect(() => {
    const stored = localStorage.getItem("selectedOdjel");
    if (stored) {
      setSelectedOdjel(parseInt(stored));
      setOdjelNaziv(odjeliNazivi[parseInt(stored)] || "");
    } else {
      navigate("/step1-odjeli");
    }
  }, [navigate]);*/
  useEffect(() => {
  const stored = localStorage.getItem("selectedOdjel");
  if (!stored) { navigate("/step1-odjeli"); return; }

  const odjelId = parseInt(stored);
  setSelectedOdjel(odjelId);

  //const apiUrl = import.meta.env.VITE_API_URL;
  fetch(`${apiUrl}/api/doktori?odjelId=${odjelId}`)
    .then(res => res.json())
    .then(data => {
      setDoktori(data);
      setOdjelNaziv(data[0]?.specijalizacija || "");
    })
    .catch(() => setDoktori([]));
}, [navigate]);

 // const doktori = selectedOdjel ? doktoriByOdjel[selectedOdjel] || [] : [];

  const filtrirani = doktori.filter(d =>
  `${d.ime} ${d.prezime}`.toLowerCase().includes(pretraga.toLowerCase()) ||
  (d.specijalizacija ?? "").toLowerCase().includes(pretraga.toLowerCase()) ||
  (d.uziInteres ?? "").toLowerCase().includes(pretraga.toLowerCase())
);


  const handleSelectDoktor = (doktorId: number) => {
    setSelectedDoktor(doktorId);
    localStorage.setItem("selectedDoktor", doktorId.toString());
    setTimeout(() => navigate("/step3-tip-pregleda"), 350);
  };

  return (
    <Layout step={2} totalSteps={5} breadcrumbs={["1. Odjeli", "2. Doktori", "3. Tip Pregleda", "4. Termini", "5. Potvrda"]}>
      <div className="max-w-6xl">
        <div className="mb-6">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-1">{odjelnaziv}</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Izaberite doktora</h1>
          <p className="text-gray-500 text-base">Odaberite doktora u koga imate povjerenje</p>
        </div>

        <div className="relative mb-6 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pretraži po imenu doktora..."
            value={pretraga}
            onChange={e => setPretraga(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 bg-gray-50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
         {filtrirani.map((doktor) => {
  const isSelected = selectedDoktor === doktor.id;
  const isHovered = hoveredDoktor === doktor.id;
  return (
    <div
      key={doktor.id}
      onMouseEnter={() => setHoveredDoktor(doktor.id)}
      onMouseLeave={() => setHoveredDoktor(null)}
      onClick={() => handleSelectDoktor(doktor.id)}
      className={`bg-white rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-300 ${
        isSelected ? "border-blue-500 shadow-lg shadow-blue-100" : isHovered ? "border-blue-300 shadow-md -translate-y-1" : "border-gray-200 shadow-sm"
      }`}
    >
      {/* Avatar umjesto slike */}
      <div className={`h-40 flex flex-col items-center justify-center gap-3 transition-colors duration-300 ${
        isSelected ? "bg-blue-600" : isHovered ? "bg-blue-500" : "bg-blue-50"
      }`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shadow-md transition-colors duration-300 ${
          isSelected || isHovered ? "bg-white text-blue-600" : "bg-blue-600 text-white"
        }`}>
          {doktor.ime[0]}{doktor.prezime[0]}
        </div>
        <div className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors duration-300 ${
          isSelected || isHovered ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
        }`}>
          {doktor.iskustvo} god. iskustva
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-base font-bold text-gray-900 mb-0.5">Dr. {doktor.ime} {doktor.prezime}</h3>
        <p className="text-xs font-semibold text-blue-600 mb-2">{doktor.specijalizacija}</p>
        <div className="flex items-center gap-1.5 mb-4">
          <Stethoscope size={12} className="text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">{doktor.uziInteres}</span>
        </div>
        <button
          type="button"
          className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-1.5 ${
            isSelected || isHovered ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          {isSelected ? "✓ Odabrano" : "Odaberi / Select"}
          {!isSelected && <ChevronRight size={15} />}
        </button>
      </div>
    </div>
  );
})}
        </div>

        {filtrirani.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Search size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg">Nema doktora za "{pretraga}"</p>
          </div>
        )}

        <div className="flex gap-4 justify-between">
          <button
            onClick={() => navigate("/step1-odjeli")}
            className="px-6 py-3 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            Nazad
          </button>
          <button
            disabled={!selectedDoktor}
            onClick={() => selectedDoktor && navigate("/step3-tip-pregleda")}
            className={`py-3 px-8 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
              selectedDoktor ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg" : "bg-gray-200 text-gray-400 cursor-not-allowed"
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

export default Step2Doktori;