import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, CalendarDays, CheckCircle2, Clock, ShieldCheck, Star, Stethoscope } from "lucide-react";
import { apiUrl } from "../lib/api";

type ReviewInfo = {
  id: number;
  doctorName: string;
  date: string;
  time: number;
  completed: boolean;
  canceled: boolean;
  canReview: boolean;
  review: {
    id: number;
    rating: number;
    comment: string | null;
    createdAt: string;
  } | null;
};

const formatVrijeme = (vrijeme: number) => {
  const sati = Math.floor(vrijeme / 60);
  const minute = vrijeme % 60;
  return `${String(sati).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const formatDatum = (value: string) => {
  const datum = new Date(value);
  return datum.toLocaleDateString("bs-BA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

function AnonimnaOcjenaPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [info, setInfo] = useState<ReviewInfo | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setMessage({ type: "error", text: "Link za anonimnu ocjenu nije potpun." });
      setLoading(false);
      return;
    }

    fetch(apiUrl(`/api/appointments/review/${encodeURIComponent(token)}`))
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.poruka || "Link za anonimnu ocjenu nije validan.");
        setInfo(data.appointment);
      })
      .catch((err) => setMessage({ type: "error", text: err.message }))
      .finally(() => setLoading(false));
  }, [token]);

  const submitReview = async () => {
    if (rating < 1 || rating > 5) {
      setMessage({ type: "error", text: "Odaberite ocjenu od 1 do 5." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch(apiUrl(`/api/appointments/review/${encodeURIComponent(token)}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.poruka || "Greška pri slanju ocjene.");

      setInfo((current) => current ? { ...current, canReview: false, review: data.review } : current);
      setMessage({ type: "success", text: "Hvala Vam. Anonimna ocjena je uspješno spremljena." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Greška pri slanju ocjene." });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = Boolean(info?.canReview && rating > 0 && !submitting);

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-xl bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-emerald-700 px-6 py-7 text-white">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Anonimna ocjena pregleda</h1>
              <p className="text-sm text-emerald-50 mt-1">Doktor ne vidi Vaše ime, email niti identifikacione podatke.</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {loading && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
              Učitavanje poziva za ocjenu...
            </div>
          )}

          {!loading && info && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <Stethoscope size={18} className="text-emerald-700" />
                {info.doctorName}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-slate-400" />
                  {formatDatum(info.date)}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-slate-400" />
                  {formatVrijeme(info.time)}
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className={`rounded-xl border px-4 py-3 text-sm flex gap-2 ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}>
              {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{message.text}</span>
            </div>
          )}

          {!loading && info?.canReview && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Ocjena</label>
                <div className="flex items-center gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className={`h-12 w-12 rounded-xl border flex items-center justify-center transition ${
                        rating >= value
                          ? "border-amber-300 bg-amber-50 text-amber-500"
                          : "border-slate-200 bg-white text-slate-300 hover:bg-slate-50"
                      }`}
                      aria-label={`Ocjena ${value}`}
                    >
                      <Star size={24} fill={rating >= value ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Komentar</label>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value.slice(0, 500))}
                  rows={5}
                  placeholder="Komentar je opcionalan..."
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
                <div className="text-right text-xs text-slate-400 mt-1">{comment.length}/500</div>
              </div>

              <button
                type="button"
                onClick={submitReview}
                disabled={!canSubmit}
                className={`w-full rounded-xl py-3 text-sm font-bold transition flex items-center justify-center gap-2 ${
                  canSubmit
                    ? "bg-emerald-700 text-white hover:bg-emerald-800"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Star size={17} fill={canSubmit ? "currentColor" : "none"} />
                {submitting ? "Slanje..." : "Pošalji anonimnu ocjenu"}
              </button>
            </div>
          )}

          {!loading && info && !info.canReview && !message && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-center text-slate-600">
              Ovaj pregled trenutno nije dostupan za novu ocjenu.
            </div>
          )}

          <div className="pt-2 text-center">
            <Link to="/" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
              Nazad na početnu
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AnonimnaOcjenaPage;
