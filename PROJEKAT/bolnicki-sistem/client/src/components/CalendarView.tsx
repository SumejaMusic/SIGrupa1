import React from 'react';
import { ChevronLeft, ChevronRight, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

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
    vrijeme: number; // npr. 510 = 08:30 (8 * 60 + 30)
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
    soba?: {
      id: number;
      naziv: string;
      sprat: number;
    };
  };
}

interface Props {
  appointments: Appointment[];
  currentDate: Date;
  onDateChange: (d: Date) => void;
  onAppointmentClick: (a: Appointment) => void;
  view: 'week' | 'day';
}

type UIStatus = 'ZAKAZAN' | 'HITAN' | 'ZAVRSEN' | 'OTKAZAN';

const getUIStatus = (apt: Appointment): UIStatus => {
  if (apt.termin.status === 'OTKAZAN' || apt.datumOtkazivanja !== null) return 'OTKAZAN';
  if (apt.zavrseno) return 'ZAVRSEN';
  if (apt.hitnost || apt.tipPregleda?.naziv === 'Hitni pregled') return 'HITAN'; // ← dodano tipPregleda provjera
  return 'ZAKAZAN';
};

const STATUS_STYLES: Record<UIStatus, string> = {
  ZAKAZAN: 'bg-blue-50 border-blue-300 hover:bg-blue-100',
  HITAN: 'bg-red-50 border-red-400 hover:bg-red-100',
  ZAVRSEN: 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100',
  OTKAZAN: 'bg-gray-50 border-gray-300 hover:bg-gray-100 opacity-60',
};

const STATUS_BADGE: Record<UIStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  ZAKAZAN: { label: 'Zakazano', cls: 'bg-blue-100 text-blue-700', icon: <Clock size={10} /> },
  HITAN: { label: 'Hitno', cls: 'bg-red-100 text-red-700', icon: <AlertTriangle size={10} /> },
  ZAVRSEN: { label: 'Završeno', cls: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle size={10} /> },
  OTKAZAN: { label: 'Otkazano', cls: 'bg-gray-100 text-gray-500', icon: <XCircle size={10} /> },
};

const formatIntTime = (vrijeme: number): string => {
  const hours = Math.floor(vrijeme / 60);
  const minutes = vrijeme % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const getHourFromInt = (vrijeme: number): number => {
  return Math.floor(vrijeme / 60);
};

const HOURS = Array.from({ length: 11 }, (_, i) => i + 7); // 07:00 – 17:00

// ✅ SIGURAN STRUKTURNI FORMAT: Pretvara UTC Date u čist "YYYY-MM-DD" bez uticaja lokalne vremenske zone
const fmtUTC = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

// ✅ Vraća današnji dan resetovan na čistu UTC ponoć
const getUTCToday = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
};

const DAYS_BS = ['Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub'];
const MONTHS_BS = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
];

// ✅ POPRAVLJENO: Kreira niz dana isključivo u UTC okviru
function getWeekDays(date: Date): Date[] {
  const day = date.getUTCDay();
  const diffToMonday = (day === 0 ? 7 : day) - 1;
  
  const monday = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() - diffToMonday,
    0, 0, 0, 0
  ));

  return Array.from({ length: 7 }, (_, i) => {
    return new Date(Date.UTC(
      monday.getUTCFullYear(),
      monday.getUTCMonth(),
      monday.getUTCDate() + i,
      0, 0, 0, 0
    ));
  });
}

export default function CalendarView({ appointments, currentDate, onDateChange, onAppointmentClick, view }: Props) {
  const weekDays = getWeekDays(currentDate);

  const navigate = (dir: number) => {
    const d = new Date(Date.UTC(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth(),
      currentDate.getUTCDate() + (view === 'week' ? dir * 7 : dir),
      0, 0, 0, 0
    ));
    onDateChange(d);
  };

  const goToday = () => {
    onDateChange(getUTCToday());
  };

  const displayDays = view === 'week' ? weekDays : [currentDate];

  // ✅ POPRAVLJENO: Poredi čisti YYYY-MM-DD iz baze sa fmtUTC stringom kolone
  const getAptsForSlot = (date: Date, hour: number) =>
    appointments.filter(a => {
      const aptDateStr = a.termin.datum.substring(0, 10); 
      const dateStr = fmtUTC(date);
      const aptHour = getHourFromInt(a.termin.vrijeme);
      return aptDateStr === dateStr && aptHour === hour;
    });

  const title = view === 'week'
    ? `${weekDays[0].getUTCDate()} – ${weekDays[6].getUTCDate()} ${MONTHS_BS[currentDate.getUTCMonth()]} ${currentDate.getUTCFullYear()}`
    : `${currentDate.getUTCDate()} ${MONTHS_BS[currentDate.getUTCMonth()]} ${currentDate.getUTCFullYear()}`;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={goToday} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Danas
          </button>
          <button onClick={() => navigate(1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />Zakazano</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />Hitno</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />Završeno</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />Otkazano</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[700px]">
          {/* Header row */}
          <div className={`grid sticky top-0 z-10 bg-white border-b border-gray-200 ${view === 'week' ? 'grid-cols-[64px_repeat(7,1fr)]' : 'grid-cols-[64px_1fr]'}`}>
            <div className="h-12" />
            {displayDays.map((d, i) => {
              // ✅ POPRAVLJENO: Poredi isključivo UTC stringove da odredi današnji dan
              const isToday = fmtUTC(d) === fmtUTC(getUTCToday());
              return (
                <div
                  key={i}
                  onClick={() => onDateChange(d)}
                  className={`h-12 flex flex-col items-center justify-center border-l border-gray-100 cursor-pointer transition-colors ${isToday ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <span className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>{DAYS_BS[d.getUTCDay()]}</span>
                  <span className={`text-sm font-bold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-800'}`}>{d.getUTCDate()}</span>
                </div>
              );
            })}
          </div>

          {/* Time slots */}
          {HOURS.map(hour => (
            <div key={hour} className={`grid ${view === 'week' ? 'grid-cols-[64px_repeat(7,1fr)]' : 'grid-cols-[64px_1fr]'} min-h-[80px]`}>
              <div className="flex items-start justify-end pr-3 pt-2">
                <span className="text-xs text-gray-400 font-medium">{String(hour).padStart(2, '0')}:00</span>
              </div>
              {displayDays.map((d, i) => {
                const isToday = fmtUTC(d) === fmtUTC(getUTCToday());
                const slots = getAptsForSlot(d, hour);
                return (
                  <div key={i} className={`border-l border-t border-gray-100 p-1 min-h-[80px] ${isToday ? 'bg-blue-50/30' : ''}`}>
                    {slots.map(apt => {
                      const uiStatus = getUIStatus(apt);
                      const style = STATUS_STYLES[uiStatus];
                      const badge = STATUS_BADGE[uiStatus];
                      return (
                        <div
                          key={apt.id}
                          onClick={() => onAppointmentClick(apt)}
                          className={`rounded-md border-l-4 border px-2 py-1.5 mb-1 cursor-pointer transition-all shadow-sm ${style}`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-xs font-bold text-gray-800 truncate">
                              {formatIntTime(apt.termin.vrijeme)}
                            </span>
                            <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${badge.cls}`}>
                              {badge.icon} {badge.label}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-gray-800 truncate">
                            {apt.pacijent.korisnik.ime} {apt.pacijent.korisnik.prezime}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">
                            Dr. {apt.doktor.korisnik.prezime}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {apt.doktor.odjel.naziv} · Soba {apt.soba?.naziv ?? apt.doktor.soba?.naziv ?? 'N/A'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}