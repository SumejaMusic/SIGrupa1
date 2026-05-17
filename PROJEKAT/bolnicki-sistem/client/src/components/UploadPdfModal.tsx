import { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
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


interface Props {
  appointment: Appointment;
  onConfirm: (fileName: string, base64: string, mimeType: string) => void;
  onClose: () => void;
}

export default function UploadPdfModal({ appointment: apt, onConfirm, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | undefined) => {
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError('Dozvoljeni su samo PDF fajlovi.');
      setFile(null);
      return;
    }
    setError('');
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = () => {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const base64 = (reader.result as string).split(',')[1];
    onConfirm(file.name, base64, file.type);
  };
  reader.readAsDataURL(file);
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Dodaj laboratorijski nalaz</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {apt.pacijent.korisnik.ime} {apt.pacijent.korisnik.prezime} · {apt.termin.datum}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
              dragging ? 'border-blue-400 bg-blue-50' : file ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {file ? (
              <>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle size={24} className="text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setFile(null); }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Ukloni fajl
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Upload size={24} className="text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Prevucite PDF ovdje ili kliknite za odabir</p>
                  <p className="text-xs text-gray-400 mt-1">Isključivo PDF fajlovi · Trajno pohranjivanje</p>
                </div>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={e => handleFile(e.target.files?.[0])}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <FileText size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Uploadovani nalazi bit će trajno sačuvani i dostupni doktoru i pacijentu za sve buduće preglede.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Odustani
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Sačuvaj nalaz
          </button>
        </div>
      </div>
    </div>
  );
}
