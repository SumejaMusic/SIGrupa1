import { useEffect, useState } from "react";
import { CheckCircle, Calendar, Clock, User, Mail, Home, FileText } from "lucide-react";
import Layout from "../components/Layout";

type PatientForm = {
  ime: string;
  prezime: string;
  email: string;
};

type Termin = {
  id: number;
  datum: string;
  vrijeme: number;
  status: string;
};

function Step5Confirmation() {
  const [patientData, setPatientData] = useState<PatientForm | null>(null);
  const [selectedTermin, setSelectedTermin] = useState<Termin | null>(null);

  const termini: Termin[] = [
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
  ];

  useEffect(() => {
    const patient = localStorage.getItem("patientData");
    const terminId = localStorage.getItem("selectedTermin");

    if (patient) {
      setPatientData(JSON.parse(patient));
    }

    if (terminId) {
      const termin = termini.find((t) => t.id === parseInt(terminId));
      if (termin) {
        setSelectedTermin(termin);
      }
    }
  }, []);

  const formatVrijeme = (minute: number): string => {
    const sati = Math.floor(minute / 60).toString().padStart(2, "0");
    const min = (minute % 60).toString().padStart(2, "0");
    return `${sati}:${min}`;
  };

  const formatDate = (datum: string) => {
    return new Date(datum + "T00:00:00").toLocaleDateString("hr-HR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const goToHome = () => {
    localStorage.removeItem("patientData");
    localStorage.removeItem("selectedTermin");
    window.location.href = "/";
  };

  const goToReservations = () => {
    window.location.href = "/moje-rezervacije";
  };

  return (
    <Layout step={5} totalSteps={5} breadcrumbs={["1. Izbor Odjela", "2. Izbor Doktora", "3. Termini", "4. Podaci", "5. Potvrda"]}>
      <div className="max-w-2xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={48} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Termin zakazan!</h1>
          <p className="text-gray-600 text-lg">Detalji vaše rezervacije</p>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
            <h2 className="text-2xl font-bold mb-1">Vaša rezervacija</h2>
            <p className="text-blue-100">Konfigurisano i spremno za pregled</p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Termin */}
            {selectedTermin && (
              <div className="flex gap-4 items-start pb-6 border-b border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Datum</p>
                  <p className="text-xl font-bold text-gray-900">{formatDate(selectedTermin.datum)}</p>
                </div>
              </div>
            )}

            {/* Vrijeme */}
            {selectedTermin && (
              <div className="flex gap-4 items-start pb-6 border-b border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Vrijeme</p>
                  <p className="text-xl font-bold text-gray-900">{formatVrijeme(selectedTermin.vrijeme)} sati</p>
                </div>
              </div>
            )}

            {/* Pacijent - Ime i Prezime */}
            {patientData && (
              <div className="flex gap-4 items-start pb-6 border-b border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Pacijent</p>
                  <p className="text-xl font-bold text-gray-900">
                    {patientData.ime} {patientData.prezime}
                  </p>
                </div>
              </div>
            )}

            {/* Email */}
            {patientData && (
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Email</p>
                  <p className="text-lg font-semibold text-gray-900">{patientData.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="bg-blue-50 px-8 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Potvrda je poslana na vašu email adresu. Molimo da dodjete 10 minuta prije zakazanog vremena.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={goToReservations}
            className="flex-1 py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <FileText size={20} />
            Moje Rezervacije
          </button>
          <button
            onClick={goToHome}
            className="flex-1 py-3 px-6 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Početna Stranica
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default Step5Confirmation;
