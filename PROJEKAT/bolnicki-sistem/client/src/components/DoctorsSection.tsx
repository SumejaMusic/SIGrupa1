import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_URL;

interface Doktor {
  id: number;
  ime: string;
  prezime: string;
  specijalizacija: string;
  trajanjePregleda: number;
  email: string;
  brojTelefona: string | null;
  odjelId: number;
}

export default function DoctorsSection() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doktor[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${apiUrl}/api/doktori`)
      .then(res => res.json())
      .then(data => setDoctors(data))
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.offsetWidth;
    scrollRef.current.scrollBy({
      left: direction === "right" ? cardWidth : -cardWidth,
      behavior: "smooth",
    });
  };

 const handleZakaziTermin = (doc: Doktor) => {
    // 1. Provjera da li korisnik ima validan token
    const token = localStorage.getItem("token");

    if (!token) {
      // Ako nije prijavljen, šaljemo ga na prijavu
      // Opcionalno: možeš spasiti lokaciju na koju je htio ići da ga vratiš poslije login-a
      navigate("/prijava");
      return;
    }

    // 2. Ako je prijavljen, nastavljamo sa čuvanjem podataka i navigacijom
    localStorage.setItem("selectedDoktor", doc.id.toString());
    localStorage.setItem("selectedOdjel", doc.odjelId.toString());
    
    navigate("/step3-tip-pregleda");
  };

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white" id="doktori">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14">
          <div>
            <span className="inline-block text-blue-700 text-sm font-semibold tracking-widest uppercase mb-3">
              Naš tim
            </span>
            <h2 className="text-4xl font-bold text-gray-900">
              Upoznajte naše doktore
            </h2>
            <p className="text-gray-500 mt-2 max-w-md">
              Iskusni specijalisti sa višegodišnjom praksom, posvećeni Vašem zdravlju.
            </p>
          </div>

          {/* Strelice za scroll */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="p-2 rounded-full border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2 rounded-full border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Scroll kontejner — 4 kartice vidljive, ostale dostupne scrollom */}
        <div
          ref={scrollRef}
          className="grid grid-flow-col auto-cols-[calc(25%-12px)] gap-4 overflow-x-auto scroll-smooth pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
                <div className="h-56 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-8 bg-gray-200 rounded" />
                </div>
              </div>
            ))
          ) : doctors.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              Nema dostupnih doktora.
            </div>
          ) : (
            doctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
              >
                {/* Avatar iz inicijala */}
                <div className="relative h-56 overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-blue-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {doc.ime[0]}{doc.prezime[0]}
                  </div>
                </div>

                <div className="p-5">
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                    {doc.specijalizacija}
                  </span>
                  <h3 className="font-semibold text-gray-900 text-base mt-1 mb-4">
                    Dr. {doc.ime} {doc.prezime}
                  </h3>
                  <button
                    onClick={() => handleZakaziTermin(doc)}
                    className="w-full py-2 rounded-lg text-sm font-semibold transition-all duration-200 bg-blue-700 text-white hover:bg-blue-800 shadow-sm hover:shadow-md"
                  >
                    Zakaži termin
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}