import { useState, useMemo, useEffect } from 'react';
import {
  Calendar, List, Plus, Search, 
  Activity, Clock, AlertTriangle, CheckCircle, Filter, LayoutGrid
} from 'lucide-react';

import CalendarView from '../components/CalendarView';
import AppointmentDetailModal from '../components/AppointmentDetailModal';
import CancelModal from '../components/CancelModal';
import UploadPdfModal from '../components/UploadPdfModal';
import NewAppointmentModal from '../components/NewAppointmentModal';

type ViewMode = 'week' | 'day' | 'list';

// Svi statusi su sada 100% usklađeni sa funkcijom getUIStatus i tvojom bazom
type FilterStatus = 'all' | 'ZAKAZAN' | 'HITAN' | 'ZAVRSEN' | 'OTKAZAN';

const STATUS_LABEL: Record<FilterStatus, string> = {
  all: 'Svi termini',
  ZAKAZAN: 'Zakazani',
  HITAN: 'Hitni',
  ZAVRSEN: 'Završeni',
  OTKAZAN: 'Otkazani',
};

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

const getUIStatus = (apt: Appointment): FilterStatus => {
  if (apt.termin.status === 'OTKAZAN' || apt.datumOtkazivanja !== null) return 'OTKAZAN';
  if (apt.zavrseno) return 'ZAVRSEN';
  //if (apt.hitnost) return 'HITAN';
  return 'ZAKAZAN'; 
};

// Pomoćna funkcija koja pretvara Int vrijeme (npr. 900 ili 1430) u lijep format "09:00" ili "14:30"
// Zamijeni sa:
const formatIntTime = (time: number): string => {
  const hours = Math.floor(time / 60);
  const minutes = time % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export default function StaffPanel() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [uploadTarget, setUploadTarget] = useState<Appointment | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [allPatients, setAllPatients] = useState<Appointment['pacijent'][]>([]);
const [doctors, setDoctors] = useState<Appointment['doktor'][]>([]);
const [departments, setDepartments] = useState<Appointment['doktor']['odjel'][]>([]);
const [rooms, setRooms] = useState<Appointment['soba'][]>([]);
  const getToken = () => localStorage.getItem('token') ?? '';

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Učitavanje podataka s backenda
  useEffect(() => {
    async function fetchTermini() {
      try {
        const res = await fetch('/api/osoblje/termini/svi', {
  headers: { Authorization: `Bearer ${getToken()}` }
});
        if (!res.ok) throw new Error('Greška na serveru');
        const data = await res.json();
        setAppointments(data);
      } catch (err) {
        console.error(err);
        showNotif('Neuspješno učitavanje termina s backenda.');
      } finally {
        setLoading(false);
      }
    }
    fetchTermini();
  }, []);
useEffect(() => {
  const headers = { Authorization: `Bearer ${getToken()}` };

  Promise.all([
    fetch('/api/osoblje/pacijenti', { headers }).then(r => r.json()),
    fetch('/api/osoblje/doktori',   { headers }).then(r => r.json()),
    fetch('/api/osoblje/odjeli',    { headers }).then(r => r.json()),
    fetch('/api/osoblje/sobe',      { headers }).then(r => r.json()),
  ]).then(([pts, docs, depts, rms]) => {
    setAllPatients(pts);
    setDoctors(docs);
    setDepartments(depts);
    setRooms(rms);
  }).catch(() => showNotif('Greška pri učitavanju podataka za novi termin.'));
}, []);
 const filteredAppointments = useMemo(() => {
  return appointments.filter(a => {
    const matchStatus = filterStatus === 'all'
      || (filterStatus === 'HITAN' ? a.hitnost === true : getUIStatus(a) === filterStatus);
    
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || (
      `${a.pacijent.korisnik.ime} ${a.pacijent.korisnik.prezime}`.toLowerCase().includes(q) ||
      `${a.doktor.korisnik.ime} ${a.doktor.korisnik.prezime}`.toLowerCase().includes(q) ||
      (a.tipPregleda?.naziv && a.tipPregleda.naziv.toLowerCase().includes(q))
    );
    return matchStatus && matchSearch;
  });
}, [appointments, filterStatus, searchQuery]);

const stats = useMemo(() => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const todayApts = appointments.filter(a => {
    const aptDate = new Date(a.termin.datum);
    const aptStr = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}-${String(aptDate.getDate()).padStart(2, '0')}`;
    return aptStr === todayStr;
  });
  
  return {
    total: todayApts.length,
    scheduled: todayApts.filter(a => getUIStatus(a) === 'ZAKAZAN').length,
    urgent: todayApts.filter(a => a.hitnost === true).length,
    completed: todayApts.filter(a => getUIStatus(a) === 'ZAVRSEN').length,
  };
}, [appointments]);

  const handleCancel = (apt: Appointment) => {
    setSelectedApt(null);
    setCancelTarget(apt);
  };

  // ─── 2. confirmCancel — dodaj potvrda: true ───────────────────────────────────
const confirmCancel = async () => {
  if (!cancelTarget) return;
  try {
    const res = await fetch(`/api/osoblje/termini/${cancelTarget.id}/otkazi`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ potvrda: true })  // ← DODAJ OVO
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.poruka ?? 'Neuspješno otkazivanje');
    }
    setAppointments(prev => prev.map(a =>
      a.id === cancelTarget.id
        ? { ...a, datumOtkazivanja: new Date().toISOString(), termin: { ...a.termin, status: 'OTKAZAN' } }
        : a
    ));
    showNotif(`Termin otkazan. Email obavijest je poslana na ${cancelTarget.pacijent.korisnik.email}.`);
  } catch (err: any) {
    showNotif(err.message ?? 'Greška pri otkazivanju termina.');
  } finally {
    setCancelTarget(null);
  }
};

  const handleUploadPdf = (apt: Appointment) => {
    setSelectedApt(null);
    setUploadTarget(apt);
  };
const confirmUpload = async (naziv: string, base64: string, mimeType: string) => {
  if (!uploadTarget) return;

  // Treba idHistorije — ako historija ne postoji, ne možemo uploadati nalaz
  const idHistorije = uploadTarget.historija?.id;
  if (!idHistorije) {
    showNotif('Greška: Termin nema završenu historiju pregleda. Nalaz se može dodati tek nakon pregleda.');
    setUploadTarget(null);
    return;
  }

  try {
    const res = await fetch(`/api/osoblje/nalazi/${idHistorije}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ naziv, fajl: base64, mimeType })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.poruka ?? 'Greška pri uploadu');
    }
    const noviNalaz = await res.json();

    setAppointments(prev => prev.map(a =>
      a.id === uploadTarget.id
        ? { ...a, historija: a.historija ? { ...a.historija, nalaz: noviNalaz } : a.historija }
        : a
    ));
    showNotif(`Nalaz "${naziv}" uspješno dodan.`);
  } catch (err: any) {
    showNotif(err.message ?? 'Greška pri uploadu nalaza.');
  } finally {
    setUploadTarget(null);
  }
};

 // ─── 3. handleMarkUrgent — API poziv + optimistički update ────────────────────
const handleMarkUrgent = async (apt: Appointment) => {
  try {
    const res = await fetch(`/api/osoblje/termini/${apt.id}/hitnost`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ hitnost: true })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.poruka ?? 'Greška');
    }
    setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, hitnost: true } : a));
    showNotif('Termin označen kao hitan.');
  } catch (err: any) {
    showNotif(err.message ?? 'Greška pri označavanju kao hitan.');
  }
};

  const currentApt = selectedApt ? appointments.find(a => a.id === selectedApt.id) ?? selectedApt : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 text-sm text-gray-500">
        Učitavanje podataka iz baze...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top toolbar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-none">Panel medicinskog osoblja</h1>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200 mx-2" />

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pretraži pacijente, doktore..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>

          <div className="flex-1" />

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} /> Novi termin
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center gap-6">
          <StatChip icon={<Clock size={14} className="text-blue-600" />} label="Danas ukupno" value={stats.total} color="blue" />
          <StatChip icon={<Clock size={14} className="text-blue-600" />} label="Zakazani" value={stats.scheduled} color="blue" />
          <StatChip icon={<AlertTriangle size={14} className="text-red-500" />} label="Hitni" value={stats.urgent} color="red" />
          <StatChip icon={<CheckCircle size={14} className="text-emerald-500" />} label="Završeni" value={stats.completed} color="emerald" />

          <div className="flex-1" />

          {/* Filter by status */}
          <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl p-1">
            {(['all', 'ZAKAZAN', 'HITAN', 'ZAVRSEN', 'OTKAZAN'] as FilterStatus[]).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          {/* View switcher */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'week' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Sedmični prikaz"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'day' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Dnevni prikaz"
            >
              <Calendar size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Lista"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 w-full overflow-auto">
        {viewMode === 'list' ? (
          <ListView appointments={filteredAppointments} onAppointmentClick={setSelectedApt} />
        ) : (
          <div className="h-full overflow-hidden">
            <CalendarView
              appointments={filteredAppointments}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              onAppointmentClick={setSelectedApt}
              view={viewMode === 'week' ? 'week' : 'day'}
            />
          </div>
        )}
      </main>

      {/* Notification toast */}
      {notification && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-3 rounded-2xl shadow-2xl">
          {notification}
        </div>
      )}

      {/* Modals */}
      {currentApt && !cancelTarget && !uploadTarget && (
        <AppointmentDetailModal
          appointment={currentApt}
          onClose={() => setSelectedApt(null)}
          onCancel={handleCancel}
          onUploadPdf={handleUploadPdf}
          onMarkUrgent={handleMarkUrgent}
        />
      )}
      {cancelTarget && (
        <CancelModal
          appointment={cancelTarget}
          onConfirm={confirmCancel}
          onClose={() => setCancelTarget(null)}
        />
      )}
      {uploadTarget && (
        <UploadPdfModal
          appointment={uploadTarget}
          onConfirm={confirmUpload}
          onClose={() => setUploadTarget(null)}
        />
      )}
     {showNewModal && (
  <NewAppointmentModal
    allPatients={allPatients}
    doctors={doctors}
    departments={departments}
    rooms={rooms}
    onConfirm={async (data) => {
      try {
        const res = await fetch('/api/osoblje/termini', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify({
            idDoktor:      data.doktorId,
            idPacijent:    data.pacijentId,
            datum:         data.datum,
            vrijemeMinute: data.vrijeme,
            komentar:      data.komentar,
          })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.poruka ?? 'Greška');
        }
        const noviTermin = await res.json();
        setAppointments(prev => [...prev, noviTermin]);
        setShowNewModal(false);
        showNotif('Novi termin uspješno zakazan.');
      } catch (err: any) {
        showNotif(err.message ?? 'Greška pri zakazivanju termina.');
      }
    }}
    onClose={() => setShowNewModal(false)}
  />
)}
    </div>
  );
}

function StatChip({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-700',
    red: 'text-red-600',
    emerald: 'text-emerald-600',
  };
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs text-gray-500">{label}:</span>
      <span className={`text-sm font-bold ${colors[color] ?? 'text-gray-800'}`}>{value}</span>
    </div>
  );
}

function ListView({ appointments, onAppointmentClick }: { appointments: Appointment[]; onAppointmentClick: (a: Appointment) => void }) {
  // Ključevi su sada mapirani direktno na domaće nazive koje vraća getUIStatus
  const STATUS_STYLES: Record<FilterStatus, string> = {
    all: '',
    ZAKAZAN: 'bg-blue-100 text-blue-700',
    HITAN: 'bg-red-100 text-red-700',
    ZAVRSEN: 'bg-emerald-100 text-emerald-700',
    OTKAZAN: 'bg-gray-100 text-gray-500',
  };

  const STATUS_LABELS: Record<FilterStatus, string> = {
    all: '',
    ZAKAZAN: 'Zakazan',
    HITAN: 'Hitno',
    ZAVRSEN: 'Završeno',
    OTKAZAN: 'Otkazano',
  };

  const sorted = [...appointments].sort((a, b) => {
    if (a.termin.datum !== b.termin.datum) return a.termin.datum.localeCompare(b.termin.datum);
    return a.termin.vrijeme - b.termin.vrijeme; // Ispravljeno sortiranje numeričkog vremena
  });

  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_1fr_120px_80px_100px_80px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span>Pacijent</span>
          <span>Doktor</span>
          <span>Odjel / Soba</span>
          <span>Datum</span>
          <span>Vrijeme</span>
          <span>Vrsta</span>
          <span>Status</span>
        </div>
        {sorted.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <Filter size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nema termina za odabrane filtere</p>
          </div>
        )}
        {sorted.map((apt, i) => {
          const uiStatus = getUIStatus(apt);
          const formattedDate = apt.termin.datum.split('T')[0]; // Čišćenje ISO stringa za ljepši prikaz

          return (
            <div
              key={apt.id}
              onClick={() => onAppointmentClick(apt)}
              className={`grid grid-cols-[1fr_1fr_1fr_120px_80px_100px_80px] gap-4 px-5 py-4 cursor-pointer hover:bg-blue-50/60 transition-colors border-b border-gray-100 last:border-0 ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-700">
                  {apt.pacijent.korisnik.ime[0]}{apt.pacijent.korisnik.prezime[0]}
                </div>
                <span className="text-sm font-medium text-gray-800 truncate">
                  {apt.pacijent.korisnik.ime} {apt.pacijent.korisnik.prezime}
                </span>
              </div>
              
              <span className="text-sm text-gray-600 self-center truncate">
                Dr. {apt.doktor.korisnik.ime} {apt.doktor.korisnik.prezime}
              </span>
              
              <div className="self-center min-w-0">
                <p className="text-sm text-gray-700 truncate">{apt.doktor.odjel.naziv}</p>
                <p className="text-xs text-gray-400">Soba {apt.soba?.naziv ?? 'N/A'}</p>
              </div>
              
              <span className="text-sm text-gray-600 self-center">{formattedDate}</span>
              
              <span className="text-sm font-medium text-gray-800 self-center">
                {formatIntTime(apt.termin.vrijeme)}
              </span>
              
              <span className="text-xs text-gray-500 self-center truncate">
                {apt.tipPregleda?.naziv ?? 'Opšti pregled'}
              </span>
              
              <div className="self-center flex flex-col gap-1">
  <span className={`px-2 py-1 rounded-lg text-xs font-semibold text-center ${STATUS_STYLES[uiStatus]}`}>
    {STATUS_LABELS[uiStatus]}
  </span>
  {apt.hitnost && (
    <span className="px-2 py-1 rounded-lg text-xs font-semibold text-center bg-red-100 text-red-700">
      Hitno
    </span>
  )}
</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}