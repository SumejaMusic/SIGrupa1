import { useEffect, useState } from "react";

type Props = {
  onProduzeSesiju: () => void;
  onOtkazi: () => void;
};

const UKUPNO_SEKUNDI = 120;

export function AutoLogoutModal({ onProduzeSesiju, onOtkazi }: Props) {
  const [sekunde, setSekunde] = useState(UKUPNO_SEKUNDI);

  useEffect(() => {
    // Ovaj countdown je samo vizualan — stvarna odjava dolazi iz hooka
    // ako korisnik ne reaguje. Modal samo prikazuje preostalo vrijeme.
    const interval = setInterval(() => {
      setSekunde(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []); // Resetuje se svaki put kad se modal prikaže

  const minuti  = Math.floor(sekunde / 60);
  const sekunde2 = String(sekunde % 60).padStart(2, "0");
  const postotak = (sekunde / UKUPNO_SEKUNDI) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl mx-4">

        {/* Ikona upozorenja */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
          Upozorenje o neaktivnosti
        </h2>
        <p className="text-gray-600 mb-5 text-center">
          Biti ćete automatski odjavljeni za{" "}
          <span className="font-bold text-red-600">
            {minuti}:{sekunde2}
          </span>
        </p>

        {/* Progress bar koji se prazni */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6">
          <div
            className="bg-red-500 h-1.5 rounded-full transition-all duration-1000"
            style={{ width: `${postotak}%` }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onOtkazi}
            className="flex-1 py-3 rounded-xl border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Otkaži sesiju
          </button>
          <button
            onClick={onProduzeSesiju}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            Produži sesiju
          </button>
        </div>
      </div>
    </div>
  );
}