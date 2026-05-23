import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, User, Calendar, MapPin, X, FileText, MessageSquare, ExternalLink, Star, CheckCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { handleExpiredSession } from "../utils/auth";
import { Home, Calendar as CalendarIcon, Stethoscope, LogOut, Menu } from "lucide-react";

interface Komentar {
  id: number;
  tekst: string;
  autor: string;
  datum: string;
  jeDoktor: boolean;
}

interface Nalaz {
  id: number;
  naziv: string;
  datum: string;
  url: string;
}

interface OcjenaDoktora {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  hidden?: boolean;
}

interface Rezervacija {
  id: number;
  datum: string;
  vrijeme: number;
  doktor: string;
  tip: "hitni" | "preventivni" | "kontrolni";
  komentar?: string;
  soba: string;
  komentari: Komentar[];
  nalazi: Nalaz[];
  zavrseno: boolean;
  review?: OcjenaDoktora | null;
}

// ✅ Parsira ISO datum string kao čisti UTC YYYY-MM-DD
// Sprječava timezone bug gdje "2026-05-15T00:00:00.000Z" postaje "2026-05-14" u lokalnom vremenu
const isoUTCdatum = (isoStr: string): string => {
  const d = new Date(isoStr);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dan = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dan}`;
};

// ✅ Formatira datum za prikaz korisniku u dd/mm/yyyy formatu
const formatDatumPrikaz = (datumStr: string): string => {
  if (!datumStr) return '';
  const isoDate = datumStr.length > 10 ? isoUTCdatum(datumStr) : datumStr;
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
};

// ✅ Danas u UTC formatu
const danasUTC = (): string => {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dan = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dan}`;
};

const mapirajKomentar = (k: any): Komentar => ({
  id: k.id,
  tekst: k.tekst,
  autor: k.autor ?? (k.jeDoktor
    ? (k.korisnik ? `${k.korisnik.ime} ${k.korisnik.prezime}` : "Doktor")
    : "Vi"),
  datum: k.datum ?? isoUTCdatum(k.datumKreiranja ?? new Date().toISOString()),
  jeDoktor: Boolean(k.jeDoktor),
});

const ratingColor = (rating: number) => {
  if (rating <= 1) return "text-red-600";
  if (rating === 2) return "text-orange-500";
  if (rating === 3) return "text-yellow-500";
  if (rating === 4) return "text-lime-600";
  return "text-green-600";
};

const ratingBg = (rating: number) => {
  if (rating <= 1) return "bg-red-50 border-red-200 text-red-700";
  if (rating === 2) return "bg-orange-50 border-orange-200 text-orange-700";
  if (rating === 3) return "bg-yellow-50 border-yellow-200 text-yellow-700";
  if (rating === 4) return "bg-lime-50 border-lime-200 text-lime-700";
  return "bg-green-50 border-green-200 text-green-700";
};

// ─── Sidebar ───────────────────────────────────────────────────────────────
function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();
  const menuItems = [
    { icon: Home, label: "Naslovna", href: "/" },
    { icon: CalendarIcon, label: "Moje Rezervacije", href: "/moje-rezervacije" },
    { icon: Stethoscope, label: "Odjeli", href: "/step1-odjeli" },
    { icon: User, label: "Profil", href: "#" },
  ];

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col fixed h-screen z-50 transition-all duration-300 ${open ? "w-64" : "w-0 overflow-hidden border-r-0"}`}>
      <div className="p-6 flex flex-col h-full">
        <Link to="/" className="flex items-center gap-2 mb-8 whitespace-nowrap">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            SM
          </div>
          <span className="text-xl font-bold tracking-tight text-blue-900">SwiftMed</span>
        </Link>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${isActive ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <Icon size={20} className="flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium whitespace-nowrap">
            <LogOut size={18} className="flex-shrink-0" />
            Odjava
          </button>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalOcjenaDoktora({ rez, onClose, onSubmit }: {
  rez: Rezervacija;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<OcjenaDoktora | null>;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      setGreska("Ocjena je obavezna i mora biti od 1 do 5.");
      return;
    }

    if (comment.length > 500) {
      setGreska("Komentar ne smije imati više od 500 znakova.");
      return;
    }

    setLoading(true);
    setGreska(null);
    const review = await onSubmit(rating, comment.trim());
    setLoading(false);

    if (review) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Anonimna ocjena doktora</h3>
            <p className="text-xs text-gray-500">{rez.doktor} · {formatDatumPrikaz(rez.datum)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
            Ocjena je anonimna. Doktor neće vidjeti Vaše ime, prezime, email ili ID.
          </div>

          {greska && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {greska}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block uppercase tracking-wide" style={{ fontSize: "10px" }}>
              Ocjena <span className="text-red-500 normal-case">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all ${
                    rating >= value
                      ? `${ratingBg(rating)} shadow-sm`
                      : "bg-gray-50 border-gray-200 text-gray-300 hover:bg-gray-100"
                  }`}
                  aria-label={`Ocjena ${value}`}
                >
                  <Star size={22} className={rating >= value ? ratingColor(rating) : "text-gray-300"} fill={rating >= value ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block uppercase tracking-wide" style={{ fontSize: "10px" }}>
              Komentar <span className="text-gray-400 font-normal normal-case">(opcionalno)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => {
                const value = e.target.value.slice(0, 500);
                setComment(value);
                if (greska) setGreska(null);
              }}
              placeholder="Kratko opišite iskustvo..."
              rows={4}
              className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-gray-50 transition-all"
            />
            <div className={`text-xs mt-1 text-right ${comment.length >= 500 ? "text-red-500" : "text-gray-400"}`}>
              {comment.length}/500
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-2 bg-gray-50/60">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-white transition-colors disabled:opacity-50"
          >
            Odustani
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              rating > 0 && !loading
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Star size={15} fill={rating > 0 ? "currentColor" : "none"} />
            {loading ? "Slanje..." : "Pošalji ocjenu"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Detalji ─────────────────────────────────────────────────────────
function DetaljiModal({ rez, onClose, onCancel, apiUrl, onReviewSubmit }: {
  rez: Rezervacija;
  onClose: () => void;
  onCancel: (id: number) => void;
  apiUrl: string;
  onReviewSubmit: (id: number, rating: number, comment: string) => Promise<OcjenaDoktora | null>;
}) {
  const [tab, setTab] = useState<"info" | "komentari" | "nalazi">("info");
  const [nalazi, setNalazi] = useState<Nalaz[]>([]);
  const [komentari, setKomentari] = useState<Komentar[]>(rez.komentari ?? []);
  const [loadingNalazi, setLoadingNalazi] = useState(false);
  const [noviKomentar, setNoviKomentar] = useState("");
  const [saljemo, setSaljemo] = useState(false);
  const [review, setReview] = useState<OcjenaDoktora | null>(rez.review ?? null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const getToken = () => localStorage.getItem("token");

  const tipStyle = {
    hitni: { dot: "bg-red-500", text: "text-red-600", label: "Hitni" },
    preventivni: { dot: "bg-green-500", text: "text-green-600", label: "Preventivni" },
    kontrolni: { dot: "bg-blue-500", text: "text-blue-600", label: "Kontrolni" },
  };

  const formatV = (v: number) => {
    const h = Math.floor(v / 60);
    const m = v % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (tab !== "nalazi") return;
    setLoadingNalazi(true);
    fetch(`${apiUrl}/api/nalazi/rezervacija/${rez.id}`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNalazi(data.map((n: any) => ({
            id: n.id,
            naziv: n.naziv,
            // ✅ UTC parsing datuma nalaza
            datum: isoUTCdatum(n.vrijemeNalaza),
            url: `${apiUrl}/api/nalazi/${n.id}/pdf`,
          })));
        } else {
          setNalazi([]);
        }
      })
      .catch(() => setNalazi([]))
      .finally(() => setLoadingNalazi(false));
  }, [tab, rez.id]);

  useEffect(() => {
    if (tab !== "komentari") return;
    fetch(`${apiUrl}/api/rezervacije/${rez.id}/komentari`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setKomentari(data);
      })
      .catch(() => {});
  }, [tab, rez.id]);

  const handleSendKomentar = async () => {
    if (!noviKomentar.trim()) return;
    setSaljemo(true);
    try {
      const res = await fetch(`${apiUrl}/api/rezervacije/${rez.id}/komentar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({ komentar: noviKomentar.trim() }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setKomentari(prev => [...prev, {
        id: data.id ?? Date.now(),
        tekst: data.tekst ?? noviKomentar.trim(),
        autor: data.autor ?? "Vi",
        datum: data.datum ?? danasUTC(),
        jeDoktor: data.jeDoktor ?? false,
      }]);
      setNoviKomentar("");
    } catch {
      alert("Greška pri slanju komentara.");
    } finally {
      setSaljemo(false);
    }
  };

  const tabs = [
    { id: "info" as const, label: "Informacije", icon: User },
    { id: "komentari" as const, label: "Komentari", icon: MessageSquare },
    { id: "nalazi" as const, label: "Nalazi", icon: FileText },
  ];

  const borderColor = rez.tip === "hitni" ? "border-red-500" : rez.tip === "preventivni" ? "border-green-500" : "border-blue-500";
  const mozeOcijeniti = rez.zavrseno && !review;

  const handleSubmitReview = async (rating: number, comment: string) => {
    const novaOcjena = await onReviewSubmit(rez.id, rating, comment);
    if (novaOcjena) {
      setReview(novaOcjena);
    }
    return novaOcjena;
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-t-4 ${borderColor}`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Detalji rezervacije</h3>
            <p className="text-xs text-gray-500">{formatDatumPrikaz(rez.datum)} · {formatV(rez.vrijeme)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Tabovi */}
        <div className="flex border-b border-gray-100">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors ${tab === t.id ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {/* Sadržaj */}
        <div className="p-5 max-h-96 overflow-y-auto">

          {/* INFO TAB */}
          {tab === "info" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><Clock size={11} /> Vrijeme</div>
                  <div className="text-sm font-bold text-gray-900">{formatV(rez.vrijeme)}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><CalendarIcon size={11} /> Datum</div>
                  <div className="text-sm font-bold text-gray-900">{formatDatumPrikaz(rez.datum)}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><User size={11} /> Doktor</div>
                  <div className="text-sm font-bold text-gray-900">{rez.doktor}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><MapPin size={11} /> Soba</div>
                  <div className="text-sm font-bold text-gray-900">{rez.soba || "—"}</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${tipStyle[rez.tip].dot}`} /> Tip pregleda
                </div>
                <div className={`text-sm font-bold ${tipStyle[rez.tip].text}`}>{tipStyle[rez.tip].label}</div>
              </div>
              {rez.komentar && (
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <div className="text-xs text-blue-500 mb-1 font-semibold">Vaš komentar pri rezervaciji</div>
                  <p className="text-sm text-gray-700 leading-relaxed">{rez.komentar}</p>
                </div>
              )}
              {rez.zavrseno && (
                <div className={`rounded-xl p-3 border ${review ? ratingBg(review.rating) : "bg-green-50 border-green-100 text-green-800"}`}>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {review ? (
                      <>
                        <Star size={16} fill="currentColor" /> Vaša anonimna ocjena: {review.rating}/5
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} /> Pregled je završen, možete anonimno ocijeniti doktora.
                      </>
                    )}
                  </div>
                  {review?.comment && (
                    <p className="text-sm mt-2 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* KOMENTARI TAB */}
          {tab === "komentari" && (
            <div className="flex flex-col gap-3">
              {komentari.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Nema komentara za ovaj termin</p>
                </div>
              ) : (
                komentari.map(k => (
                  <div key={k.id} className={`rounded-xl p-3 ${k.jeDoktor ? "bg-blue-50 border border-blue-100" : "bg-gray-50 border border-gray-100"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold ${k.jeDoktor ? "text-blue-700" : "text-gray-700"}`}>
                        {k.jeDoktor ? "🩺 " : "👤 "}{k.autor}
                      </span>
                      <span className="text-xs text-gray-400">{formatDatumPrikaz(k.datum)}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{k.tekst}</p>
                  </div>
                ))
              )}
              <div className="border-t border-gray-100 pt-3 mt-1">
                <textarea
                  value={noviKomentar}
                  onChange={e => setNoviKomentar(e.target.value)}
                  placeholder="Napišite poruku doktoru..."
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none outline-none focus:border-blue-400 bg-gray-50"
                />
                <button
                  onClick={handleSendKomentar}
                  disabled={!noviKomentar.trim() || saljemo}
                  className={`mt-2 w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${noviKomentar.trim() && !saljemo ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                >
                  {saljemo ? "Slanje..." : "Pošalji"}
                </button>
              </div>
            </div>
          )}

          {/* NALAZI TAB */}
          {tab === "nalazi" && (
            <div className="space-y-2">
              {loadingNalazi ? (
                <div className="text-center py-8 text-sm text-gray-400">Učitavanje nalaza...</div>
              ) : nalazi.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Nema priloženih nalaza</p>
                </div>
              ) : (
                nalazi.map(n => (
                  <a
                    key={n.id}
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">{n.naziv}</div>
                      <div className="text-xs text-gray-400">{formatDatumPrikaz(n.datum)}</div>
                    </div>
                    <ExternalLink size={14} className="text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                  </a>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
          {!rez.zavrseno && (
            <button
              onClick={() => onCancel(rez.id)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Otkaži termin
            </button>
          )}
          {mozeOcijeniti && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Star size={15} /> Ocijeni doktora
            </button>
          )}
          {review && (
            <div className={`flex-1 py-2.5 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 ${ratingBg(review.rating)}`}>
              <Star size={15} fill="currentColor" /> Ocijenjeno {review.rating}/5
            </div>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Zatvori
          </button>
        </div>
      </div>
      {showReviewModal && (
        <ModalOcjenaDoktora
          rez={rez}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleSubmitReview}
        />
      )}
    </div>
  );
}

// ─── Glavni komponent ───────────────────────────────────────────────────────
const MojeRezervacije = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(danasUTC());
  const [detaljiRez, setDetaljiRez] = useState<Rezervacija | null>(null);
  const [rezervacije, setRezervacije] = useState<Rezervacija[]>([]);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem("token");

    fetch(`${apiUrl}/api/rezervacije/moje`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
      .then(res => {
        if (res.status === 401) { handleExpiredSession(); return null; }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        const mapirano = data.map((r: any) => ({
          id: r.id,
          // ✅ UTC parsing — sprječava da "2026-05-15T00:00:00.000Z" postane "2026-05-14"
          datum: isoUTCdatum(r.termin.datum),
          vrijeme: r.termin.vrijeme,
          doktor: `Dr. ${r.doktor.korisnik.ime} ${r.doktor.korisnik.prezime}`,
          tip: r.tipPregleda?.naziv?.toLowerCase().includes("hitni") ? "hitni"
             : r.tipPregleda?.naziv?.toLowerCase().includes("preventivni") ? "preventivni"
             : "kontrolni",
          komentar: r.komentar || "",
          soba: r.soba?.naziv || r.doktor?.soba?.naziv || "—",
          zavrseno: Boolean(r.zavrseno),
          review: r.review ? {
            id: r.review.id,
            rating: r.review.rating,
            comment: r.review.comment ?? null,
            createdAt: r.review.createdAt,
            hidden: r.review.hidden,
          } : null,
          komentari: Array.isArray(r.komentari) && r.komentari.length > 0
            ? r.komentari.map(mapirajKomentar)
            : r.komentar ? [{
              id: r.id * 1000,
              tekst: r.komentar,
              autor: "Vi",
              datum: isoUTCdatum(r.datumKreiranja),
              jeDoktor: false,
            }] : [],
          nalazi: [],
        }));
        setRezervacije(mapirano);
      })
      .catch(() => setRezervacije([]))
      .finally(() => setLoading(false));
  }, []);

  const tipStyle = {
    hitni: { dot: "bg-red-500", text: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Hitni", badge: "bg-red-100 text-red-700" },
    preventivni: { dot: "bg-green-500", text: "text-green-600", bg: "bg-green-50", border: "border-green-200", label: "Preventivni", badge: "bg-green-100 text-green-700" },
    kontrolni: { dot: "bg-blue-500", text: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "Kontrolni", badge: "bg-blue-100 text-blue-700" },
  };

  const getDaysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  // ✅ Koristi UTC za generisanje YYYY-MM-DD stringa za kalendar ćelije
  const toDateStr = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const getDayRez = (day: number) => {
    const ds = toDateStr(currentDate.getFullYear(), currentDate.getMonth(), day);
    return rezervacije.filter(r => r.datum === ds);
  };

  const selectedRez = selectedDate ? rezervacije.filter(r => r.datum === selectedDate) : [];

  const formatV = (v: number) => {
    const h = Math.floor(v / 60);
    const m = v % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const formatDateLabel = (ds: string) => {
    // ✅ "T12:00:00Z" — podne UTC, sigurno isti dan u svim zonama za prikaz
    return new Date(ds + "T12:00:00Z").toLocaleDateString("bs-BA", { day: "numeric", month: "long" });
  };

  const monthName = currentDate.toLocaleDateString("bs-BA", { month: "long", year: "numeric" });

  const daysArr = () => {
    const first = getFirstDay(currentDate);
    const total = getDaysInMonth(currentDate);
    const arr: (number | null)[] = [];
    for (let i = 0; i < first; i++) arr.push(null);
    for (let i = 1; i <= total; i++) arr.push(i);
    return arr;
  };

  // ✅ Danas u UTC
  const todayStr = danasUTC();

  const handleCancel = async (id: number) => {
    if (!window.confirm("Jeste li sigurni da želite otkazati ovu rezervaciju?")) return;
    try {
      const res = await fetch(`${apiUrl}/api/rezervacije/${id}/otkazi/pacijent`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.poruka || "Nije moguće otkazati rezervaciju.");
        return;
      }
      setRezervacije(prev => prev.filter(r => r.id !== id));
      setDetaljiRez(null);
    } catch {
      alert("Greška pri otkazivanju.");
    }
  };

  const handleReviewSubmit = async (id: number, rating: number, comment: string): Promise<OcjenaDoktora | null> => {
    try {
      const res = await fetch(`${apiUrl}/api/appointments/${id}/review`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.poruka || "Greška pri slanju ocjene.");
        return null;
      }

      const review: OcjenaDoktora = {
        id: data.review.id,
        rating: data.review.rating,
        comment: data.review.comment ?? null,
        createdAt: data.review.createdAt,
        hidden: data.review.hidden,
      };

      setRezervacije(prev => prev.map(r => r.id === id ? { ...r, review } : r));
      setDetaljiRez(prev => prev && prev.id === id ? { ...prev, review } : prev);
      return review;
    } catch {
      alert("Greška pri slanju ocjene.");
      return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f0f7ff]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">

            <div className="mb-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {!sidebarOpen && (
                  <button onClick={() => setSidebarOpen(true)} className="p-2.5 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition-all">
                    <Menu size={22} className="text-blue-600" />
                  </button>
                )}
                <div>
                  <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Moje Rezervacije</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex -space-x-2">
                      <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                      <div className="w-5 h-5 rounded-full bg-gray-300 border-2 border-white shadow-sm"></div>
                      <div className="w-5 h-5 rounded-full bg-gray-200 border-2 border-white shadow-sm"></div>
                    </div>
                    <p className="text-slate-500 text-sm font-medium ml-2">Moje Rezervacije - Pregled</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Kalendar */}
              <div className="lg:col-span-7 bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-blue-100/50 border border-white p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-slate-800 capitalize">{monthName}</h2>
                  <div className="flex items-center gap-3 bg-gray-100/50 p-1 rounded-xl">
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                      <ChevronLeft size={20} className="text-slate-600" />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors">
                      Today
                    </button>
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                      <ChevronRight size={20} className="text-slate-600" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 mb-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                    <div key={d} className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-3">
                  {daysArr().map((day, idx) => {
                    const ds = day ? toDateStr(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
                    const rez = day ? getDayRez(day) : [];
                    const isSelected = ds === selectedDate;
                    const isToday = ds === todayStr;

                    return (
                      <button
                        key={idx}
                        onClick={() => day && setSelectedDate(ds)}
                        disabled={!day}
                        className={`aspect-square p-2 rounded-2xl border-2 transition-all flex flex-col justify-between items-center ${
                          !day ? "border-transparent opacity-0 cursor-default" :
                          isSelected ? "border-blue-500 bg-white shadow-lg shadow-blue-100 scale-105" :
                          isToday ? "border-green-400 bg-green-50/50" :
                          "border-gray-50 bg-white/50 hover:bg-white hover:border-blue-200 hover:shadow-md"
                        }`}
                      >
                        <span className={`text-lg font-bold ${isSelected ? "text-blue-600" : "text-slate-700"}`}>{day}</span>
                        <div className="flex gap-1 justify-center mb-1">
                          {rez.slice(0, 3).map((r, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${tipStyle[r.tip].dot} shadow-sm`} />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detalji za dan */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-blue-100/50 border border-white p-8">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">
                    Rezervacije za: <span className="text-blue-600 font-extrabold">{selectedDate ? formatDateLabel(selectedDate) : "Odaberite datum"}</span>
                  </h3>

                  {loading ? (
                    <div className="text-center py-12 text-sm text-gray-400">Učitavanje...</div>
                  ) : selectedDate && selectedRez.length > 0 ? (
                    <div className="space-y-4">
                      {selectedRez.map(res => {
                        const s = tipStyle[res.tip];
                        return (
                          <div key={res.id} className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all border-l-8 ${
                            res.tip === "hitni" ? "border-l-red-500" :
                            res.tip === "preventivni" ? "border-l-green-500" :
                            "border-l-blue-500"
                          }`}>
                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                  <Clock size={20} />
                                </div>
                                <span className="text-2xl font-black text-slate-800 tracking-tight">{formatV(res.vrijeme)}</span>
                              </div>
                              <div className={`w-3 h-3 rounded-full ${s.dot} animate-pulse`} />
                            </div>

                            <div className="space-y-1 mb-3">
                              <h4 className="font-bold text-slate-800 text-lg">{res.doktor}</h4>
                              {res.soba && res.soba !== "—" && (
                                <p className="text-slate-500 text-sm flex items-center gap-1.5">
                                  <MapPin size={13} /> {res.soba}
                                </p>
                              )}
                              <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                                <Stethoscope size={14} /> {res.komentar || tipStyle[res.tip].label}
                              </p>
                              {res.zavrseno && (
                                <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${
                                  res.review ? ratingBg(res.review.rating) : "bg-green-50 border-green-200 text-green-700"
                                }`}>
                                  {res.review ? (
                                    <>
                                      <Star size={12} fill="currentColor" /> Ocijenjeno {res.review.rating}/5
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle size={12} /> Spremno za anonimnu ocjenu
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-3">
                              {!res.zavrseno && (
                                <button onClick={() => handleCancel(res.id)} className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-slate-600 bg-gray-50 hover:bg-gray-100 transition-all">
                                  Otkaži
                                </button>
                              )}
                              {res.zavrseno && !res.review && (
                                <button onClick={() => setDetaljiRez(res)} className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 transition-all flex items-center justify-center gap-2">
                                  <Star size={15} /> Ocijeni
                                </button>
                              )}
                              <button onClick={() => setDetaljiRez(res)} className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                                Detalji
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                      <CalendarIcon size={48} className="text-gray-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold">Nema rezervacija za ovaj dan</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {detaljiRez && (
        <DetaljiModal
          rez={detaljiRez}
          onClose={() => setDetaljiRez(null)}
          onCancel={handleCancel}
          apiUrl={apiUrl}
          onReviewSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
};

export default MojeRezervacije;
