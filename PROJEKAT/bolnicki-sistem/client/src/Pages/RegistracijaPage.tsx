import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

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
      const res = await fetch('http://localhost:5000/api/auth/registracija', {
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

      navigate('/');
    } catch {
      setGreske({ opsta: 'Greška servera. Pokušajte ponovo.' });
    } finally {
      setUcitavanje(false);
    }
  };

  const inputKlasa = (name: keyof Greske) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
      greske[name] ? 'border-red-400' : 'border-gray-200'
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

          {/* Datum rođenja */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">Datum rođenja</label>
            <input
              name="datumRodjenja"
              type="date"
              value={podaci.datumRodjenja}
              onChange={handleChange}
              onBlur={handleBlur}
              max={danasnji()}
              style={{ colorScheme: 'light' }}
              className={inputKlasa('datumRodjenja')}
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

          {/* Lozinka sa indikatorima */}
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
      </div>
    </div>
  );
}