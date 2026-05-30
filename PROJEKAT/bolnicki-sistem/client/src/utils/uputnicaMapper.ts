import type { Termin } from "../types";

export interface UputnicaData {
  brojUputnice: string;
  datum: string;

  pacijent: {
    ime: string;
    prezime: string;
    jmbg: string;
    godinaRodjenja: string;
    spol: string;
    email: string;
    telefon: string;
  };

  doktor: {
    ime: string;
    prezime: string;
    specijalizacija: string;
    licenca: string;
    ustanova: string;
  };

  pregled: {
    kliniNalaz: string;
    dijagnoza: string;
    uputnoOdjeljenje: string;
    uputnaUstanova: string;
    hitnost: string;
    napomena: string;
  };
}

export const mapTerminNaUputnicu = (termin: Termin): UputnicaData => {
  const doktorKorisnik = (() => {
    try {
      const k = localStorage.getItem("korisnik");
      return k ? JSON.parse(k) : null;
    } catch {
      return null;
    }
  })();

  const doktorKomentari = termin.komentari
    .filter((k) => k.jeDoktor)
    .map((k) => k.tekst)
    .join("\n\n");

  return {
    brojUputnice: `${termin.id}/${new Date().getFullYear()}`,
    datum: new Date().toLocaleDateString("bs-BA"),

    pacijent: {
      ime: termin.pacijent.ime,
      prezime: termin.pacijent.prezime,
      jmbg: "",
      godinaRodjenja: termin.pacijent.godisteRodjenja?.toString() ?? "",
      spol: termin.pacijent.pol === "M" ? "Muški" : "Ženski",
      email: termin.pacijent.email,
      telefon: termin.pacijent.telefon,
    },

    doktor: {
      ime: doktorKorisnik?.ime ?? "",
      prezime: doktorKorisnik?.prezime ?? "",
      specijalizacija: doktorKorisnik?.specijalizacija ?? "",
      licenca: doktorKorisnik?.brojLicence?.toString() ?? "",
      ustanova: doktorKorisnik?.ustanova ?? "Zdravstvena ustanova",
    },

    pregled: {
      kliniNalaz: doktorKomentari,
      dijagnoza: "",
      uputnoOdjeljenje: "",
      uputnaUstanova: "",
      hitnost: termin.tip === "hitni" ? "Hitna" : "Redovna",
      napomena: "",
    },
  };
};
