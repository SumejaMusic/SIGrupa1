import { useState } from 'react';
import { X, Search, User, ChevronDown } from 'lucide-react';

// Ponovo definisan osnovni Appointment tip radi reference i Omit-a
interface Appointment {
  id: number;                 
  doktorRezervisao: boolean;
  komentar: string | null;
  hitnost: boolean;           
  datumKreiranja: string;
  datumOtkazivanja: string | null;
  doktorOtkazao: boolean;
  zavrseno: boolean;          

  termin: {
    id: number;
    datum: string;            
    vrijeme: number;          
    status: 'SLOBODAN' | 'ZAKAZAN' | 'POTVRDJEN' | 'OTKAZAN';
    opis: string | null;
  };

  tipPregleda: {
    id: number;
    naziv: string;            
    trajanjeMinuta: number;
  } | null;

  soba: {
    id: number;
    naziv: string;            
    sprat: number;
  };

  pacijent: {
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
  };

  doktor: {
    id: number;
    specijalizacija: string;
    korisnik: {
      id: number;
      ime: string;
      prezime: string;
    };
    odjel: {
      id: number;
      naziv: string;          
    };
  };

  historija?: {
    id: number;
    dijagnoza: string;
    terapija: string;
    nalaz?: {
      id: number;
      naziv: string;          
      vrijemeNalaza: string;
      opis: string | null;
    } | null;
  } | null;
}

// Props su prošireni listama iz baze koje StaffPanel treba da dobavi i proslijedi modalu
interface Props {
  allPatients: Appointment['pacijent'][];
  doctors: Appointment['doktor'][];
  departments: Appointment['doktor']['odjel'][];
  rooms: Appointment['soba'][];
  onConfirm: (data: {
    pacijentId: number;
    doktorId: number;
    sobaId: number;
    datum: string;
    vrijeme: number; // Šaljemo Int bazi podataka (npr. 1430)
    komentar: string;
    tipPregledaNaziv: string;
  }) => void;
  onClose: () => void;
}

const VISIT_TYPES = [
  'Pregled srca', 'EKG', 'Ehokardiografija',
  'Neurološki pregled', 'CT skeniranje',
  'Ortopedski pregled', 'RTG snimak',
  'Pedijatrijski pregled', 'Internistički pregled',
  'Laboratorijska analiza', 'Kontrolni pregled',
];

// Pomoćna funkcija koja pretvara "14:30" string u Int 1430 za bazu
const parseTimeStringToInt = (timeStr: string): number => {
  const parts = timeStr.split(':');
  if (parts.length < 2) return 0;
  return parseInt(`${parts[0]}${parts[1]}`, 10);
};

export default function NewAppointmentModal({ allPatients, doctors, departments, rooms, onConfirm, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Appointment['pacijent'] | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Appointment['doktor'] | null>(null);
  const [selectedDept, setSelectedDept] = useState<Appointment['doktor']['odjel'] | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Appointment['soba'] | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState('');
  const [reason, setReason] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  const filteredPatients = allPatients.filter(p =>
    search.length >= 2 &&
    `${p.korisnik.ime} ${p.korisnik.prezime}`.toLowerCase().includes(search.toLowerCase())
  );

  // Ako tvoja soba u bazi nema eksplicitan departmentId (već su sobe opšte ili vezane preko doktora),
  // ovdje filtriramo samo sobe koje u svom nazivu ili spratu imaju logike, ili prikazujemo sve.
  // Pod pretpostavkom da želiš filtrirati sobe (ili ako u bazi nema departmentId), ostavljamo sve sobe dostupnim:
  const availableRooms = rooms;

  const canProceed = selectedPatient !== null;
  const canSubmit = selectedDoctor && selectedDept && selectedRoom && date && time && type && reason;

  const handleSubmit = () => {
    if (!selectedPatient || !selectedDoctor || !selectedDept || !selectedRoom || !date || !time || !type || !reason) return;
    
    onConfirm({
      pacijentId: selectedPatient.id,
      doktorId: selectedDoctor.id,
      sobaId: selectedRoom.id,
      datum: new Date(date).toISOString(), // Slanje u ISO formatu pogodnom za Prisma DateTime
      vrijeme: parseTimeStringToInt(time), // Pretvara npr. "09:30" -> 930
      tipPregledaNaziv: type,
      komentar: reason
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Novi termin</h2>
            <p className="text-sm text-gray-500 mt-0.5">Korak {step} od 2</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 flex gap-2">
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <>
              <p className="text-sm font-medium text-gray-700">Pronađite pacijenta u bazi</p>
              
              {/* Patient search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setSelectedPatient(null); }}
                  placeholder="Unesite ime pacijenta..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Results */}
              {filteredPatients.length > 0 && !selectedPatient && (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm max-h-48 overflow-y-auto">
                  {filteredPatients.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setSelectedPatient(p); setSearch(`${p.korisnik.ime} ${p.korisnik.prezime}`); }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-100 last:border-0"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={15} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.korisnik.ime} {p.korisnik.prezime}</p>
                        <p className="text-xs text-gray-500">Knjžica: {p.brojKnjizice} · Tel: {p.korisnik.brojTelefona ?? 'Nema'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {search.length >= 2 && filteredPatients.length === 0 && !selectedPatient && (
                <p className="text-sm text-gray-500 text-center py-3">Nema rezultata za "{search}"</p>
              )}

              {selectedPatient && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{selectedPatient.korisnik.ime} {selectedPatient.korisnik.prezime}</p>
                    <p className="text-xs text-gray-600">Knjižica: {selectedPatient.brojKnjizice} · Email: {selectedPatient.korisnik.email}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {/* Doctor */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Doktor</label>
                <div className="relative">
                  <select
                    value={selectedDoctor?.id ?? ''}
                    onChange={e => {
                      const doc = doctors.find(d => d.id === parseInt(e.target.value, 10)) ?? null;
                      setSelectedDoctor(doc);
                      if (doc) setSelectedDept(doc.odjel); // Automatski postavi odjel na osnovu izabranog doktora
                    }}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Odaberite doktora</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.korisnik.ime} {d.korisnik.prezime} — {d.specijalizacija}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Odjel</label>
                <div className="relative">
                  <select
                    value={selectedDept?.id ?? ''}
                    onChange={e => setSelectedDept(departments.find(d => d.id === parseInt(e.target.value, 10)) ?? null)}
                    disabled // Onemogućeno jer se odjel automatski povlači iz odabranog doktora
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none bg-gray-100 text-gray-600"
                  >
                    <option value="">Odaberite odjel</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.naziv}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Room */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Soba</label>
                <div className="relative">
                  <select
                    value={selectedRoom?.id ?? ''}
                    onChange={e => setSelectedRoom(availableRooms.find(r => r.id === parseInt(e.target.value, 10)) ?? null)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Odaberite sobu</option>
                    {availableRooms.map(r => (
                      <option key={r.id} value={r.id}>Soba {r.naziv} (Sprat {r.sprat})</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Datum</label>
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Vrijeme</label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Visit type */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Vrsta pregleda</label>
                <div className="relative">
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Odaberite vrstu</option>
                    {VISIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Razlog posjete / Komentar</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={2}
                  placeholder="Unesite razlog posjete..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
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
          {step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canProceed}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Dalje
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Zakaži termin
            </button>
          )}
        </div>
      </div>
    </div>
  );
}