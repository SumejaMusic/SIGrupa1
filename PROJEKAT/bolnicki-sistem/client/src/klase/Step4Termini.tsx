
import { ChevronLeft, ChevronRight, User, Mail, FileText, Upload } from "lucide-react";
import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { io as socketIO } from "socket.io-client";
type Termin = {
  id: number;
  datum: string;
  vrijeme: number;
  status: string;
  zakljucan: boolean;
  zakljucaoKorisnikId: number | null;
  preostaloSekundi: number | null;
};

type PatientForm = {
  ime: string;
  prezime: string;
  email: string;
  komentar: string;
  pdfFile: File | null;
};

//type FormErrors = Partial<PatientForm>;
type FormErrors = {
  ime?: string;
  prezime?: string;
  email?: string;
  komentar?: string;
  pdfFile?: string;
};

function Step4Termini() {
  const apiUrl = import.meta.env.VITE_API_URL;
  /*useEffect(() => {
  const doktorId = localStorage.getItem("selectedDoktor");
  if (!doktorId) { window.location.href = "/step3-tip-pregleda"; return; }

  
  fetch(`${apiUrl}/api/termini?doktorId=${doktorId}`)
    .then(res => res.json())
    .then(setTermini)
    .catch(() => setTermini([]));
}, []);
  
  const [termini, setTermini] = useState<Termin[]>([]); //dodano
  const [selectedTermin, setSelectedTermin] = useState<Termin | null>(null);

  // Čita pacijenta iz localStorage ako je rezervacija pokrenuta od doktora
  const [form, setForm] = useState<PatientForm>(() => {
    const saved = localStorage.getItem("doctorPatient");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        return { ime: p.ime || "", prezime: p.prezime || "", email: p.email || "", komentar: "", pdfFile: null };
      } catch {
        return { ime: "", prezime: "", email: "", komentar: "", pdfFile: null };
      }
    }
    return { ime: "", prezime: "", email: "", komentar: "", pdfFile: null };
  });

  const isDoctorMode = localStorage.getItem("doctorMode") === "true";


  const [errors, setErrors] = useState<FormErrors>({});
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1));
  const [charCount, setCharCount] = useState(0);*/
  const [termini, setTermini] = useState<Termin[]>([]);

  const [countdown, setCountdown] = useState<number | null>(null);



  const [selectedTermin, setSelectedTermin] = useState<Termin | null>(null);
  const [form, setForm] = useState<PatientForm>(() => {
    const saved = localStorage.getItem("doctorPatient");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        return { ime: p.ime || "", prezime: p.prezime || "", email: p.email || "", komentar: "", pdfFile: null };
      } catch {
        return { ime: "", prezime: "", email: "", komentar: "", pdfFile: null };
      }
    }
    return { ime: "", prezime: "", email: "", komentar: "", pdfFile: null };
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1));
  const [charCount, setCharCount] = useState(0);

  // ZATIM useEffect:
  useEffect(() => {
    const doktorId = localStorage.getItem("selectedDoktor");
    if (!doktorId) { window.location.href = "/step3-tip-pregleda"; return; }

    // Inicijalni fetch
  const fetchTermini = () => {
    fetch(`${apiUrl}/api/termini?doktorId=${doktorId}`)
      .then(res => res.json())
      .then(data => setTermini(data))
      .catch(() => {});
  };

  fetchTermini();

  // NFR-09: WebSocket — osvježi samo kad se nešto promijeni
  const socket = socketIO(apiUrl);

  socket.on("termin-azuriran", (data) => {
    if (String(data.doktorId) === doktorId) {
      fetchTermini(); // osvježi termine samo za tog doktora
    }
  });

  return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
  if (!selectedTermin) { setCountdown(null); return; }

  setCountdown(120); // 2 minute

  const timer = setInterval(() => {
    setCountdown(prev => {
      if (prev === null || prev <= 1) {
        clearInterval(timer);
        // Vrijeme isteklo — oslobodi termin i resetuj
        fetch(`${apiUrl}/api/termini/${selectedTermin.id}/oslobodi`, { method: "POST" });
        setSelectedTermin(null);
        alert("Vrijeme za unos podataka je isteklo. Odaberite termin ponovo.");
        return null;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, [selectedTermin]);

  const isDoctorMode = localStorage.getItem("doctorMode") === "true";


  /*const termini: Termin[] = [
    { id: 1, datum: "2026-05-05", vrijeme: 900, status: "SLOBODAN" },
    { id: 2, datum: "2026-05-05", vrijeme: 1000, status: "SLOBODAN" },
    { id: 3, datum: "2026-05-05", vrijeme: 1100, status: "SLOBODAN" },
    { id: 4, datum: "2026-05-06", vrijeme: 900, status: "SLOBODAN" },
    { id: 5, datum: "2026-05-06", vrijeme: 1400, status: "SLOBODAN" },
    { id: 6, datum: "2026-05-07", vrijeme: 1000, status: "SLOBODAN" },
    { id: 7, datum: "2026-05-07", vrijeme: 1100, status: "SLOBODAN" },
    { id: 8, datum: "2026-05-07", vrijeme: 1500, status: "SLOBODAN" },
    { id: 9, datum: "2026-05-12", vrijeme: 900, status: "SLOBODAN" },
    { id: 10, datum: "2026-05-13", vrijeme: 1000, status: "SLOBODAN" },
    { id: 11, datum: "2026-05-14", vrijeme: 1100, status: "SLOBODAN" },
    { id: 12, datum: "2026-05-19", vrijeme: 1000, status: "SLOBODAN" },
    { id: 13, datum: "2026-05-21", vrijeme: 1100, status: "SLOBODAN" },
    { id: 14, datum: "2026-05-26", vrijeme: 900, status: "SLOBODAN" },
  ];*/


  const formatVrijeme = (minute: number): string => {
    const sati = Math.floor(minute / 60).toString().padStart(2, "0");
    const min = (minute % 60).toString().padStart(2, "0");
    return `${sati}:${min}`;
  };

  //const handleSelectTermin = (termin: Termin) => setSelectedTermin(termin); staro
  // NOVO:
const handleSelectTermin = async (termin: Termin) => {
  const apiUrl = import.meta.env.VITE_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/termini/${termin.id}/zakljucaj`, {
      method: "POST",
    });
    if (!res.ok) {
      alert("Termin je upravo zauzet, odaberite drugi.");
      // Osvježi termine
      const doktorId = localStorage.getItem("selectedDoktor");
      fetch(`${apiUrl}/api/termini?doktorId=${doktorId}`)
        .then(r => r.json())
        .then(data => {
        console.log("Termini iz baze:", data);
        setTermini(data) });
      return;
    }
    setSelectedTermin(termin);
  } catch {
    //setSelectedTermin(termin);
    alert("Greška pri zaključavanju termina. Pokušajte ponovo.");
  }
};
  const handleBack = () => window.history.back();

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= 255) {
      setForm(f => ({ ...f, komentar: text }));
      setCharCount(text.length);
      setErrors(err => ({ ...err, komentar: undefined }));
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setForm(f => ({ ...f, pdfFile: file }));
      setErrors(err => ({ ...err, pdfFile: undefined }));
    } else if (file) {
      setErrors(err => ({ ...err, pdfFile: "Samo PDF datoteke su dozvoljene" }));
    }
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.ime.trim()) errs.ime = "Ime je obavezno";
    if (!form.prezime.trim()) errs.prezime = "Prezime je obavezno";
    if (!form.email.trim()) errs.email = "Email je obavezan";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email nije ispravan";
    if (form.komentar.length > 255) errs.komentar = "Komentar ne smije imati više od 255 karaktera";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /*const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const dataToSave = {
      ime: form.ime,
      prezime: form.prezime,
      email: form.email,
      komentar: form.komentar,
      pdfFileName: form.pdfFile?.name || null,
    };

    localStorage.setItem("selectedTermin", selectedTermin!.id.toString());
    localStorage.setItem("patientData", JSON.stringify(dataToSave));

    // Očisti doctor mode podatke nakon submita
    localStorage.removeItem("doctorPatient");
    localStorage.removeItem("doctorMode");

    if (form.pdfFile) {
      const reader = new FileReader();
      reader.onload = () => {
        sessionStorage.setItem("pdfFileData", reader.result as string);
        window.location.href = "/step5-potvrda";
      };
      reader.readAsArrayBuffer(form.pdfFile);
    } else {
      window.location.href = "/step5-potvrda";
    }
  };*/
  // NOVO:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validate()) return;
  if (!selectedTermin) return;

  const idDoktor = Number(localStorage.getItem("selectedDoktor"));
  const idTipPregleda =
    Number(localStorage.getItem("selectedTip")) || undefined;

  const apiUrl = import.meta.env.VITE_API_URL;

  try {
    const formData = new FormData();

    formData.append("idTermina", selectedTermin.id.toString());
    formData.append("idDoktor", idDoktor.toString());

    if (idTipPregleda) {
      formData.append(
        "idTipPregleda",
        idTipPregleda.toString()
      );
    }

    formData.append("komentar", form.komentar);

    if (form.pdfFile) {
      formData.append("dokumentPDF", form.pdfFile);
    }

    const res = await fetch(`${apiUrl}/api/rezervacije`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      console.log("Greška rezervacije:", err);

      alert(err.poruka || "Greška pri kreiranju rezervacije.");
      return;
    }

    const dataToSave = {
      ime: form.ime,
      prezime: form.prezime,
      email: form.email,
    };

    localStorage.setItem(
      "selectedTermin",
      selectedTermin.id.toString()
    );

    localStorage.setItem(
      "selectedTerminData",
      JSON.stringify(selectedTermin)
    );

    localStorage.setItem(
      "patientData",
      JSON.stringify(dataToSave)
    );

    localStorage.removeItem("doctorPatient");
    localStorage.removeItem("doctorMode");

    window.location.href = "/step5-potvrda";
  } catch {
    alert("Greška pri kreiranju rezervacije.");
  }
};

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    setSelectedTermin(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    setSelectedTermin(null);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  /*const getTerminiForDay = (day: number): Termin[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return termini.filter(t => t.datum === dateStr && t.status === "SLOBODAN").sort((a, b) => a.vrijeme - b.vrijeme);
  };*/
  const getTerminiForDay = (day: number): Termin[] => {
  return termini.filter(t => {
    const datumTermina = new Date(t.datum);
    return (
      datumTermina.getUTCFullYear() === year &&
      datumTermina.getUTCMonth() === month &&
      datumTermina.getUTCDate() + 1 === day && // +1 zbog UTC offset
      t.status === "SLOBODAN"
    );
  }).sort((a, b) => a.vrijeme - b.vrijeme);
};

  const monthNames = ["Januar", "Februar", "Mart", "April", "Maj", "Juni", "Juli", "August", "Septembar", "Oktobar", "Novembar", "Decembar"];
  const dayNames = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

  return (
    <Layout step={4} totalSteps={5} breadcrumbs={["1. Izbor Odjela", "2. Izbor Doktora", "3. Termini", "4. Podaci", "5. Potvrda"]}>
      <div className="max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Odaberite Termin</h1>
          <p className="text-gray-600 text-lg">Dostupni termini za pregled</p>

          {/* Obavijest ako je doktor popunio podatke */}
          {isDoctorMode && (
            <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                Podaci pacijenta <strong>{form.ime} {form.prezime}</strong> su automatski popunjeni. Možete ih izmijeniti po potrebi.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kalendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronLeft size={20} className="text-gray-600" />
                </button>
                <h2 className="text-xl font-bold text-gray-900">{monthNames[month]} {year}</h2>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronRight size={20} className="text-gray-600" />
                </button>
              </div>

              <div className="grid grid-cols-7 border-b border-gray-200">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-sm font-bold text-gray-600 py-3 bg-gray-50">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-px p-3 bg-gray-100">
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={i} className="bg-white" />;
                  const dayTermini = getTerminiForDay(day);
                  const hasTermini = dayTermini.length > 0;
                  return (
                    <div key={i} className={`min-h-24 p-2 rounded-lg ${hasTermini ? "bg-blue-50 border-2 border-blue-300" : "bg-white border border-gray-200"}`}>
                      <div className="text-sm font-bold text-gray-900 mb-2">{day}</div>
                      <div className="space-y-1 text-xs">
                        {dayTermini.map(termin => {
  // Provjeri da li je OVAJ korisnik zaključao termin
  const mojaZakljucana = selectedTermin?.id === termin.id;

  if (termin.zakljucan && !mojaZakljucana) {
    // Drugi korisnik drži lock — prikaži disabled sa porukom
    return (
      <div
        key={termin.id}
        className="relative group block w-full text-center px-2 py-1 rounded bg-gray-300 text-gray-500 cursor-not-allowed font-semibold"
      >
        {formatVrijeme(termin.vrijeme)}
        {/* Tooltip poruka na hover */}
        <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-800 text-white text-xs rounded-lg p-3 z-50 shadow-lg">
          Drugi korisnik razmatra ovaj termin. Pokušajte za par minuta ili odaberite novi termin.
        </div>
      </div>
    );
  }

  // Slobodan termin — normalan prikaz
  return (
    <button
      key={termin.id}
      onClick={() => handleSelectTermin(termin)}
      className={`block w-full text-left px-2 py-1 rounded transition-all text-center font-semibold ${
        selectedTermin?.id === termin.id
          ? "bg-blue-600 text-white shadow-md"
          : "bg-blue-500 text-white hover:bg-blue-600"
      }`}
    >
      {formatVrijeme(termin.vrijeme)}
    </button>
  );
})}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Forma */}
          <div>
            {selectedTermin ? (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sticky top-6">
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Odabrani termin</p>
                  <p className="text-2xl font-bold text-gray-900">{formatVrijeme(selectedTermin.vrijeme)}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedTermin.datum).toLocaleDateString("hr-HR", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                </div>
                {countdown !== null && (
                <div className={`flex items-center justify-between px-4 py-3 rounded-lg mb-4 ${
                    countdown <= 30 ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"
                    }`}>
                    <p className={`text-sm font-semibold ${countdown <= 30 ? "text-red-700" : "text-amber-700"}`}>
                    Imate {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")} za unos podataka
                  </p>
                  <div className={`w-3 h-3 rounded-full animate-pulse ${countdown <= 30 ? "bg-red-500" : "bg-amber-500"}`} />
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="font-bold text-gray-900 mb-4">Podaci pacijenta</h3>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ime</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={form.ime}
                        onChange={e => { setForm(f => ({ ...f, ime: e.target.value })); setErrors(err => ({ ...err, ime: undefined })); }}
                        placeholder="Vaše ime"
                        className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm transition-all ${errors.ime ? "border-red-400 bg-red-50" : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"}`}
                      />
                    </div>
                    {errors.ime && <p className="text-red-500 text-xs mt-1">{errors.ime}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Prezime</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={form.prezime}
                        onChange={e => { setForm(f => ({ ...f, prezime: e.target.value })); setErrors(err => ({ ...err, prezime: undefined })); }}
                        placeholder="Vaše prezime"
                        className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm transition-all ${errors.prezime ? "border-red-400 bg-red-50" : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"}`}
                      />
                    </div>
                    {errors.prezime && <p className="text-red-500 text-xs mt-1">{errors.prezime}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email adresa</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(err => ({ ...err, email: undefined })); }}
                        placeholder="email@primjer.ba"
                        className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm transition-all ${errors.email ? "border-red-400 bg-red-50" : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"}`}
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div className="pt-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Komentar (opciono)</label>
                    <textarea
                      value={form.komentar}
                      onChange={handleCommentChange}
                      placeholder="Napišite dodatne informacije ili pitanja..."
                      className={`w-full px-3 py-2 border rounded-lg text-sm transition-all resize-none ${errors.komentar ? "border-red-400 bg-red-50" : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"}`}
                      rows={4}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className={`text-xs ${charCount > 230 ? "text-orange-500" : "text-gray-400"}`}>{charCount} / 255 karaktera</p>
                      {errors.komentar && <p className="text-red-500 text-xs">{errors.komentar}</p>}
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Priložite PDF nalaze (opciono)</label>
                    <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <Upload size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {form.pdfFile ? form.pdfFile.name : "Kliknite za upload PDF datoteke"}
                      </span>
                      <input type="file" accept="application/pdf" onChange={handlePdfChange} className="hidden" />
                    </label>
                    {form.pdfFile && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                        <FileText size={14} />{form.pdfFile.name}
                      </div>
                    )}
                    {errors.pdfFile && <p className="text-red-500 text-xs mt-1">{errors.pdfFile}</p>}
                  </div>

                  <button type="submit" className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md mt-6">
                    Potvrdi
                  </button>
                </form>
            

                <button onClick={async () => {
  if (selectedTermin) {
    const apiUrl = import.meta.env.VITE_API_URL;
    await fetch(`${apiUrl}/api/termini/${selectedTermin.id}/oslobodi`, { method: "POST" });
  }
  setSelectedTermin(null);
}} className="w-full py-2 text-gray-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors mt-2">
                  Odustani
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center sticky top-6">
                <p className="text-gray-600 font-semibold">Kliknite na vrijeme</p>
                <p className="text-sm text-gray-500 mt-2">Odaberite termin iz kalendara</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 justify-between mt-10">
          <button onClick={handleBack} className="px-6 py-3 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
            <ChevronLeft size={20} /> Nazad
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default Step4Termini;