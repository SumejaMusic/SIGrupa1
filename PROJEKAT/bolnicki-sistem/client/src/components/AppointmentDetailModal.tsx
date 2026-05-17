import { X, User, Phone, Stethoscope, Building2, DoorOpen, Clock, FileText, AlertTriangle, Upload, Ban, Calendar, Lock } from 'lucide-react';

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
  } | null;

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

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onCancel: (apt: Appointment) => void;
  onUploadPdf: (apt: Appointment) => void;
  onMarkUrgent: (apt: Appointment) => void;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ZAKAZAN:  { label: 'Zakazano',  cls: 'bg-blue-100 text-blue-700' },
  POTVRDJEN: { label: 'Potvrđeno', cls: 'bg-indigo-100 text-indigo-700' },
  ZAVRSEN:  { label: 'Završeno',  cls: 'bg-emerald-100 text-emerald-700' },
  OTKAZAN:  { label: 'Otkazano',  cls: 'bg-gray-100 text-gray-500' },
};

const formatIntTime = (time: number): string => {
  const hours = Math.floor(time / 60);
  const minutes = time % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// Provjera da li je termin u prošlosti na osnovu datuma i vremena
const isTerminUProslosti = (apt: Appointment): boolean => {
  const terminDatum = new Date(apt.termin.datum);
  const hours = Math.floor(apt.termin.vrijeme / 60);
  const minutes = apt.termin.vrijeme % 60;
  terminDatum.setHours(hours, minutes, 0, 0);
  return terminDatum < new Date();
};

export default function AppointmentDetailModal({ appointment: apt, onClose, onCancel, onUploadPdf, onMarkUrgent }: Props) {
  let currentStatusKey = apt.termin.status;
  if (apt.zavrseno) currentStatusKey = 'ZAKAZAN';
  if (apt.datumOtkazivanja !== null) currentStatusKey = 'OTKAZAN';

  const statusInfo = STATUS_MAP[currentStatusKey] ?? STATUS_MAP.ZAKAZAN;

  const isPast = isTerminUProslosti(apt);
  const isOtkazan = apt.termin.status === 'OTKAZAN' || apt.datumOtkazivanja !== null;
  const isZavrsen = apt.zavrseno;

  // Otkazivanje i označavanje hitnim nisu dozvoljeni za prošle termine, završene ili otkazane
  const canCancel    = !isZavrsen && !isOtkazan && !isPast;
  const canMarkUrgent = !apt.hitnost && !isZavrsen && !isOtkazan && !isPast;

  // Upload nalaza je uvijek dozvoljen (i za prošle termine) osim za otkazane
  const canUpload = !isOtkazan;

  const formattedDate = apt.termin.datum.split('T')[0];
  const formattedDob = apt.pacijent.korisnik.datumRodjenja.split('T')[0];

  const nalaz = apt.historija?.nalaz;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 border-t-4 border-t-blue-600">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusInfo.cls}`}>{statusInfo.label}</span>
              {apt.hitnost && (
                <span className="flex items-center gap-1 text-red-600 text-xs font-semibold animate-pulse">
                  <AlertTriangle size={12} /> Hitno / Prioritet
                </span>
              )}
              {/* Oznaka za prošle termine koji nisu završeni/otkazani */}
              {isPast && !isZavrsen && !isOtkazan && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                  <Lock size={11} /> Prošli termin
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {apt.tipPregleda?.naziv ?? 'Opšti pregled'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{apt.doktor.odjel.naziv}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Upozorenje za prošle termine */}
          {isPast && !isZavrsen && !isOtkazan && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <Lock size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                Ovaj termin je u prošlosti. Otkazivanje i označavanje hitnim nisu dostupni — moguće je samo dodavanje medicinskog nalaza.
              </p>
            </div>
          )}

          {/* Patient info */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pacijent</h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow icon={<User size={14} />} label="Ime i prezime" value={`${apt.pacijent.korisnik.ime} ${apt.pacijent.korisnik.prezime}`} />
              <InfoRow icon={<Phone size={14} />} label="Telefon" value={apt.pacijent.korisnik.brojTelefona ?? 'Nije unesen'} />
              <InfoRow icon={<Calendar size={14} />} label="Datum rođenja" value={formattedDob} />
              <InfoRow icon={<FileText size={14} />} label="Broj zdravstvene knjižice" value={apt.pacijent.brojKnjizice} />
            </div>
          </section>

          <div className="border-t border-gray-100" />

          {/* Appointment info */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Termin</h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow icon={<Clock size={14} />} label="Datum i vrijeme" value={`${formattedDate} u ${formatIntTime(apt.termin.vrijeme)}`} />
              <InfoRow icon={<Stethoscope size={14} />} label="Doktor" value={`Dr. ${apt.doktor.korisnik.ime} ${apt.doktor.korisnik.prezime}`} />
              <InfoRow icon={<Building2 size={14} />} label="Odjel" value={apt.doktor.odjel.naziv} />
              <InfoRow icon={<DoorOpen size={14} />} label="Soba / Sprat" value={apt.soba ? `Soba ${apt.soba.naziv} (Sprat ${apt.soba.sprat})` : 'Nije dodijeljena'} />
            </div>
          </section>

          {/* Komentar / Opis termina */}
          {(apt.komentar || apt.termin.opis) && (
            <section className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Napomena / Razlog posjete</h3>
              <p className="text-sm text-gray-700">{apt.komentar ?? apt.termin.opis}</p>
            </section>
          )}

          {/* Lab results */}
          {nalaz && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Vezani medicinski nalaz</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                      {nalaz.naziv}
                    </p>
                    <p className="text-xs text-gray-500">
                      Učitan: {nalaz.vrijemeNalaza.split('T')[0]} {nalaz.opis ? `· ${nalaz.opis}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">Otvori</span>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          {/* Upload je uvijek dostupan (osim za otkazane) */}
          {canUpload && (
            <button
              onClick={() => onUploadPdf(apt)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors shadow-sm"
            >
              <Upload size={15} /> Dodaj nalaz
            </button>
          )}
          
          {/* Označi hitnim — samo za buduće/trenutne termine */}
          {canMarkUrgent && (
            <button
              onClick={() => onMarkUrgent(apt)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-orange-200 text-orange-600 rounded-xl text-sm font-medium hover:bg-orange-50 transition-colors shadow-sm"
            >
              <AlertTriangle size={15} /> Označi hitnim
            </button>
          )}

          {/* Info ako je prošli termin i nema dostupnih akcija osim uploada */}
          {isPast && !isZavrsen && !isOtkazan && !canMarkUrgent && canUpload && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Lock size={12} /> Otkazivanje i hitnost nisu dostupni
            </span>
          )}
          
          <div className="flex-1" />
          
          {/* Otkaži — samo za buduće/trenutne termine */}
          {canCancel && (
            <button
              onClick={() => onCancel(apt)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
            >
              <Ban size={15} /> Otkaži termin
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 truncate">{label}</p>
        <p className="text-sm font-medium text-gray-800 break-words">{value}</p>
      </div>
    </div>
  );
}