import { Star, ArrowRight } from 'lucide-react';

const doctors = [
  {
    name: 'Dr. Amira Hadžić',
    specialty: 'Kardiologija',
    experience: '14 godina iskustva',
    rating: 4.9,
    reviews: 312,
    image: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    available: true,
  },
  {
    name: 'Dr. Mirko Stojanović',
    specialty: 'Neurologija',
    experience: '20 godina iskustva',
    rating: 4.8,
    reviews: 278,
    image: 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    available: true,
  },
  {
    name: 'Dr. Selma Kovač',
    specialty: 'Pedijatrija',
    experience: '11 godina iskustva',
    rating: 4.9,
    reviews: 429,
    image: 'https://images.pexels.com/photos/5452274/pexels-photo-5452274.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    available: false,
  },
  {
    name: 'Dr. Emir Bašić',
    specialty: 'Ortopedija',
    experience: '17 godina iskustva',
    rating: 4.7,
    reviews: 195,
    image: 'https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    available: true,
  },
];

export default function DoctorsSection() {
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
          <button className="inline-flex items-center gap-2 text-blue-700 font-semibold hover:gap-3 transition-all duration-200 group whitespace-nowrap">
            Svi doktori
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {doctors.map((doc, idx) => (
            <div key={idx} className="doctor-card bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              {/* Photo */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={doc.image}
                  alt={doc.name}
                  className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
                />
                {/* Availability badge */}
                <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  doc.available
                    ? 'bg-green-500/90 text-white'
                    : 'bg-gray-400/80 text-white'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${doc.available ? 'bg-white animate-pulse' : 'bg-white/60'}`} />
                  {doc.available ? 'Dostupan' : 'Zauzet'}
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">{doc.specialty}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-semibold text-gray-700">{doc.rating}</span>
                    <span className="text-xs text-gray-400">({doc.reviews})</span>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 text-base mb-1">{doc.name}</h3>
                <p className="text-xs text-gray-400 mb-4">{doc.experience}</p>
                <button
                  className={`w-full py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    doc.available
                      ? 'bg-blue-700 text-white hover:bg-blue-800 shadow-sm hover:shadow-md'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!doc.available}
                >
                  {doc.available ? 'Zakaži termin' : 'Nije dostupan'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
