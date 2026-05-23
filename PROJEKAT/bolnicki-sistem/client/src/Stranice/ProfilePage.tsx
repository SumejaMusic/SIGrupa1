import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { apiUrl } from '../lib/api';
import { formatDatumPrikaz, isoUTCdatum } from '../utils/rezervacijeUtils';
import { User, Mail, Phone, Calendar, Edit2, Save, X, CheckCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';

interface UserProfile {
  id: number;
  ime: string;
  prezime: string;
  email: string;
  brojTelefona: string | null;
  datumRodjenja: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    ime: '',
    prezime: '',
    brojTelefona: '',
    datumRodjenja: ''
  });

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const korisnikStr = localStorage.getItem('korisnik');
      if (!korisnikStr) return;

      const korisnik = JSON.parse(korisnikStr);
      const token = localStorage.getItem('token');

      const res = await fetch(apiUrl(`/api/users/${korisnik.id}/profile`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditForm({
          ime: data.ime,
          prezime: data.prezime,
          brojTelefona: data.brojTelefona || '',
          datumRodjenja: data.datumRodjenja ? isoUTCdatum(data.datumRodjenja) : ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/users/${profile?.id}/profile`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.korisnik);
        setMessage({ text: 'Profil uspješno ažuriran', type: 'success' });
        setIsEditing(false);

        // Update local storage name
        const korisnikStr = localStorage.getItem('korisnik');
        if (korisnikStr) {
          const k = JSON.parse(korisnikStr);
          k.ime = data.korisnik.ime;
          k.prezime = data.korisnik.prezime;
          localStorage.setItem('korisnik', JSON.stringify(k));
          window.dispatchEvent(new Event('storage'));
        }
      } else {
        const err = await res.json();
        setMessage({ text: err.poruka || 'Došlo je do greške', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Greška servera. Pokušajte ponovo.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout step={1} totalSteps={1} breadcrumbs={['Profil']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout step={1} totalSteps={1} breadcrumbs={['Profil']}>
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">Nije moguće učitati profil.</div>
      </Layout>
    );
  }

  return (
    <Layout step={1} totalSteps={1} breadcrumbs={['Profil']}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-8 py-8 text-white relative">
            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold backdrop-blur-sm border border-white/30">
                  {profile.ime[0]}{profile.prezime[0]}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{profile.ime} {profile.prezime}</h1>
                  <p className="text-blue-100 mt-1">Vaši lični podaci</p>
                </div>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg transition-colors border border-white/30 font-medium"
                >
                  <Edit2 size={16} />
                  <span>Uredi profil</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 bg-red-500/80 hover:bg-red-500 backdrop-blur-sm px-4 py-2 rounded-lg transition-colors text-white border border-red-400/50 font-medium"
                >
                  <X size={16} />
                  <span>Odustani</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-8">
            {message && (
              <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                {message.type === 'success' && <CheckCircle size={20} className="text-green-600" />}
                <span>{message.text}</span>
              </div>
            )}

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ime */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User size={16} className="text-gray-400" />
                    Ime
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="ime"
                      value={editForm.ime}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-800 border border-transparent">{profile.ime}</p>
                  )}
                </div>

                {/* Prezime */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User size={16} className="text-gray-400" />
                    Prezime
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="prezime"
                      value={editForm.prezime}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-800 border border-transparent">{profile.prezime}</p>
                  )}
                </div>

                {/* Email (Always disabled) */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Mail size={16} className="text-gray-400" />
                    Email adresa
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                  />
                </div>

                {/* Telefon */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Phone size={16} className="text-gray-400" />
                    Telefon
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="brojTelefona"
                      value={editForm.brojTelefona}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-800 border border-transparent">{profile.brojTelefona || '/'}</p>
                  )}
                </div>

                {/* Datum rođenja */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar size={16} className="text-gray-400" />
                    Datum rođenja
                  </label>
                  {isEditing ? (
                    <DatePicker
                      selected={editForm.datumRodjenja ? new Date(editForm.datumRodjenja + 'T12:00:00') : null}
                      onChange={(date: Date | null) => {
                        if (date) {
                          const y = date.getFullYear();
                          const m = String(date.getMonth() + 1).padStart(2, '0');
                          const d = String(date.getDate()).padStart(2, '0');
                          setEditForm({ ...editForm, datumRodjenja: `${y}-${m}-${d}` });
                        } else {
                          setEditForm({ ...editForm, datumRodjenja: '' });
                        }
                      }}
                      dateFormat="dd/MM/yyyy"
                      maxDate={new Date()}
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      placeholderText="dd/mm/yyyy"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      wrapperClassName="w-full"
                      autoComplete="off"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-800 border border-transparent">
                      {formatDatumPrikaz(profile.datumRodjenja)}
                    </p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-70"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    ) : (
                      <Save size={18} />
                    )}
                    <span>Sačuvaj izmjene</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
