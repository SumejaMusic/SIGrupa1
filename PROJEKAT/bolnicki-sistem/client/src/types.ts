export type TipPregleda = "hitni" | "preventivni" | "kontrolni";
export type StatusTermina = "zakazan" | "zavrsen" | "otkazan";

export interface Komentar {
  id: number;
  tekst: string;
  autor: string;
  datum: string;
  jeDoktor: boolean;
}

export interface Nalaz {
  id: number;
  naziv: string;
  datum: string;
  url: string;
}

export interface Pacijent {
  id: number;
  ime: string;
  prezime: string;
  godisteRodjenja: number;
  pol: "M" | "F";
  email: string;
  telefon: string;
}

export interface Termin {
  id: number;
  datum: string;
  vrijemeOd: number;
  vrijemeDo: number;
  pacijent: Pacijent;
  tip: TipPregleda;
  status: StatusTermina;
  komentari: Komentar[];
  nalazi: Nalaz[];
}