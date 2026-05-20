import { AlertTriangle, X } from 'lucide-react';

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
  onConfirm: () => void;
  onClose: () => void;
}

const formatIntTime = (time: number): string => {
  const hours = Math.floor(time / 60);
  const minutes = time % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export default function CancelModal({ appointment: apt, onConfirm, onClose }: Props) {
  const formattedDate = apt.termin.datum.split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Otkazivanje termina</h2>
              <p className="text-sm text-gray-500">Ova akcija je nepovratna. Pacijent će biti obaviješten emailom.</p>
            </div>
            <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="mt-5 bg-gray-50 rounded-xl p-4 space-y-2">
            <DetailRow label="Pacijent" value={`${apt.pacijent.korisnik.ime} ${apt.pacijent.korisnik.prezime}`} />
            <DetailRow label="Doktor" value={`Dr. ${apt.doktor.korisnik.ime} ${apt.doktor.korisnik.prezime}`} />
            <DetailRow label="Datum i vrijeme" value={`${formattedDate} u ${formatIntTime(apt.termin.vrijeme)}`} />
            <DetailRow label="Odjel" value={apt.doktor.odjel.naziv} />
            <DetailRow label="Vrsta pregleda" value={apt.tipPregleda?.naziv ?? 'Opšti pregled'} />
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-700">
              <span className="font-semibold">Napomena:</span> Sistem će automatski poslati email obavijest pacijentu na adresu{' '}
              <span className="font-medium">{apt.pacijent.korisnik.email}</span> sa informacijom da je termin otkazan.
            </p>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Zatvori
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
          >
            Da, otkaži termin
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}