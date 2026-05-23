import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  DoorOpen,
  Loader2,
  RefreshCw,
  Search,
  Stethoscope,
  UserPlus,
  X,
} from "lucide-react";

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

interface TipPregleda {
  id: number;
  naziv: string;
}

interface SazetakDoktora {
  id: number;
  ime: string;
  prezime: string;
  specijalizacija: string;
  odjel: {
    id: number;
    naziv: string;
  } | null;
}

interface SazetakTermina {
  id: number;
  terminId: number;
  doktor: SazetakDoktora;
  pacijent: {
    ime: string;
    prezime: string;
  } | null;
  tipPregleda: string | null;
  hitnost: boolean;
  vrijeme: number;
  vrijemeTekst: string;
  krajVrijeme: number;
  krajVrijemeTekst: string;
}

interface SlobodanTermin {
  id: number;
  doktorId: number;
  doktor: SazetakDoktora;
  vrijeme: number;
  vrijemeTekst: string;
}

type StatusPrikazaSobe = "SLOBODAN" | "ZAUZET" | "USKORO_ZAUZET";

interface ZauzetostSobe {
  id: number;
  naziv: string;
  tip: string;
  sprat: number;
  status: StatusPrikazaSobe;
  activeDoctor: SazetakDoktora | null;
  currentAppointment: SazetakTermina | null;
  nextAppointment: SazetakTermina | null;
  availableTerms: SlobodanTermin[];
  canAssignEmergency: boolean;
}

interface OdgovorZauzetosti {
  date: string;
  generatedAt: string;
  refreshIntervalSeconds: number;
  rooms: ZauzetostSobe[];
}

interface Props {
  allPatients: Pacijent[];
  tipoviPregleda: TipPregleda[];
  onEmergencyAssigned: () => Promise<void> | void;
  onNotify: (message: string) => void;
}

const statusConfig: Record<StatusPrikazaSobe, {
  label: string;
  badge: string;
  block: string;
  dot: string;
  icon: typeof DoorOpen;
}> = {
  SLOBODAN: {
    label: "Slobodan",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    block: "border-emerald-200 bg-emerald-50/70 hover:border-emerald-300 hover:bg-emerald-50",
    dot: "bg-emerald-500",
    icon: DoorOpen,
  },
  ZAUZET: {
    label: "Zauzet",
    badge: "bg-red-100 text-red-700 border-red-200",
    block: "border-red-200 bg-red-50/70",
    dot: "bg-red-500",
    icon: AlertTriangle,
  },
  USKORO_ZAUZET: {
    label: "Uskoro zauzet",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    block: "border-amber-200 bg-amber-50/80",
    dot: "bg-amber-500",
    icon: Clock,
  },
};

const formatDate = (value: string) => {
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}.`;
};

const getToken = () => localStorage.getItem("token") ?? "";

const prikazIdentifikatoraPacijenta = (patient: Pacijent) => {
  const brojKnjizice = patient.brojKnjizice?.trim();

  if (brojKnjizice && brojKnjizice.length <= 20 && !brojKnjizice.includes(":")) {
    return `Knjižica: ${brojKnjizice}`;
  }

  return `ID pacijenta: ${patient.id}`;
};

export default function SekcijaZauzetostiKabineta({
  allPatients,
  tipoviPregleda,
  onEmergencyAssigned,
  onNotify,
}: Props) {
  const [occupancy, setOccupancy] = useState<OdgovorZauzetosti | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<ZauzetostSobe | null>(null);

  const fetchOccupancy = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/rooms/occupancy?date=today", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.poruka ?? "Greška pri učitavanju zauzetosti kabineta.");
      }

      setOccupancy(await res.json());
    } catch (err: any) {
      onNotify(err.message ?? "Greška pri učitavanju zauzetosti kabineta.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onNotify]);

  useEffect(() => {
    fetchOccupancy();
    const intervalId = window.setInterval(() => fetchOccupancy(true), 60_000);

    return () => window.clearInterval(intervalId);
  }, [fetchOccupancy]);

  const stats = useMemo(() => {
    const rooms = occupancy?.rooms ?? [];

    return {
      total: rooms.length,
      free: rooms.filter((room) => room.status === "SLOBODAN").length,
      occupied: rooms.filter((room) => room.status === "ZAUZET").length,
      soon: rooms.filter((room) => room.status === "USKORO_ZAUZET").length,
    };
  }, [occupancy]);

  const refreshAfterAssignment = async () => {
    await fetchOccupancy(true);
    await onEmergencyAssigned();
  };

  return (
    <section className="p-6 pb-0">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Building2 size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900">Zauzetost kabineta</h2>
              <p className="text-xs text-gray-500">
                {occupancy ? `Tekući dan: ${formatDate(occupancy.date)}` : "Tekući dan"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatistikaZauzetosti label="Ukupno" value={stats.total} className="text-gray-700 bg-gray-100" />
            <StatistikaZauzetosti label="Slobodno" value={stats.free} className="text-emerald-700 bg-emerald-100" />
            <StatistikaZauzetosti label="Zauzeto" value={stats.occupied} className="text-red-700 bg-red-100" />
            <StatistikaZauzetosti label="Uskoro" value={stats.soon} className="text-amber-700 bg-amber-100" />
            <button
              type="button"
              onClick={() => fetchOccupancy(true)}
              className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
              title="Osvježi prikaz"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center text-sm text-gray-500 gap-2">
            <Loader2 size={17} className="animate-spin" />
            Učitavanje zauzetosti kabineta...
          </div>
        ) : occupancy?.rooms.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Nema aktivnih kabineta za prikaz.
          </div>
        ) : (
          <div className="p-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {occupancy?.rooms.map((room) => (
              <KarticaSobe
                key={room.id}
                room={room}
                onAssign={() => setSelectedRoom(room)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedRoom && (
        <ModalDodjeleHitnogSlucaja
          room={selectedRoom}
          allPatients={allPatients}
          tipoviPregleda={tipoviPregleda}
          onClose={() => setSelectedRoom(null)}
          onAssigned={async () => {
            setSelectedRoom(null);
            onNotify(`Hitni slučaj dodijeljen u ${selectedRoom.naziv}.`);
            await refreshAfterAssignment();
          }}
        />
      )}
    </section>
  );
}

function StatistikaZauzetosti({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${className}`}>
      {label}: {value}
    </div>
  );
}

function KarticaSobe({ room, onAssign }: { room: ZauzetostSobe; onAssign: () => void }) {
  const config = statusConfig[room.status];
  const StatusIcon = config.icon;
  const isAssignable = room.canAssignEmergency;

  return (
    <button
      type="button"
      onClick={() => {
        if (isAssignable) onAssign();
      }}
      disabled={!isAssignable}
      className={`text-left rounded-2xl border p-4 min-h-[230px] flex flex-col gap-3 transition-all ${config.block} ${
        isAssignable ? "cursor-pointer hover:shadow-md" : "cursor-default"
      }`}
      title={isAssignable ? "Dodijeli hitni slučaj" : config.label}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full ${config.dot} flex-shrink-0`} />
            <h3 className="text-sm font-bold text-gray-900 truncate">{room.naziv}</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">Sprat {room.sprat} · {room.tip.toLowerCase()}</p>
        </div>
        <span className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${config.badge} flex items-center gap-1 whitespace-nowrap`}>
          <StatusIcon size={12} />
          {config.label}
        </span>
      </div>

      <div className="rounded-xl bg-white/80 border border-white px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Stethoscope size={13} />
          Aktivan doktor
        </div>
        <p className="text-sm font-semibold text-gray-900 truncate mt-1">
          {room.activeDoctor
            ? `Dr. ${room.activeDoctor.ime} ${room.activeDoctor.prezime}`
            : "Nema dodijeljenog doktora"}
        </p>
        {room.activeDoctor?.odjel && (
          <p className="text-xs text-gray-500 truncate">{room.activeDoctor.odjel.naziv}</p>
        )}
      </div>

      <LinijaTerminaSobe
        label="Termin u toku"
        appointment={room.currentAppointment}
        emptyLabel="Nema termina u toku"
      />

      <LinijaTerminaSobe
        label="Sljedeći termin"
        appointment={room.nextAppointment}
        emptyLabel="Nema sljedećeg termina"
      />

      <div className="mt-auto pt-1">
        {isAssignable ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
            <UserPlus size={13} />
            Dodijeli hitni slučaj
          </span>
        ) : (
          <span className="text-xs text-gray-400">
            Brza dodjela trenutno nije dostupna
          </span>
        )}
      </div>
    </button>
  );
}

function LinijaTerminaSobe({
  label,
  appointment,
  emptyLabel,
}: {
  label: string;
  appointment: SazetakTermina | null;
  emptyLabel: string;
}) {
  return (
    <div className="text-xs">
      <p className="font-semibold text-gray-500">{label}</p>
      {appointment ? (
        <div className="mt-1 text-gray-800">
          <p className="font-bold">
            {appointment.vrijemeTekst}-{appointment.krajVrijemeTekst}
            {appointment.hitnost && <span className="ml-2 text-red-600">Hitno</span>}
          </p>
          <p className="truncate text-gray-500">
            {appointment.pacijent
              ? `${appointment.pacijent.ime} ${appointment.pacijent.prezime}`
              : appointment.tipPregleda ?? "Pregled"}
          </p>
        </div>
      ) : (
        <p className="mt-1 text-gray-400">{emptyLabel}</p>
      )}
    </div>
  );
}

function ModalDodjeleHitnogSlucaja({
  room,
  allPatients,
  tipoviPregleda,
  onClose,
  onAssigned,
}: {
  room: ZauzetostSobe;
  allPatients: Pacijent[];
  tipoviPregleda: TipPregleda[];
  onClose: () => void;
  onAssigned: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Pacijent | null>(null);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(room.availableTerms[0]?.id ?? null);
  const [comment, setComment] = useState("Hitni slučaj");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTerm = room.availableTerms.find((term) => term.id === selectedTermId) ?? null;
  const hitniPregled = tipoviPregleda.find((tip) => tip.naziv.toLowerCase().includes("hitni"));

  const filteredPatients = allPatients.filter((patient) => {
    const query = search.trim().toLowerCase();
    if (query.length < 2) return false;

    return `${patient.korisnik.ime} ${patient.korisnik.prezime}`.toLowerCase().includes(query);
  });

  const handleAssign = async () => {
    if (!selectedPatient || !selectedTerm) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/osoblje/termini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          idTermina: selectedTerm.id,
          idDoktor: selectedTerm.doktorId,
          idPacijent: selectedPatient.korisnik.id,
          idTipPregleda: hitniPregled?.id,
          komentar: comment.trim() || "Hitni slučaj",
          hitnost: true,
        }),
      });

      if (!res.ok) {
        const response = await res.json().catch(() => ({}));
        throw new Error(response.poruka ?? "Dodjela hitnog slučaja nije uspjela.");
      }

      await onAssigned();
    } catch (err: any) {
      setError(err.message ?? "Dodjela hitnog slučaja nije uspjela.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900">Dodjela hitnog slučaja</h3>
            <p className="text-xs text-gray-500 mt-1 truncate">
              {room.naziv}
              {selectedTerm ? ` · ${selectedTerm.vrijemeTekst} · Dr. ${selectedTerm.doktor.ime} ${selectedTerm.doktor.prezime}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
            title="Zatvori"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Pacijent</label>
              {selectedPatient ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-emerald-900 truncate">
                      {selectedPatient.korisnik.ime} {selectedPatient.korisnik.prezime}
                    </p>
                    <p className="text-xs text-emerald-700 truncate">{prikazIdentifikatoraPacijenta(selectedPatient)}</p>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-bold text-emerald-700"
                    onClick={() => {
                      setSelectedPatient(null);
                      setSearch("");
                    }}
                  >
                    Promijeni
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Pretraži pacijenta..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  {search.trim().length >= 2 && (
                    <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-gray-200">
                      {filteredPatients.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-gray-400">Nema pacijenata za pretragu.</div>
                      ) : (
                        filteredPatients.map((patient) => (
                          <button
                            key={patient.id}
                            type="button"
                            className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b border-gray-100 last:border-0"
                            onClick={() => setSelectedPatient(patient)}
                          >
                            <p className="text-sm font-semibold text-gray-800">
                              {patient.korisnik.ime} {patient.korisnik.prezime}
                            </p>
                            <p className="text-xs text-gray-500">{prikazIdentifikatoraPacijenta(patient)}</p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Napomena</label>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-gray-200 text-sm px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Slobodni termini danas</label>
            {room.availableTerms.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Nema slobodnih termina za brzu dodjelu.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {room.availableTerms.map((term) => {
                  const selected = selectedTermId === term.id;

                  return (
                    <button
                      key={term.id}
                      type="button"
                      onClick={() => setSelectedTermId(term.id)}
                      className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                        selected
                          ? "border-blue-500 bg-blue-50 text-blue-800"
                          : "border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50/60"
                      }`}
                    >
                      <p className="text-sm font-bold">{term.vrijemeTekst}</p>
                      <p className="text-xs truncate">Dr. {term.doktor.ime} {term.doktor.prezime}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {hitniPregled && (
              <div className="mt-3 rounded-xl bg-red-50 border border-red-100 px-3 py-2 flex items-center gap-2 text-xs font-semibold text-red-700">
                <CheckCircle2 size={14} />
                Tip pregleda: {hitniPregled.naziv}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mx-5 mb-3 rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Odustani
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={!selectedPatient || !selectedTerm || submitting}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:bg-red-200 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
            Dodijeli hitno
          </button>
        </div>
      </div>
    </div>
  );
}
