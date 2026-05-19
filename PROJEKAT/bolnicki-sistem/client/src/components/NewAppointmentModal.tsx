import { useState, useEffect, useRef } from 'react';
// Dodajte Upload, FileText, CheckCircle u lucide import
import {
  X, Search, User, Clock, MapPin, Upload, FileText, CheckCircle as CheckCircleIcon,
  Stethoscope, Calendar, AlertCircle, CheckCircle2,
  Building2, ChevronRight, Layers, 
} from 'lucide-react';

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
  vrijeme: number;
  datum: string;
}

interface TipPregleda {
  id: number;
  naziv: string;
  cijena?: number;
}

interface Props {
  allPatients: Pacijent[];
  doctors: Doktor[];
  departments: { id: number; naziv: string; }[];
  rooms: { id: number; naziv: string; sprat: number; }[];
  tipoviPregleda: TipPregleda[];
  onConfirm: (data: {
  pacijentId: number;
  doktorId: number;
  idTermina: number;
  datum: string;
  komentar: string;
  tipPregledaId: number;
  hitnost: boolean;
  nalaz?: { naziv: string; base64: string; mimeType: string; } | null;
}) => void;
  onClose: () => void;
}

const fmtVrijeme = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const AVATAR_COLORS = [
  ['#dbeafe', '#1d4ed8'],
  ['#dcfce7', '#15803d'],
  ['#fce7f3', '#be185d'],
  ['#ede9fe', '#7c3aed'],
  ['#ffedd5', '#c2410c'],
  ['#cffafe', '#0e7490'],
];

const getAvatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

export default function NewAppointmentModal({
  allPatients, doctors, departments, tipoviPregleda, onConfirm, onClose
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Korak 1 — Pacijent
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Pacijent | null>(null);

  // Korak 2 — Odjel → Doktor → Datum → Termin
  const [selectedOdjelId, setSelectedOdjelId] = useState<number | ''>('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doktor | null>(null);
  const [date, setDate] = useState('');
  const [slobodniDatumi, setSlobodniDatumi] = useState<string[]>([]); // dostupni datumi za doktora
  const [loadingDatumi, setLoadingDatumi] = useState(false);
  const [slobodniTermini, setSlobodniTermini] = useState<SlobodanTermin[]>([]);
  const [loadingTermini, setLoadingTermini] = useState(false);
  const [selectedTermin, setSelectedTermin] = useState<SlobodanTermin | null>(null);

  // Korak 3 — Tip pregleda, hitnost, komentar
  const [selectedTipPregledaId, setSelectedTipPregledaId] = useState<number | ''>('');
  const [hitnost, setHitnost] = useState(false);
  const [komentar, setKomentar] = useState('');

  const getToken = () => localStorage.getItem('token') ?? '';
  // U komponenti, pored ostalih state varijabli u Koraku 3 dodajte:
const [nalazFile, setNalazFile]   = useState<File | null>(null);
const [nalazNaziv, setNalazNaziv] = useState('');
const [nalazError, setNalazError] = useState('');
const nalazInputRef = useRef<HTMLInputElement>(null);

// Korak 4 — Nalaz (opcionalan)


const handleNalazFile = (f: File | undefined) => {
  if (!f) return;
  if (f.type !== 'application/pdf') {
    setNalazError('Dozvoljeni su samo PDF fajlovi.');
    setNalazFile(null);
    return;
  }
  setNalazError('');
  setNalazFile(f);
  if (!nalazNaziv.trim()) setNalazNaziv(f.name.replace('.pdf', ''));
};
  const odjeliFiltered = departments.filter(dep =>
    doctors.some(d => d.odjel.id === dep.id)
  );

  const doctorsInOdjel = selectedOdjelId
    ? doctors.filter(d => d.odjel.id === selectedOdjelId)
    : [];

  // Kad se odabere doktor — učitaj slobodne datume (narednih 60 dana)
  useEffect(() => {
    if (!selectedDoctor) {
      setSlobodniDatumi([]);
      setDate('');
      setSlobodniTermini([]);
      setSelectedTermin(null);
      return;
    }
    setLoadingDatumi(true);
    setDate('');
    setSlobodniTermini([]);
    setSelectedTermin(null);
    // API vraća niz ISO datuma koji imaju barem jedan slobodan termin
    // npr. ["2025-06-02","2025-06-04",...]
    fetch(`/api/osoblje/termini/slobodni-datumi/${selectedDoctor.id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
      .then(r => r.json())
      .then(d => setSlobodniDatumi(Array.isArray(d) ? d : []))
      .catch(() => setSlobodniDatumi([]))
      .finally(() => setLoadingDatumi(false));
  }, [selectedDoctor]);

  // Kad se odabere datum — učitaj slobodne termine za taj dan
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
      .then(d => setSlobodniTermini(Array.isArray(d) ? d : []))
      .catch(() => setSlobodniTermini([]))
      .finally(() => setLoadingTermini(false));
  }, [selectedDoctor, date]);

  useEffect(() => {
    const tip = tipoviPregleda.find(t => t.id === selectedTipPregledaId);
    if (tip?.naziv === 'Hitni pregled') setHitnost(true);
  }, [selectedTipPregledaId, tipoviPregleda]);

  const filteredPatients = allPatients.filter(p =>
    search.length >= 2 &&
    `${p.korisnik.ime} ${p.korisnik.prezime}`.toLowerCase().includes(search.toLowerCase())
  );

  const canStep2 = !!selectedPatient;
  const canStep3 = !!selectedDoctor && !!date && !!selectedTermin;
  const canSubmit = canStep3 && selectedTipPregledaId !== '';

  // Zamijenite handleSubmit:
const handleSubmit = () => {
  if (!selectedPatient || !selectedDoctor || !selectedTermin || selectedTipPregledaId === '') return;
  const tip = tipoviPregleda.find(t => t.id === selectedTipPregledaId);

  const podaci = {
    pacijentId:    selectedPatient.korisnik.id,
    doktorId:      selectedDoctor.id,
    idTermina:     selectedTermin.id,
    datum:         date,
    tipPregledaId: selectedTipPregledaId,
    hitnost:       tip?.naziv === 'Hitni pregled' ? true : hitnost,
    komentar:      komentar || tip?.naziv || '',
  };

  if (nalazFile && nalazNaziv.trim()) {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      onConfirm({ ...podaci, nalaz: { naziv: nalazNaziv.trim(), base64, mimeType: 'application/pdf' } });
    };
    reader.readAsDataURL(nalazFile);
  } else {
    onConfirm({ ...podaci, nalaz: null });
  }
};

  const stepInfo = [
    { label: 'Pacijent', icon: User },
    { label: 'Doktor & Termin', icon: Stethoscope },
    { label: 'Detalji', icon: Layers },
    { label: 'Nalaz',          icon: FileText },  // ← NOVO
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        .appt-modal * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
        .appt-modal .mono { font-family: 'DM Mono', monospace; }

        .appt-modal .step-pill {
          display: flex; align-items: center; gap: 6px;
          padding: 5px 12px 5px 8px;
          border-radius: 999px;
          font-size: 12px; font-weight: 600;
          border: 1.5px solid transparent;
          transition: all .2s;
        }
        .appt-modal .step-pill.done { background:#f0fdf4; border-color:#bbf7d0; color:#15803d; }
        .appt-modal .step-pill.active { background:#eff6ff; border-color:#93c5fd; color:#1d4ed8; }
        .appt-modal .step-pill.idle { background:#f9fafb; border-color:#e5e7eb; color:#9ca3af; }
        .appt-modal .step-pill .dot {
          width:20px; height:20px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:10px; font-weight:700; flex-shrink:0;
        }
        .appt-modal .step-pill.done .dot { background:#16a34a; color:#fff; }
        .appt-modal .step-pill.active .dot { background:#2563eb; color:#fff; }
        .appt-modal .step-pill.idle .dot { background:#e5e7eb; color:#9ca3af; }

        .appt-modal .field-label {
          display:block; font-size:11px; font-weight:700;
          text-transform:uppercase; letter-spacing:.05em;
          color:#6b7280; margin-bottom:6px;
        }

        .appt-modal .styled-input {
          width:100%; padding:10px 14px;
          border:1.5px solid #e5e7eb; border-radius:12px;
          font-size:14px; color:#111827; background:#fff;
          outline:none; transition:border-color .15s, box-shadow .15s;
        }
        .appt-modal .styled-input:focus {
          border-color:#2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,.1);
        }

        /* Doctor cards */
        .appt-modal .doc-card {
          display:flex; align-items:center; gap:12px;
          padding:12px 14px; border-radius:14px;
          border:1.5px solid #e5e7eb; cursor:pointer;
          transition:all .15s; background:#fff;
          position:relative;
        }
        .appt-modal .doc-card:hover { border-color:#93c5fd; background:#f8fbff; transform:translateY(-1px); box-shadow:0 4px 12px rgba(37,99,235,.08); }
        .appt-modal .doc-card.selected { border-color:#2563eb; background:#eff6ff; box-shadow:0 0 0 3px rgba(37,99,235,.1); }
        .appt-modal .doc-card .doc-check {
          position:absolute; top:8px; right:10px;
          width:18px; height:18px; border-radius:50%;
          background:#2563eb; display:flex; align-items:center; justify-content:center;
        }

        /* Termin chips */
        .appt-modal .termin-chip {
          padding:8px 4px; border-radius:10px; text-align:center;
          font-size:13px; font-weight:600;
          border:1.5px solid #e5e7eb; cursor:pointer;
          transition:all .15s; background:#fff; color:#374151;
        }
        .appt-modal .termin-chip:hover { border-color:#93c5fd; background:#f0f7ff; }
        .appt-modal .termin-chip.selected { background:#2563eb; color:#fff; border-color:#2563eb; box-shadow:0 2px 8px rgba(37,99,235,.3); }
        .appt-modal .termin-chip.zakazan { background:#f3f4f6; color:#9ca3af; border-color:#e5e7eb; cursor:default; text-decoration:line-through; }

        /* Dept pills */
        .appt-modal .dept-pill {
          display:flex; align-items:center; gap:6px; padding:8px 14px;
          border-radius:10px; border:1.5px solid #e5e7eb;
          font-size:13px; font-weight:600; color:#374151;
          cursor:pointer; transition:all .15s; background:#fff; white-space:nowrap;
        }
        .appt-modal .dept-pill:hover { border-color:#93c5fd; background:#f0f7ff; color:#1d4ed8; }
        .appt-modal .dept-pill.selected { background:#2563eb; color:#fff; border-color:#2563eb; }

        /* Patient row */
        .appt-modal .patient-row {
          display:flex; align-items:center; gap:10px;
          padding:10px 12px; border-radius:12px;
          border-bottom:1px solid #f3f4f6; cursor:pointer;
          transition:background .1s;
        }
        .appt-modal .patient-row:hover { background:#f5f8ff; }
        .appt-modal .patient-row:last-child { border-bottom:none; }

        .appt-modal .summary-row {
          display:flex; align-items:center; gap:8px; padding:3px 0;
        }

        .appt-modal .tip-card {
          border:1.5px solid #e5e7eb; border-radius:12px;
          padding:10px 14px; cursor:pointer; transition:all .15s;
          background:#fff;
        }
        .appt-modal .tip-card:hover { border-color:#93c5fd; background:#f8fbff; }
        .appt-modal .tip-card.selected { border-color:#2563eb; background:#eff6ff; }

        .appt-modal .btn-primary {
          padding:10px 22px; background:#2563eb; color:#fff;
          border-radius:12px; font-size:14px; font-weight:700;
          border:none; cursor:pointer; transition:all .15s;
          box-shadow:0 2px 8px rgba(37,99,235,.25);
        }
        .appt-modal .btn-primary:hover { background:#1d4ed8; transform:translateY(-1px); box-shadow:0 4px 14px rgba(37,99,235,.3); }
        .appt-modal .btn-primary:disabled { background:#bfdbfe; color:#eff6ff; box-shadow:none; cursor:not-allowed; transform:none; }

        .appt-modal .btn-secondary {
          padding:10px 18px; background:#fff;
          border:1.5px solid #e5e7eb; color:#374151;
          border-radius:12px; font-size:14px; font-weight:600;
          cursor:pointer; transition:all .15s;
        }
        .appt-modal .btn-secondary:hover { background:#f9fafb; border-color:#d1d5db; }

        .appt-modal .scroll-area { overflow-y:auto; scrollbar-width:thin; scrollbar-color:#e5e7eb transparent; }
        .appt-modal .scroll-area::-webkit-scrollbar { width:4px; }
        .appt-modal .scroll-area::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:4px; }

        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .appt-modal .animate-in { animation: fadeSlideUp .22s ease forwards; }
      `}</style>

      <div style={{
        position:'fixed', inset:0, zIndex:50,
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'16px', background:'rgba(0,0,0,.45)', backdropFilter:'blur(4px)'
      }}>
        <div className="appt-modal" style={{
          background:'#fff', borderRadius:'20px',
          boxShadow:'0 24px 60px rgba(0,0,0,.18)',
          width:'100%', maxWidth:'520px', overflow:'hidden',
          display:'flex', flexDirection:'column'
        }}>

          {/* ── Header ── */}
          <div style={{ padding:'20px 24px 14px', borderBottom:'1px solid #f3f4f6' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
              <div>
                <h2 style={{ fontSize:'17px', fontWeight:700, color:'#0f172a', margin:0 }}>
                  Zakazivanje termina
                </h2>
                <p style={{ fontSize:'12px', color:'#94a3b8', marginTop:2 }}>
                  {selectedPatient
                    ? `Za: ${selectedPatient.korisnik.ime} ${selectedPatient.korisnik.prezime}`
                    : 'Odaberite pacijenta za nastavak'}
                </p>
              </div>
              <button onClick={onClose} style={{
                width:32, height:32, borderRadius:'10px', border:'1.5px solid #e5e7eb',
                background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                color:'#6b7280', flexShrink:0
              }}>
                <X size={16} />
              </button>
            </div>

            {/* Step pills */}
            <div style={{ display:'flex', gap:6, marginTop:14, flexWrap:'wrap' }}>
              {stepInfo.map((s, i) => {
                const n = i + 1;
                const cls = n < step ? 'done' : n === step ? 'active' : 'idle';
                return (
                  <div key={n} className={`step-pill ${cls}`}>
                    <div className="dot">
                      {n < step ? <CheckCircle2 size={11} /> : n}
                    </div>
                    {s.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="scroll-area animate-in" style={{ padding:'20px 24px', maxHeight:'65vh', flex:1 }}>

            {/* ════════ KORAK 1: PACIJENT ════════ */}
            {step === 1 && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <p style={{ fontSize:13, color:'#6b7280', margin:0 }}>
                  Pretražite pacijenta po imenu ili prezimenu.
                </p>

                <div style={{ position:'relative' }}>
                  <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }} />
                  <input
                    value={search}
                    onChange={e => { setSearch(e.target.value); setSelectedPatient(null); }}
                    placeholder="Unesite ime ili prezime…"
                    className="styled-input"
                    style={{ paddingLeft:36 }}
                  />
                </div>

                {filteredPatients.length > 0 && !selectedPatient && (
                  <div style={{ border:'1.5px solid #e5e7eb', borderRadius:14, overflow:'hidden', maxHeight:220 }} className="scroll-area">
                    {filteredPatients.map(p => {
                      const [bg, fg] = getAvatarColor(p.id);
                      return (
                        <div
                          key={p.id}
                          className="patient-row"
                          onClick={() => { setSelectedPatient(p); setSearch(`${p.korisnik.ime} ${p.korisnik.prezime}`); }}
                        >
                          <div style={{ width:36, height:36, borderRadius:'50%', background:bg, color:fg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>
                            {p.korisnik.ime[0]}{p.korisnik.prezime[0]}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ margin:0, fontSize:14, fontWeight:600, color:'#0f172a' }}>{p.korisnik.ime} {p.korisnik.prezime}</p>
                            <p style={{ margin:0, fontSize:12, color:'#9ca3af' }}>
                              Knjižica: <span className="mono">{p.brojKnjizice}</span> · {p.korisnik.brojTelefona ?? 'Bez telefona'}
                            </p>
                          </div>
                          <ChevronRight size={14} style={{ color:'#d1d5db', flexShrink:0 }} />
                        </div>
                      );
                    })}
                  </div>
                )}

                {search.length >= 2 && filteredPatients.length === 0 && !selectedPatient && (
                  <div style={{ textAlign:'center', padding:'20px 0', fontSize:13, color:'#9ca3af' }}>
                    Nema pacijenata za „{search}"
                  </div>
                )}

                {selectedPatient && (() => {
                  const [bg, fg] = getAvatarColor(selectedPatient.id);
                  return (
                    <div style={{ display:'flex', alignItems:'center', gap:12, padding:14, background:'#f0f9ff', border:'1.5px solid #bae6fd', borderRadius:14 }}>
                      <div style={{ width:42, height:42, borderRadius:'50%', background:bg, color:fg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, flexShrink:0 }}>
                        {selectedPatient.korisnik.ime[0]}{selectedPatient.korisnik.prezime[0]}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#0c4a6e' }}>{selectedPatient.korisnik.ime} {selectedPatient.korisnik.prezime}</p>
                        <p style={{ margin:0, fontSize:12, color:'#0369a1', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          Knjižica: <span className="mono">{selectedPatient.brojKnjizice}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => { setSelectedPatient(null); setSearch(''); }}
                        style={{ fontSize:12, fontWeight:600, color:'#0369a1', background:'none', border:'none', cursor:'pointer', whiteSpace:'nowrap' }}
                      >
                        Promijeni
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ════════ KORAK 2: ODJEL → DOKTOR → DATUM → TERMIN ════════ */}
            {step === 2 && (
              <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

                {/* Odjel */}
                <div>
                  <span className="field-label"><Building2 size={10} style={{ display:'inline', marginRight:4 }} />Odaberite odjel</span>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {odjeliFiltered.map(dep => (
                      <div
                        key={dep.id}
                        className={`dept-pill ${selectedOdjelId === dep.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedOdjelId(dep.id);
                          setSelectedDoctor(null);
                          setSlobodniTermini([]);
                          setSelectedTermin(null);
                        }}
                      >
                        <Building2 size={13} />
                        {dep.naziv}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Doktori iz odjela */}
                {selectedOdjelId && (
                  <div>
                    <span className="field-label"><Stethoscope size={10} style={{ display:'inline', marginRight:4 }} />Odaberite doktora</span>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {doctorsInOdjel.map(d => {
                        const [bg, fg] = getAvatarColor(d.id);
                        const isSelected = selectedDoctor?.id === d.id;
                        return (
                          <div
                            key={d.id}
                            className={`doc-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedDoctor(d);
                              setSlobodniTermini([]);
                              setSelectedTermin(null);
                            }}
                          >
                            <div style={{ width:40, height:40, borderRadius:'50%', background:bg, color:fg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, flexShrink:0 }}>
                              {d.korisnik.ime[0]}{d.korisnik.prezime[0]}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#0f172a' }}>
                                Dr. {d.korisnik.ime} {d.korisnik.prezime}
                              </p>
                              <p style={{ margin:0, fontSize:12, color:'#6b7280', marginTop:1 }}>
                                {d.specijalizacija}
                                {d.soba && (
                                  <span style={{ marginLeft:8, color:'#94a3b8' }}>
                                    <MapPin size={10} style={{ display:'inline', marginRight:2 }} />
                                    {d.soba.naziv} · Sprat {d.soba.sprat}
                                  </span>
                                )}
                              </p>
                            </div>
                            {isSelected && (
                              <div className="doc-check">
                                <CheckCircle2 size={11} color="#fff" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Slobodni datumi za odabranog doktora */}
                {selectedDoctor && (
                  <div>
                    <span className="field-label">
                      <Calendar size={10} style={{ display:'inline', marginRight:4 }} />
                      Dostupni datumi
                    </span>
                    {loadingDatumi ? (
                      <div style={{ padding:'16px 0', textAlign:'center', fontSize:13, color:'#94a3b8' }}>
                        Učitavanje dostupnih datuma…
                      </div>
                    ) : slobodniDatumi.length === 0 ? (
                      <div style={{ padding:'14px', textAlign:'center', fontSize:13, color:'#ef4444', background:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:12 }}>
                        Nema slobodnih termina u narednom periodu
                      </div>
                    ) : (
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
                        {slobodniDatumi.map(d => {
                          const dt = new Date(d + 'T00:00:00');
                          const dayName = dt.toLocaleDateString('bs-BA', { weekday:'short' });
                          const dayNum  = dt.getDate();
                          const month   = dt.toLocaleDateString('bs-BA', { month:'short' });
                          const isSelected = date === d;
                          return (
                            <div
                              key={d}
                              onClick={() => { setDate(d); setSelectedTermin(null); }}
                              style={{
                                padding:'10px 8px', borderRadius:12, textAlign:'center',
                                border: isSelected ? '2px solid #2563eb' : '1.5px solid #e5e7eb',
                                background: isSelected ? '#eff6ff' : '#fff',
                                cursor:'pointer', transition:'all .15s',
                                boxShadow: isSelected ? '0 0 0 3px rgba(37,99,235,.1)' : 'none',
                              }}
                            >
                              <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', color: isSelected ? '#2563eb' : '#9ca3af' }}>
                                {dayName}
                              </div>
                              <div style={{ fontSize:20, fontWeight:800, color: isSelected ? '#1d4ed8' : '#0f172a', lineHeight:1.2, marginTop:2 }}>
                                {dayNum}
                              </div>
                              <div style={{ fontSize:11, fontWeight:600, color: isSelected ? '#3b82f6' : '#6b7280', marginTop:1 }}>
                                {month}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Slobodni termini za odabrani datum */}
                {selectedDoctor && date && (
                  <div>
                    <span className="field-label">
                      <Clock size={10} style={{ display:'inline', marginRight:4 }} />
                      Slobodni termini — {new Date(date + 'T00:00:00').toLocaleDateString('bs-BA', { weekday:'long', day:'numeric', month:'long' })}
                    </span>
                    {loadingTermini ? (
                      <div style={{ padding:'16px 0', textAlign:'center', fontSize:13, color:'#94a3b8' }}>
                        Učitavanje termina…
                      </div>
                    ) : slobodniTermini.length === 0 ? (
                      <div style={{ padding:'14px', textAlign:'center', fontSize:13, color:'#ef4444', background:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:12 }}>
                        Nema slobodnih termina za odabrani datum
                      </div>
                    ) : (
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8 }}>
                        {slobodniTermini.map(t => (
                          <div
                            key={t.id}
                            className={`termin-chip mono ${selectedTermin?.id === t.id ? 'selected' : ''}`}
                            onClick={() => setSelectedTermin(t)}
                          >
                            {fmtVrijeme(t.vrijeme)}
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedTermin && (
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:10, fontSize:13, color:'#16a34a', fontWeight:600 }}>
                        <CheckCircle2 size={14} />
                        Odabran termin: <span className="mono">{fmtVrijeme(selectedTermin.vrijeme)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ════════ KORAK 3: DETALJI PREGLEDA ════════ */}
            {step === 3 && (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

                {/* Sažetak */}
                <div style={{ background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:14, padding:'14px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                  {[
                    { icon: User, label:'Pacijent', value:`${selectedPatient?.korisnik.ime} ${selectedPatient?.korisnik.prezime}` },
                    { icon: Stethoscope, label:'Doktor', value:`Dr. ${selectedDoctor?.korisnik.ime} ${selectedDoctor?.korisnik.prezime}` },
                    { icon: Building2, label:'Odjel', value: selectedDoctor?.odjel.naziv },
                    { icon: Clock, label:'Termin', value: (() => {
  if (!date) return '—';
  const [god, mjes, dan] = date.split('-');
  return `${dan}.${mjes}.${god}. u ${selectedTermin ? fmtVrijeme(selectedTermin.vrijeme) : '—'}`;
})() },
                    ...(selectedDoctor?.soba ? [{ icon: MapPin, label:'Soba', value:`${selectedDoctor.soba.naziv} (Sprat ${selectedDoctor.soba.sprat})` }] : []),
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="summary-row">
                      <Icon size={13} style={{ color:'#2563eb', flexShrink:0 }} />
                      <span style={{ fontSize:12, color:'#64748b', width:60, flexShrink:0 }}>{label}:</span>
                      <span style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Tip pregleda */}
                <div>
                  <span className="field-label">Vrsta pregleda *</span>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {tipoviPregleda.map(t => (
                      <div
                        key={t.id}
                        className={`tip-card ${selectedTipPregledaId === t.id ? 'selected' : ''}`}
                        onClick={() => setSelectedTipPregledaId(t.id)}
                        style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}
                      >
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{
                            width:8, height:8, borderRadius:'50%',
                            background: selectedTipPregledaId === t.id ? '#2563eb' : '#d1d5db',
                            flexShrink:0, transition:'background .15s'
                          }} />
                          <span style={{ fontSize:14, fontWeight:600, color: selectedTipPregledaId === t.id ? '#1d4ed8' : '#374151' }}>
                            {t.naziv}
                          </span>
                        </div>
                        {t.cijena !== undefined && (
                          <span className="mono" style={{ fontSize:13, fontWeight:600, color:'#6b7280' }}>
                            {t.cijena} KM
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                

                {/* Komentar */}
                <div>
                  <label className="field-label">Komentar / Razlog posjete</label>
                  <textarea
                    value={komentar}
                    onChange={e => setKomentar(e.target.value)}
                    rows={3}
                    placeholder="Unesite razlog posjete ili napomenu…"
                    className="styled-input"
                    style={{ resize:'none', lineHeight:1.5 }}
                  />
                </div>
              </div>
            )}
          </div>


{/* ════════ KORAK 4: NALAZ (OPCIONALAN) ════════ */}
{step === 4 && (
  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
    
    {/* Info banner */}
    <div style={{ padding:'12px 14px', background:'#eff6ff', border:'1.5px solid #bfdbfe', borderRadius:12, display:'flex', alignItems:'flex-start', gap:10 }}>
      <FileText size={15} style={{ color:'#2563eb', flexShrink:0, marginTop:1 }} />
      <div>
        <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#1d4ed8' }}>Ovaj korak je opcionalan</p>
        <p style={{ margin:0, fontSize:12, color:'#3b82f6', marginTop:2 }}>
          Možete priložiti PDF nalaz uz rezervaciju ili preskočiti ovaj korak.
        </p>
      </div>
    </div>

    {/* Naziv nalaza */}
    <div>
      <label className="field-label">Naziv nalaza</label>
      <input
        value={nalazNaziv}
        onChange={e => setNalazNaziv(e.target.value)}
        placeholder="npr. Krvna slika, RTG pluća, EKG..."
        className="styled-input"
        disabled={!nalazFile}
        style={{ opacity: nalazFile ? 1 : 0.5 }}
      />
    </div>

    {/* Drop zona */}
    <div
      onClick={() => nalazInputRef.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); handleNalazFile(e.dataTransfer.files[0]); }}
      style={{
        border: `2px dashed ${nalazFile ? '#10b981' : '#d1d5db'}`,
        borderRadius: 14,
        padding: '28px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        cursor: 'pointer',
        background: nalazFile ? '#f0fdf4' : '#fafafa',
        transition: 'all .2s',
        textAlign: 'center',
      }}
    >
      {nalazFile ? (
        <>
          <div style={{ width:48, height:48, borderRadius:12, background:'#d1fae5', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <CheckCircle2 size={24} color="#059669" />
          </div>
          <div>
            <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#065f46' }}>{nalazFile.name}</p>
            <p style={{ margin:0, fontSize:12, color:'#6b7280', marginTop:2 }}>{(nalazFile.size / 1024).toFixed(1)} KB · PDF</p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); setNalazFile(null); setNalazNaziv(''); setNalazError(''); }}
            style={{ fontSize:12, fontWeight:600, color:'#ef4444', background:'none', border:'1.5px solid #fecaca', borderRadius:8, padding:'4px 12px', cursor:'pointer' }}
          >
            Ukloni fajl
          </button>
        </>
      ) : (
        <>
          <div style={{ width:48, height:48, borderRadius:12, background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Upload size={22} color="#9ca3af" />
          </div>
          <div>
            <p style={{ margin:0, fontSize:14, fontWeight:600, color:'#374151' }}>Kliknite ili prevucite PDF ovdje</p>
            <p style={{ margin:0, fontSize:12, color:'#9ca3af', marginTop:2 }}>Isključivo PDF fajlovi</p>
          </div>
        </>
      )}
      <input
        ref={nalazInputRef}
        type="file"
        accept="application/pdf"
        style={{ display:'none' }}
        onChange={e => handleNalazFile(e.target.files?.[0])}
      />
    </div>

    {nalazError && (
      <p style={{ fontSize:12, color:'#ef4444', margin:0 }}>{nalazError}</p>
    )}

    {/* Validacija — naziv obavezan ako je fajl odabran */}
    {nalazFile && !nalazNaziv.trim() && (
      <div style={{ padding:'10px 14px', background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:10 }}>
        <p style={{ margin:0, fontSize:12, color:'#92400e', fontWeight:600 }}>
          Unesite naziv nalaza da biste nastavili.
        </p>
      </div>
    )}
  </div>
)}
          {/* ── Footer ── */}
          <div style={{ padding:'14px 24px 18px', borderTop:'1px solid #f3f4f6', background:'#fafafa', display:'flex', alignItems:'center', gap:8 }}>
  {step > 1 && (
    <button className="btn-secondary" onClick={() => setStep(prev => (prev - 1) as 1|2|3|4)}>
      ← Nazad
    </button>
  )}
  <button className="btn-secondary" onClick={onClose}>
    Odustani
  </button>
  <div style={{ flex:1 }} />

  {step === 1 && (
    <button className="btn-primary" disabled={!canStep2} onClick={() => setStep(2)}>
      Dalje →
    </button>
  )}
  {step === 2 && (
    <button className="btn-primary" disabled={!canStep3} onClick={() => setStep(3)}>
      Pregled detalja →
    </button>
  )}
  {step === 3 && (
    <button className="btn-primary" disabled={!canSubmit} onClick={() => setStep(4)}>
      Dalje →
    </button>
  )}
  {step === 4 && (
    <div style={{ display:'flex', gap:8 }}>
      {/* Preskoci — uvijek dostupno */}
      <button
        className="btn-secondary"
        onClick={() => onConfirm({
          pacijentId:    selectedPatient!.korisnik.id,
          doktorId:      selectedDoctor!.id,
          idTermina:     selectedTermin!.id,
          datum:         date,
          tipPregledaId: selectedTipPregledaId as number,
          hitnost:       tipoviPregleda.find(t => t.id === selectedTipPregledaId)?.naziv === 'Hitni pregled' ? true : hitnost,
          komentar:      komentar || tipoviPregleda.find(t => t.id === selectedTipPregledaId)?.naziv || '',
          nalaz:         null,
        })}
      >
        Preskoči →
      </button>
      {/* Zakaži sa nalazom — disabled ako je fajl bez naziva */}
      <button
        className="btn-primary"
        disabled={!nalazFile || !nalazNaziv.trim()}
        onClick={handleSubmit}
      >
        ✓ Zakaži s nalazom
      </button>
    </div>
  )}
</div>
        </div>
      </div>
    </>
  );
}