import type { Komentar, StatusTermina, Termin, TipPregleda } from "../types";

export const isoUTCdatum = (isoStr: string): string => {
  const d = new Date(isoStr);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dan = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dan}`;
};

export const danasUTC = (): string => {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dan = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dan}`;
};

/**
 * Formatira datum za prikaz korisniku u dd/mm/yyyy formatu.
 * Prihvata ISO string (yyyy-mm-dd) ili puni ISO 8601 string.
 */
export const formatDatumPrikaz = (datumStr: string): string => {
  if (!datumStr) return '';
  // Ako je već u formatu yyyy-mm-dd, jednostavno presloži
  const isoDate = datumStr.length > 10 ? isoUTCdatum(datumStr) : datumStr;
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
};

export const formatV = (v: number) => {
  const h = Math.floor(v / 60);
  const m = v % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const tipConfig = {
  hitni: { label: "Hitni", bg: "bg-red-50", border: "border-red-400", text: "text-red-700", badge: "bg-red-100 text-red-700", dot: "bg-red-500", row: "bg-red-50 border-l-4 border-l-red-500", trajanje: 15 },
  preventivni: { label: "Preventivni", bg: "bg-green-50", border: "border-green-300", text: "text-green-700", badge: "bg-green-100 text-green-700", dot: "bg-green-500", row: "bg-white border-l-4 border-l-green-400", trajanje: 30 },
  kontrolni: { label: "Kontrolni", bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500", row: "bg-white border-l-4 border-l-blue-400", trajanje: 30 },
};

export const statusConfig = {
  zakazan: { label: "Zakazan", cls: "bg-blue-100 text-blue-700" },
  zavrsen: { label: "Završen", cls: "bg-gray-100 text-gray-600" },
  otkazan: { label: "Otkazan", cls: "bg-red-100 text-red-600" },
};

export const getAge = (godiste: number) => new Date().getUTCFullYear() - godiste;

const mapirajKomentar = (k: any, fallbackAutor: string): Komentar => ({
  id: k.id,
  tekst: k.tekst,
  autor: k.autor ?? (k.korisnik ? `${k.korisnik.ime} ${k.korisnik.prezime}` : fallbackAutor),
  datum: k.datum ?? isoUTCdatum(k.datumKreiranja ?? new Date().toISOString()),
  jeDoktor: Boolean(k.jeDoktor),
});

export function mapirajRezervaciju(r: any): Termin {
  const vrijemeOd = r.termin.vrijeme;
  const trajanje = r.tipPregleda?.trajanjeMinuta ?? r.doktor?.trajanjePregleda ?? 30;
  const sati = Math.floor(vrijemeOd / 60);
  const minute = vrijemeOd % 60;
  const ukupnoMinuta = sati * 60 + minute + trajanje;
  const vrijemeDo = ukupnoMinuta;

  let tip: TipPregleda = "kontrolni";
  if (r.hitnost) {
    tip = "hitni";
  } else {
    switch (r.idTipPregleda) {
      case 1: tip = "preventivni"; break;
      case 2: tip = "kontrolni"; break;
      case 3: tip = "hitni"; break;
      default: {
        const naziv = r.tipPregleda?.naziv?.toLowerCase().trim() ?? "";
        if (naziv.includes("preventiv")) tip = "preventivni";
        else if (naziv.includes("hitn")) tip = "hitni";
        break;
      }
    }
  }

  let status: StatusTermina = "zakazan";
  if (r.datumOtkazivanja) status = "otkazan";
  else if (r.zavrseno) status = "zavrsen";

  const pacijentAutor = `${r.pacijent.korisnik.ime} ${r.pacijent.korisnik.prezime}`;
  const komentari: Komentar[] = Array.isArray(r.komentari) && r.komentari.length > 0
    ? r.komentari.map((k: any) => mapirajKomentar(k, k.jeDoktor ? "Doktor" : pacijentAutor))
    : r.komentar ? [{
      id: r.id * 1000,
      tekst: r.komentar,
      autor: pacijentAutor,
      // ✅ UTC parsing datuma kreiranja komentara
      datum: isoUTCdatum(r.datumKreiranja),
      jeDoktor: r.doktorRezervisao,
    }] : [];

  return {
    id: r.id,
    // ✅ UTC parsing datuma termina
    datum: isoUTCdatum(r.termin.datum),
    vrijemeOd,
    vrijemeDo,
    pacijent: {
      id: r.pacijent.id,
      ime: r.pacijent.korisnik.ime,
      prezime: r.pacijent.korisnik.prezime,
      // ✅ UTC godina rođenja
      godisteRodjenja: new Date(r.pacijent.korisnik.datumRodjenja).getUTCFullYear(),
      pol: r.pacijent.korisnik.jmbg?.[6] < "5" ? "M" : "F",
      email: r.pacijent.korisnik.email,
      telefon: r.pacijent.korisnik.brojTelefona ?? "/",
      reviewPeriodDays: r.pacijent.reviewPeriodDays ?? 0,
      hronicniBolesnik: r.pacijent.hronicniBolesnik ?? false,
    },
    tip,
    status,
    komentari,
    nalazi: [],
    review: r.review ? {
      id: r.review.id,
      rating: r.review.rating,
      comment: r.review.comment ?? null,
      createdAt: r.review.createdAt,
      hidden: r.review.hidden,
    } : null,
    doktorId: r.idDoktor,
  };
}
