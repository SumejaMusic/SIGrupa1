import { useState, useEffect } from 'react';
import { X, Search, User, ChevronDown, Clock, MapPin, Stethoscope, Calendar } from 'lucide-react';

interface Pacijent {
  id: number;
  brojKnjizice: string;
  korisnik: {
    id: number;
    ime: string;
    prezime: string;
    email: string;
    brojTelefona: string | null;
    datumRodjenja: string;
  };
}

interface Doktor {
  id: number;
  specijalizacija: string;
  korisnik: { id: number; ime: string; prezime: string; };
  odjel: { id: number; naziv: string; };
  soba?: { id: number; naziv: string; sprat: number; } | null;
}

interface SlobodanTermin {
  id: number;
  vrijeme: number; // minuti od ponoći
  datum: string;
}

interface Props {
  allPatients: Pacijent[];
  doctors: Doktor[];
  departments: { id: number; naziv: string; }[];
  rooms: { id: number; naziv: string; sprat: number; }[];
  onConfirm: (data: {
    pacijentId: number;   // idKorisnik
    doktorId: number;
    idTermina: number;
    datum: string;
    komentar: string;
  }) => void;
  onClose: () => void;
}

const VISIT_TYPES = [
  'Opšti pregled', 'Kontrolni pregled', 'Pregled srca', 'EKG',
  'Ehokardiografija', 'Neurološki pregled', 'CT skeniranje',
  'Ortopedski pregled', 'RTG snimak', 'Pedijatrijski pregled',
  'Internistički pregled', 'Laboratorijska analiza',
];

const fmtVrijeme = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export default function NewAppointmentModal({ allPatients, doctors, onConfirm, onClose }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Korak 1
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Pacijent | null>(null);

  // Korak 2
  const [selectedDoctor, setSelectedDoctor] = useState<Doktor | null>(null);
  const [date, setDate] = useState('');
  const [slobodniTermini, setSlobodniTermini] = useState<SlobodanTermin[]>([]);
  const [loadingTermini, setLoadingTermini] = useState(false);

  // Korak 3
  const [selectedTermin, setSelectedTermin] = useState<SlobodanTermin | null>(null);
  const [type, setType] = useState('');
  const [komentar, setKomentar] = useState('');

  const getToken = () => localStorage.getItem('token') ?? '';

  // Dohvati slobodne termine kad se promijeni doktor ili datum
  useEffect(() => {
    if (!selectedDoctor || !date) {
      setSlobodniTermini([]);
      setSelectedTermin(null);
      return;
    }
    setLoadingTermini(true);
    setSelectedTermin(null);
    fetch(`/api/osoblje/termini/slobodni/${selectedDoctor.id}?datum=${date}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
      .then(r => r.json())
      .then(data => setSlobodniTermini(Array.isArray(data) ? data : []))
      .catch(() => setSlobodniTermini([]))
      .finally(() => setLoadingTermini(false));
  }, [selectedDoctor, date]);

  const filteredPatients = allPatients.filter(p =>
    search.length >= 2 &&
    `${p.korisnik.ime} ${p.korisnik.prezime}`.toLowerCase().includes(search.toLowerCase())
  );

  const soba = selectedDoctor?.soba;

  const canStep2 = !!selectedPatient;
  const canStep3 = !!selectedDoctor && !!date && !!selectedTermin;
  const canSubmit = canStep3 && !!type;

  const handleSubmit = () => {
    if (!selectedPatient || !selectedDoctor || !selectedTermin || !type) return;
    onConfirm({
      pacijentId: selectedPatient.korisnik.id,
      doktorId:   selectedDoctor.id,
      idTermina:  selectedTermin.id,
      datum:      date,
      komentar:   komentar || type,
    });
  };

  const stepLabels = ['Pacijent', 'Doktor & Datum', 'Termin & Detalji'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Novi termin</h2>
            <p className="text-xs text-gray-500 mt-0.5">{stepLabels[step - 1]}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Step indikator */}
        <div className="px-6 pt-3 flex gap-1.5">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`}
            />
          ))}
        </div>

        {/* Sadržaj */}
        <div className="p-6 space-y-4 max-h-[62vh] overflow-y-auto">

          {/* ── KORAK 1: Pacijent ── */}
          {step === 1 && (
            <>
              <p className="text-sm font-medium text-gray-600">Pronađite pacijenta u bazi</p>

              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setSelectedPatient(null); }}
                  placeholder="Ime ili prezime pacijenta..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {filteredPatients.length > 0 && !selectedPatient && (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm max-h-52 overflow-y-auto">
                  {filteredPatients.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setSelectedPatient(p); setSearch(`${p.korisnik.ime} ${p.korisnik.prezime}`); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-100 last:border-0"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-700">
                        {p.korisnik.ime[0]}{p.korisnik.prezime[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{p.korisnik.ime} {p.korisnik.prezime}</p>
                        <p className="text-xs text-gray-500">
                          Knjižica: {p.brojKnjizice} · {p.korisnik.brojTelefona ?? 'Bez telefona'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {search.length >= 2 && filteredPatients.length === 0 && !selectedPatient && (
                <p className="text-sm text-gray-400 text-center py-4">Nema rezultata za "{search}"</p>
              )}

              {selectedPatient && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                    {selectedPatient.korisnik.ime[0]}{selectedPatient.korisnik.prezime[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{selectedPatient.korisnik.ime} {selectedPatient.korisnik.prezime}</p>
                    <p className="text-xs text-gray-500 truncate">Knjižica: {selectedPatient.brojKnjizice} · {selectedPatient.korisnik.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedPatient(null); setSearch(''); }}
                    className="text-xs text-blue-600 hover:underline flex-shrink-0"
                  >
                    Promijeni
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── KORAK 2: Doktor & Datum ── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Doktor */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Doktor</label>
                <div className="relative">
                  <select
                    value={selectedDoctor?.id ?? ''}
                    onChange={e => {
                      const doc = doctors.find(d => d.id === parseInt(e.target.value, 10)) ?? null;
                      setSelectedDoctor(doc);
                      setSlobodniTermini([]);
                      setSelectedTermin(null);
                    }}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Odaberite doktora</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.korisnik.ime} {d.korisnik.prezime} — {d.specijalizacija}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Info o doktoru — odjel i soba */}
              {selectedDoctor && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center gap-2">
                    <Stethoscope size={14} className="text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Odjel</p>
                      <p className="text-sm font-semibold text-gray-800">{selectedDoctor.odjel.naziv}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center gap-2">
                    <MapPin size={14} className="text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Soba</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {soba ? `${soba.naziv} (Sprat ${soba.sprat})` : 'Nije dodijeljena'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Datum */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block flex items-center gap-1">
                  <Calendar size={12} /> Datum pregleda
                </label>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => { setDate(e.target.value); setSelectedTermin(null); }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Slobodni termini */}
              {selectedDoctor && date && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block flex items-center gap-1">
                    <Clock size={12} /> Slobodni termini
                  </label>
                  {loadingTermini ? (
                    <div className="py-4 text-center text-sm text-gray-400">Učitavanje termina...</div>
                  ) : slobodniTermini.length === 0 ? (
                    <div className="py-4 text-center text-sm text-red-500 bg-red-50 rounded-xl border border-red-100">
                      Nema slobodnih termina za odabrani datum
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                      {slobodniTermini.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTermin(t)}
                          className={`py-2 rounded-xl text-sm font-semibold border transition-all ${
                            selectedTermin?.id === t.id
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          {fmtVrijeme(t.vrijeme)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── KORAK 3: Detalji ── */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Sažetak */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <User size={13} className="text-blue-500" />
                  <span className="text-xs text-gray-500">Pacijent:</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {selectedPatient?.korisnik.ime} {selectedPatient?.korisnik.prezime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Stethoscope size={13} className="text-blue-500" />
                  <span className="text-xs text-gray-500">Doktor:</span>
                  <span className="text-sm font-semibold text-gray-800">
                    Dr. {selectedDoctor?.korisnik.ime} {selectedDoctor?.korisnik.prezime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-blue-500" />
                  <span className="text-xs text-gray-500">Termin:</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {date} u {selectedTermin ? fmtVrijeme(selectedTermin.vrijeme) : '—'}
                  </span>
                </div>
                {soba && (
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-blue-500" />
                    <span className="text-xs text-gray-500">Soba:</span>
                    <span className="text-sm font-semibold text-gray-800">{soba.naziv} (Sprat {soba.sprat})</span>
                  </div>
                )}
              </div>

              {/* Vrsta pregleda */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Vrsta pregleda *</label>
                <div className="relative">
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Odaberite vrstu pregleda</option>
                    {VISIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Komentar */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Komentar / Razlog posjete</label>
                <textarea
                  value={komentar}
                  onChange={e => setKomentar(e.target.value)}
                  rows={3}
                  placeholder="Unesite razlog posjete ili napomenu..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(prev => (prev - 1) as 1 | 2 | 3)}
              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Nazad
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Odustani
          </button>
          <div className="flex-1" />

          {step === 1 && (
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canStep2}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Dalje →
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!canStep3}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Dalje →
            </button>
          )}
          {step === 3 && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Zakaži termin
            </button>
          )}
        </div>
      </div>
    </div>
  );
}