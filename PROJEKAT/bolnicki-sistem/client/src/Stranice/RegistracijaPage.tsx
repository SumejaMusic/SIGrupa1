import { useState, useRef, useEffect, forwardRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, ShieldCheck, RefreshCw } from 'lucide-react';
import { apiUrl } from '../lib/api';
import DatePicker from 'react-datepicker';

const MaskedDateInput = forwardRef<HTMLInputElement, any>(({ value, onChange, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.slice(0, 8);
    let formatted = val;
    if (val.length > 4) {
      formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`;
    } else if (val.length > 2) {
      formatted = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    e.target.value = formatted;
    if (onChange) onChange(e);
  };
  return <input ref={ref} value={value} onChange={handleChange} {...props} />;
});

interface Greske {
  ime?: string;
  prezime?: string;
  jmbg?: string;
  datumRodjenja?: string;
  email?: string;
  pristupnaSifra?: string;
  brojTelefona?: string;
  brojKnjizice?: string;
  opsta?: string;
}

const zahtjeviLozinke = [
  { label: 'Min. 8 karaktera', test: (s: string) => s.length >= 8 },
  { label: 'Veliko slovo', test: (s: string) => /[A-Z]/.test(s) },
  { label: 'Malo slovo', test: (s: string) => /[a-z]/.test(s) },
  { label: 'Broj', test: (s: string) => /[0-9]/.test(s) },
  { label: 'Specijalni karakter', test: (s: string) => /[^A-Za-z0-9]/.test(s) },
];

const danasnji = () => new Date().toISOString().split('T')[0];

const validirajPolje = (name: string, value: string): string | undefined => {
  const regexSlova = /^[A-Za-zČĆŽŠĐčćžšđ\s-]+$/;
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const regexTelefon = /^(\+387|0)\d{8,9}$/;

  switch (name) {
    case 'ime':
      if (!value) return 'Ime je obavezno.';
      if (!regexSlova.test(value)) return 'Ime može sadržavati samo slova.';
      break;
    case 'prezime':
      if (!value) return 'Prezime je obavezno.';
      if (!regexSlova.test(value)) return 'Prezime može sadržavbati samo slova.';
      break;
    case 'jmbg':
      if (!value) return 'JMBG je obavezan.';
      if (!/^\d{13}$/.test(value)) return 'JMBG mora imati 13 cifara.';
      break;
    case 'datumRodjenja':
      if (!value) return 'Datum rođenja je obavezan.';
      if (value > danasnji()) return 'Datum rođenja ne može biti u budućnosti.';
      break;
    case 'email':
      if (!value) return 'Email je obavezan.';
      if (!regexEmail.test(value)) return 'Email nije validan.';
      break;
    case 'pristupnaSifra':
      if (!value) return 'Lozinka je obavezna.';
      if (!zahtjeviLozinke.every(z => z.test(value))) return 'Lozinka ne ispunjava sve zahtjeve.';
      break;
    case 'brojTelefona':
      if (value && !regexTelefon.test(value)) return 'Format: +387 ili 06x...';
      break;
    case 'brojKnjizice':
      if (!value) return 'Broj knjižice je obavezan.';
      break;
  }
  return undefined;
};

export default function RegistracijaPage() {
  const navigate = useNavigate();
  const [ucitavanje, setUcitavanje] = useState(false);
  const [greske, setGreske] = useState<Greske>({});
  const [podaci, setPodaci] = useState({
    ime: '', prezime: '', jmbg: '', datumRodjenja: '',
    email: '', pristupnaSifra: '', brojTelefona: '', brojKnjizice: ''
  });

  const [verifikacija, setVerifikacija] = useState(false);
  const [maskiraniEmail, setMaskiraniEmail] = useState('');
  const [verifikacijaEmail, setVerifikacijaEmail] = useState('');
  const [kodCifre, setKodCifre] = useState<string[]>(['', '', '', '', '', '']);
  const [verifikacijaGreska, setVerifikacijaGreska] = useState('');
  const [verifikacijaUcitavanje, setVerifikacijaUcitavanje] = useState(false);
  const [verifikacijaUspjeh, setVerifikacijaUspjeh] = useState(false);
  const [ponovnoSlanje, setPonovnoSlanje] = useState(false);
  const [ponovnoPoruka, setPonovnoPoruka] = useState('');
  const [odbrojavanje, setOdbrojavanje] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);


  // Odbrojavanje za "ponovo pošalji" (60 sekundi)
  useEffect(() => {
    if (odbrojavanje <= 0) return;
    const timer = setTimeout(() => setOdbrojavanje(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [odbrojavanje]);
 
  // Auto-fokus na prvi input kad se verifikacija prikaže
  useEffect(() => {
    if (verifikacija && !verifikacijaUspjeh) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [verifikacija, verifikacijaUspjeh]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPodaci(prev => ({ ...prev, [name]: value }));
    if (greske[name as keyof Greske]) {
      setGreske(prev => ({ ...prev, [name]: validirajPolje(name, value) }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const greska = validirajPolje(name, value);
    setGreske(prev => ({ ...prev, [name]: greska }));
  };

  const validiraj = (): boolean => {
    const nove: Greske = {};
    Object.entries(podaci).forEach(([name, value]) => {
      const greska = validirajPolje(name, value);
      if (greska) nove[name as keyof Greske] = greska;
    });
    setGreske(nove);
    return Object.keys(nove).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validiraj()) return;

    setUcitavanje(true);
    try {
      const res = await fetch(apiUrl('/api/auth/registracija'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(podaci)
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.poruka?.includes('email'))
          setGreske({ email: data.poruka });
        else if (res.status === 409 && data.poruka?.includes('JMBG'))
          setGreske({ jmbg: data.poruka });
        else if (res.status === 409 && data.poruka?.includes('knjižice'))
          setGreske({ brojKnjizice: data.poruka });
        else
          setGreske({ opsta: data.poruka || 'Greška pri registraciji.' });
        return;
      }

      // NOVO: Prikaži verifikacioni korak
      if (data.emailVerifikacijaPotrebna) {
        setVerifikacija(true);
        setMaskiraniEmail(data.maskiraniEmail);
        setVerifikacijaEmail(data.email);
        setOdbrojavanje(60);
      }
    } catch {
      setGreske({ opsta: 'Greška servera. Pokušajte ponovo.' });
    } finally {
      setUcitavanje(false);
    }
  };

  const handleCifraChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
 
    const noveCifre = [...kodCifre];
    noveCifre[index] = value;
    setKodCifre(noveCifre);
    setVerifikacijaGreska('');
 
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
 
    if (value && index === 5) {
      const kompletanKod = noveCifre.join('');
      if (kompletanKod.length === 6) {
        handleVerifikuj(kompletanKod);
      }
    }
  };
 
  const handleCifraKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !kodCifre[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
 
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;
 
    const noveCifre = [...kodCifre];
    for (let i = 0; i < pasted.length; i++) {
      noveCifre[i] = pasted[i];
    }
    setKodCifre(noveCifre);
 
    const fokusIndex = Math.min(pasted.length, 5);
    inputRefs.current[fokusIndex]?.focus();
 
    if (pasted.length === 6) {
      handleVerifikuj(pasted);
    }
  };

  const handleVerifikuj = async (kod?: string) => {
    const finalKod = kod || kodCifre.join('');
    if (finalKod.length !== 6) {
      setVerifikacijaGreska('Unesite svih 6 cifara.');
      return;
    }
 
    setVerifikacijaUcitavanje(true);
    setVerifikacijaGreska('');
    try {
      const res = await fetch(apiUrl('/api/auth/verifikuj-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifikacijaEmail, kod: finalKod })
      });
 
      const data = await res.json();
 
      if (!res.ok) {
        setVerifikacijaGreska(data.poruka || 'Pogrešan verifikacioni kod.');
        setKodCifre(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        return;
      }
 
      // Uspješna verifikacija!
      setVerifikacijaUspjeh(true);
 
      // Preusmjeri na prijavu nakon 3 sekunde
      setTimeout(() => navigate('/prijava'), 3000);
    } catch {
      setVerifikacijaGreska('Greška servera. Pokušajte ponovo.');
    } finally {
      setVerifikacijaUcitavanje(false);
    }
  };
  const handlePonovoPosalji = async () => {
    if (odbrojavanje > 0) return;
 
    setPonovnoSlanje(true);
    setPonovnoPoruka('');
    try {
      const res = await fetch(apiUrl('/api/auth/ponovo-posalji-verifikaciju'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifikacijaEmail })
      });
 
      const data = await res.json();
 
      if (!res.ok) {
        setPonovnoPoruka(data.poruka || 'Greška pri slanju.');
      } else {
        setPonovnoPoruka('Novi kod je poslan na Vaš email.');
        setOdbrojavanje(60);
        setKodCifre(['', '', '', '', '', '']);
        setVerifikacijaGreska('');
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch {
      setPonovnoPoruka('Greška servera.');
    } finally {
      setPonovnoSlanje(false);
    }
  };


  const inputKlasa = (name: keyof Greske) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${greske[name] ? 'border-red-400' : 'border-gray-200'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-800 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 w-full max-w-md shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 bg-blue-700 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-blue-900">SwiftMed</span>
        </div>
 
        {/* ═══════════════════════════════════════════════════ */}
        {/* EMAIL VERIFIKACIJA KORAK                           */}
        {/* ═══════════════════════════════════════════════════ */}
        {verifikacija ? (
          <div>
            {verifikacijaUspjeh ? (
              /* Uspješna verifikacija */
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Email verifikovan!</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Vaš nalog je spreman. Preusmjeravamo Vas na stranicu za prijavu...
                </p>
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : (
              /* Unos verifikacionog koda */
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Potvrdite email</h2>
                    <p className="text-xs text-gray-500">Još jedan korak do Vašeg naloga</p>
                  </div>
                </div>
 
                <p className="text-sm text-gray-500 mb-6 mt-3">
                  Poslali smo verifikacioni kod na{' '}
                  <span className="font-medium text-gray-700">{maskiraniEmail}</span>.
                  Unesite ga ispod da potvrdite Vašu email adresu.
                </p>
 
                {verifikacijaGreska && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                    {verifikacijaGreska}
                  </div>
                )}
 
                {ponovnoPoruka && (
                  <div className={`text-sm rounded-lg px-4 py-3 mb-4 ${
                    ponovnoPoruka.includes('Greška') || ponovnoPoruka.includes('Previše')
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    {ponovnoPoruka}
                  </div>
                )}
 
                {/* 6 polja za cifre */}
                <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
                  {kodCifre.map((cifra, index) => (
                    <input
                      key={index}
                      ref={el => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={cifra}
                      onChange={(e) => handleCifraChange(index, e.target.value)}
                      onKeyDown={(e) => handleCifraKeyDown(index, e)}
                      disabled={verifikacijaUcitavanje}
                      className={`w-12 h-14 text-center text-xl font-semibold border-2 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                        disabled:opacity-50 transition-colors
                        ${verifikacijaGreska ? 'border-red-300' : cifra ? 'border-blue-400' : 'border-gray-200'}
                      `}
                    />
                  ))}
                </div>
 
                <button
                  onClick={() => handleVerifikuj()}
                  disabled={verifikacijaUcitavanje || kodCifre.join('').length !== 6}
                  className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors mb-4"
                >
                  {verifikacijaUcitavanje ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Verifikacija...
                    </span>
                  ) : 'Potvrdi email'}
                </button>
 
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Niste primili kod?{' '}
                    {odbrojavanje > 0 ? (
                      <span className="text-gray-400">
                        Ponovo pošalji za {odbrojavanje}s
                      </span>
                    ) : (
                      <button
                        onClick={handlePonovoPosalji}
                        disabled={ponovnoSlanje}
                        className="text-blue-700 font-medium hover:underline disabled:opacity-50"
                      >
                        {ponovnoSlanje ? 'Slanje...' : 'Pošalji ponovo'}
                      </button>
                    )}
                  </p>
                </div>
 
                <p className="text-xs text-gray-400 text-center mt-4">
                  Kod vrijedi 15 minuta. Nikome ne dijelite ovaj kod.
                </p>
              </>
            )}
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════ */
          /* REGISTRACIONA FORMA (nepromijenjeno)               */
          /* ═══════════════════════════════════════════════════ */
          <>
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">Kreirajte nalog</h2>
            <p className="text-sm text-gray-500 mb-6">Popunite podatke da biste se registrovali</p>
 
            {greske.opsta && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                {greske.opsta}
              </div>
            )}
 
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ime</label>
                  <input name="ime" value={podaci.ime}
                    onChange={handleChange} onBlur={handleBlur}
                    placeholder="npr. Amina"
                    className={inputKlasa('ime')} />
                  {greske.ime && <p className="text-xs text-red-500 mt-1">{greske.ime}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Prezime</label>
                  <input name="prezime" value={podaci.prezime}
                    onChange={handleChange} onBlur={handleBlur}
                    placeholder="npr. Hodžić"
                    className={inputKlasa('prezime')} />
                  {greske.prezime && <p className="text-xs text-red-500 mt-1">{greske.prezime}</p>}
                </div>
              </div>
 
              {[
                { name: 'jmbg', label: 'JMBG', type: 'text', placeholder: '1234567890123', maxLength: 13 },
              ].map(({ name, label, ...rest }) => (
                <div key={name} className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input
                    name={name}
                    value={podaci[name as keyof typeof podaci]}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    {...rest}
                    className={inputKlasa(name as keyof Greske)}
                  />
                  {greske[name as keyof Greske] && (
                    <p className="text-xs text-red-500 mt-1">{greske[name as keyof Greske]}</p>
                  )}
                </div>
              ))}
 
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Datum rođenja</label>
                <DatePicker
                  customInput={<MaskedDateInput />}
                  selected={
                    podaci.datumRodjenja && !isNaN(new Date(podaci.datumRodjenja + 'T12:00:00').getTime())
                      ? new Date(podaci.datumRodjenja + 'T12:00:00')
                      : null
                  }
                  onChange={(date: Date | null) => {
                    if (date && !isNaN(date.getTime()) && date.getFullYear() >= 1000) {
                      const y = String(date.getFullYear()).padStart(4, '0');
                      const m = String(date.getMonth() + 1).padStart(2, '0');
                      const d = String(date.getDate()).padStart(2, '0');
                      const iso = `${y}-${m}-${d}`;
                      setPodaci(prev => ({ ...prev, datumRodjenja: iso }));
                      if (greske.datumRodjenja) {
                        setGreske(prev => ({ ...prev, datumRodjenja: validirajPolje('datumRodjenja', iso) }));
                      }
                    } else if (!date) {
                      setPodaci(prev => ({ ...prev, datumRodjenja: '' }));
                    }
                  }}
                  dateFormat="dd/MM/yyyy"
                  maxDate={new Date()}
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  placeholderText="dd/mm/yyyy"
                  className={inputKlasa('datumRodjenja')}
                  wrapperClassName="w-full"
                  autoComplete="off"
                />
                {greske.datumRodjenja && (
                  <p className="text-xs text-red-500 mt-1">{greske.datumRodjenja}</p>
                )}
              </div>
 
              {[
                { name: 'email', label: 'Email adresa', type: 'email', placeholder: 'email@primjer.ba' },
              ].map(({ name, label, ...rest }) => (
                <div key={name} className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input
                    name={name}
                    value={podaci[name as keyof typeof podaci]}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    {...rest}
                    className={inputKlasa(name as keyof Greske)}
                  />
                  {greske[name as keyof Greske] && (
                    <p className="text-xs text-red-500 mt-1">{greske[name as keyof Greske]}</p>
                  )}
                </div>
              ))}
 
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Lozinka</label>
                <input
                  name="pristupnaSifra"
                  type="password"
                  value={podaci.pristupnaSifra}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Min. 8 karaktera"
                  className={inputKlasa('pristupnaSifra')}
                />
                {podaci.pristupnaSifra && (
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {zahtjeviLozinke.map(({ label, test }) => {
                      const ok = test(podaci.pristupnaSifra);
                      return (
                        <span key={label} className={`text-xs flex items-center gap-1 ${ok ? 'text-green-600' : 'text-gray-400'}`}>
                          {ok ? '✓' : '○'} {label}
                        </span>
                      );
                    })}
                  </div>
                )}
                {greske.pristupnaSifra && <p className="text-xs text-red-500 mt-1">{greske.pristupnaSifra}</p>}
              </div>
 
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Broj zdravstvene knjižice</label>
                <input
                  name="brojKnjizice"
                  value={podaci.brojKnjizice}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="npr. 123456789"
                  className={inputKlasa('brojKnjizice')}
                />
                {greske.brojKnjizice && <p className="text-xs text-red-500 mt-1">{greske.brojKnjizice}</p>}
              </div>
 
              <div className="mb-5">
                <label className="block text-xs text-gray-500 mb-1">
                  Broj telefona <span className="text-gray-400">(opciono)</span>
                </label>
                <input
                  name="brojTelefona"
                  value={podaci.brojTelefona}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="+387 61 123 456"
                  className={inputKlasa('brojTelefona')}
                />
                {greske.brojTelefona && <p className="text-xs text-red-500 mt-1">{greske.brojTelefona}</p>}
              </div>
 
              <button type="submit" disabled={ucitavanje}
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors">
                {ucitavanje ? 'Registracija...' : 'Registrujte se'}
              </button>
            </form>
 
            <p className="text-center text-sm text-gray-500 mt-4">
              Već imate nalog?{' '}
              <Link to="/prijava" className="text-blue-700 font-medium hover:underline">Prijavite se</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
