import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { apiUrl } from '../lib/api';
import { io } from "socket.io-client";

// 2. Inicijalizuj socket koristeći funkciju apiUrl
const socket = io(apiUrl('/'));
interface Greske {
  email?: string;
  pristupnaSifra?: string;
  opsta?: string;
}

export default function PrijavaPage() {
  const navigate = useNavigate();
  const [ucitavanje, setUcitavanje] = useState(false);
  const [greske, setGreske] = useState<Greske>({});
  const [podaci, setPodaci] = useState({ email: '', pristupnaSifra: '' });

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetStatus({ type: 'error', message: 'Unesite email adresu.' });
      return;
    }

    setResetLoading(true);
    setResetStatus(null);
    try {
      const res = await fetch(apiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();

      if (!res.ok) {
        setResetStatus({ type: 'error', message: data.poruka || 'Došlo je do greške.' });
      } else {
        setResetStatus({ type: 'success', message: data.poruka || 'Ukoliko račun postoji, poslan je email za reset lozinke.' });
      }
    } catch {
      setResetStatus({ type: 'error', message: 'Greška servera. Pokušajte ponovo.' });
    } finally {
      setResetLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPodaci(prev => ({ ...prev, [name]: value }));
    if (greske[name as keyof Greske]) {
      setGreske(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nove: Greske = {};
    if (!podaci.email) nove.email = 'Email je obavezan.';
    if (!podaci.pristupnaSifra) nove.pristupnaSifra = 'Lozinka je obavezna.';
    if (Object.keys(nove).length > 0) { setGreske(nove); return; }

    setUcitavanje(true);
    try {
      const res = await fetch(apiUrl('/api/auth/prijava'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(podaci)
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.kod === 'EMAIL_NOT_VERIFIED') {
          setGreske({
            opsta: 'Vaš email nije verifikovan. Provjerite inbox za verifikacioni kod, ili se registrujte ponovo da dobijete novi kod.'
          });
        } else {
          setGreske({ opsta: data.poruka || 'Pogrešan email ili lozinka.' });
        }return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('korisnik', JSON.stringify(data.korisnik));
      window.dispatchEvent(new Event("istekla-sesija")); //dodano
      // 2. Pošalji poruku preko WebSocketa (ako je konekcija otvorena)
// Ovo će obavijestiti OSTALE otvorene tabove da se prijave
if (socket && socket.connected) {
  // Socket.io automatski pretvara objekte u JSON, ne treba JSON.stringify
  socket.emit('LOGIN_SUCCESS', { 
    korisnik: data.korisnik 
  });}
      // Redirect prema ulozi korisnika
      const uloga = data.korisnik.uloga;
      switch (uloga) {
        case "DOKTOR":
          navigate("/doktor-rezervacije");
          break;
        case "PACIJENT":
          navigate("/moje-rezervacije");
          break;
        case "MEDICINSKO_OSOBLJE":
        case "ADMINISTRATOR":
        case "VLASNIK":
        default:
          navigate("/");
          break;
      }
    } catch {
      setGreske({ opsta: 'Greška servera. Pokušajte ponovo.' });
    } finally {
      setUcitavanje(false);
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

        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Dobrodošli nazad</h2>
        <p className="text-sm text-gray-500 mb-6">Unesite vaše podatke za prijavu</p>

        {greske.opsta && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {greske.opsta}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">Email adresa</label>
            <input
              name="email"
              type="email"
              value={podaci.email}
              onChange={handleChange}
              placeholder="email@primjer.ba"
              className={inputKlasa('email')}
            />
            {greske.email && <p className="text-xs text-red-500 mt-1">{greske.email}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-xs text-gray-500 mb-1">Lozinka</label>
            <input
              name="pristupnaSifra"
              type="password"
              value={podaci.pristupnaSifra}
              onChange={handleChange}
              placeholder="Vaša lozinka"
              className={inputKlasa('pristupnaSifra')}
            />
            {greske.pristupnaSifra && <p className="text-xs text-red-500 mt-1">{greske.pristupnaSifra}</p>}
          </div>

          <div className="flex justify-center mb-4">
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(true)}
              className="text-sm text-blue-700 hover:underline font-medium"
            >
              Zaboravili ste lozinku?
            </button>
          </div>

          <button
            type="submit"
            disabled={ucitavanje}
            className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors"
          >
            {ucitavanje ? 'Prijava...' : 'Prijavite se'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Nemate nalog?{' '}
          <Link to="/registracija" className="text-blue-700 font-medium hover:underline">
            Registrujte se
          </Link>
        </p>
      </div>

      {/* Modal za reset lozinke */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Resetovanje lozinke</h3>
            <p className="text-sm text-gray-500 mb-4">
              Unesite svoju email adresu i poslat ćemo vam link za resetovanje lozinke.
            </p>

            {resetStatus && (
              <div className={`text-sm rounded-lg px-4 py-3 mb-4 ${resetStatus.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                {resetStatus.message}
              </div>
            )}

            <form onSubmit={handleForgotPassword}>
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Email adresa</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="email@primjer.ba"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setResetStatus(null);
                    setResetEmail('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {resetLoading ? 'Slanje...' : 'Pošalji link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
