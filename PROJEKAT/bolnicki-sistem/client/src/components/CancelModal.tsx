import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";

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
    status: "SLOBODAN" | "ZAKAZAN" | "POTVRDJEN" | "OTKAZAN";
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
  };
}

interface Props {
  appointment: Appointment;
  onConfirm: () => Promise<void> | void;
  onCancelConfirm: () => Promise<void> | void;
  onClose: () => void;
}

const formatIntTime = (time: number): string => {
  const hours = Math.floor(time / 60);
  const minutes = time % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export default function CancelModal({ appointment: apt, onConfirm, onCancelConfirm, onClose }: Props) {
  const [mode, setMode] = useState<"otkazi" | "pomjeri">("otkazi");
  const [datumi, setDatumi] = useState<string[]>([]);
  const [termini, setTermini] = useState<any[]>([]);
  const [odabraniDatum, setOdabraniDatum] = useState("");
  const [noviTerminId, setNoviTerminId] = useState<number | null>(null);

  const token = localStorage.getItem("token");
  const formattedDate = apt.termin.datum.split("T")[0];

  useEffect(() => {
    if (mode !== "pomjeri") return;

    fetch(apiUrl(`/api/osoblje/termini/slobodni-datumi/${apt.doktor.id}`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setDatumi)
      .catch(console.error);
  }, [mode, apt.doktor.id, token]);

  const ucitajTermineZaDatum = async (datum: string) => {
    setOdabraniDatum(datum);
    setNoviTerminId(null);
    setTermini([]);

    if (!datum) return;

    const res = await fetch(
      apiUrl(`/api/osoblje/termini/slobodni/${apt.doktor.id}?datum=${datum}`),
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();
    setTermini(data);
  };

  const otvoriPomjeranje = () => {
    setMode("pomjeri");
    setOdabraniDatum("");
    setNoviTerminId(null);
    setTermini([]);
  };

  const potvrdiPomjeranje = async () => {
    if (!noviTerminId) return;

    const res = await fetch(apiUrl(`/api/osoblje/termini/${apt.id}/pomjeri`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ noviTerminId }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.poruka ?? "Greška pri pomjeranju termina.");
      return;
    }

    await onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                mode === "otkazi" ? "bg-red-100" : "bg-blue-100"
              }`}
            >
              <AlertTriangle size={24} className={mode === "otkazi" ? "text-red-600" : "text-blue-600"} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                {mode === "otkazi" ? "Otkazivanje termina" : "Pomjeranje termina"}
              </h2>
              <p className="text-sm text-gray-500">
                {mode === "otkazi"
                  ? "Pacijent će biti obaviješten emailom da je termin otkazan."
                  : "Izaberite novi slobodan termin kod istog doktora. Pacijent će biti obaviješten emailom."}
              </p>
            </div>

            <button
              onClick={onClose}
              className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-5 bg-gray-50 rounded-xl p-4 space-y-2">
            <DetailRow label="Pacijent" value={`${apt.pacijent.korisnik.ime} ${apt.pacijent.korisnik.prezime}`} />
            <DetailRow label="Doktor" value={`Dr. ${apt.doktor.korisnik.ime} ${apt.doktor.korisnik.prezime}`} />
            <DetailRow label="Trenutni termin" value={`${formattedDate} u ${formatIntTime(apt.termin.vrijeme)}`} />
            <DetailRow label="Odjel" value={apt.doktor.odjel.naziv} />
            <DetailRow label="Vrsta pregleda" value={apt.tipPregleda?.naziv ?? "Opšti pregled"} />
          </div>

          {mode === "pomjeri" && (
            <div className="mt-4 space-y-3">
              <select
                id="move-appointment-date"
                name="moveAppointmentDate"
                aria-label="Izaberi novi datum termina"
                value={odabraniDatum}
                onChange={(e) => ucitajTermineZaDatum(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              >
                <option value="">Izaberi novi datum</option>
                {datumi.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {odabraniDatum && termini.length === 0 && (
                <p className="text-xs text-gray-500">Nema slobodnih termina za odabrani datum.</p>
              )}

              {termini.length > 0 && (
                <select
                  id="move-appointment-time"
                  name="moveAppointmentTime"
                  aria-label="Izaberi novi termin"
                  value={noviTerminId ?? ""}
                  onChange={(e) => setNoviTerminId(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="">Izaberi novi termin</option>
                  {termini.map((t) => (
                    <option key={t.id} value={t.id}>
                      {formatIntTime(t.vrijeme)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-700">
              <span className="font-semibold">Napomena:</span>{" "}
              {mode === "otkazi"
                ? `Email obavijest će biti poslana pacijentu na adresu ${apt.pacijent.korisnik.email}.`
                : `Email sa novim terminom će biti poslan pacijentu na adresu ${apt.pacijent.korisnik.email}.`}
            </p>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Zatvori
          </button>

          {mode === "otkazi" ? (
            <>
              <button
                onClick={onCancelConfirm}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                Da, otkaži
              </button>

              <button
                onClick={otvoriPomjeranje}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                Pomjeri termin
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setMode("otkazi")}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Nazad
              </button>

              <button
                onClick={potvrdiPomjeranje}
                disabled={!noviTerminId}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Potvrdi pomjeranje
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}
