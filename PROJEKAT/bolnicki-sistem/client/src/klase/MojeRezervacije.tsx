import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, XCircle, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const MojeRezervacije = () => {
  const [rezervacije, setRezervacije] = useState([]);
  const [loading, setLoading] = useState(true);
  const [poruka, setPoruka] = useState(null);

  // 1. DOHVATANJE PODATAKA SA BACKENDA (US-05/US-10)
  useEffect(() => {
    const fetchRezervacije = async () => {
      try {
        setLoading(true);
        // Zamijeni URL sa tvojom pravom API rutom, npr. 'http://localhost:5000/api/rezervacije'
        const response = await fetch('/api/rezervacije'); 
        const data = await response.json();
        setRezervacije(data);
      } catch (err) {
        console.error("Greška pri učitavanju:", err);
        setPoruka({ tip: 'error', tekst: "Nije moguće učitati rezervacije." });
      } finally {
        setLoading(false);
      }
    };

    fetchRezervacije();
  }, []);

  // 2. LOGIKA ZA PROVJERU 24h
  const mozeSeOtkazati = (datum, vrijeme) => {
    const termin = new Date(`${datum}T${vrijeme}`);
    const sada = new Date();
    const razlikaUSatima = (termin - sada) / (1000 * 60 * 60);
    return razlikaUSatima > 24;
  };

  // 3. OTKAZIVANJE TERMINA (NFR-10, NFR-11)
  const handleOtkazi = async (id) => {
    if (!window.confirm("Da li ste sigurni da želite otkazati ovaj termin?")) return;

    try {
      // Slanje zahtjeva backendu za brisanje/otkazivanje
      const response = await fetch(`/api/rezervacije/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Ako je backend uspješno obrisao, ažuriramo UI odmah (NFR-09: ≤2s)
        setRezervacije(rezervacije.filter(res => res.id !== id));
        setPoruka({ tip: 'success', tekst: "Termin uspješno otkazan. Email obavijest je poslana." });
      } else {
        throw new Error("Greška na serveru");
      }
    } catch (err) {
      setPoruka({ tip: 'error', tekst: "Otkazivanje nije uspjelo. Pokušajte ponovo." });
    }

    setTimeout(() => setPoruka(null), 5000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-900 mb-6 flex items-center gap-2">
          <Calendar className="text-blue-600" /> Moje Rezervacije
        </h1>

        {poruka && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
            poruka.tip === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {poruka.tip === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {poruka.tekst}
          </div>
        )}

        <div className="grid gap-4">
          {rezervacije.length > 0 ? (
            rezervacije.map((res) => {
              const dozvoljeno = mozeSeOtkazati(res.datum, res.vrijeme);

              return (
                <div key={res.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xl font-bold text-gray-800">
                        <User size={20} className="text-blue-600" />
                        {res.doktorIme}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-gray-600 font-medium">
                        <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-md">
                          <Calendar size={16} /> {new Date(res.datum).toLocaleDateString('hr-HR')}
                        </span>
                        <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-md">
                          <Clock size={16} /> {res.vrijeme}
                        </span>
                      </div>

                      {res.komentar && (
                        <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                          <p className="text-sm text-blue-800 font-medium">Napomena:</p>
                          <p className="text-sm text-blue-600 italic">{res.komentar}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col md:items-end justify-center gap-3">
                      {dozvoljeno ? (
                        <button
                          onClick={() => handleOtkazi(res.id)}
                          className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
                        >
                          <XCircle size={18} /> Otkaži termin
                        </button>
                      ) : (
                        <div className="text-right">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded">
                            Zaključano
                          </span>
                          <p className="text-[10px] text-gray-400 mt-1 max-w-[150px]">
                            Manje od 24h do termina. Otkazivanje nije moguće.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
              <p className="text-gray-400 text-xl mb-4">Nemate zakazanih termina.</p>
              <a href="/rezervacija-pacijent" className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition shadow-md">
                Zakaži odmah
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MojeRezervacije;