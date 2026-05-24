// src/middleware/autorizacija.ts
//
// Ovaj middleware se poziva NAKON autentifikuj() koji je već postavio
// (req as any).korisnik = { id, uloga, ... } iz JWT payloada.
//
// Koristi se ovako u rutama:
//   router.get("/termini", autentifikuj, autorizacija(["MEDICINSKO_OSOBLJE", "DOKTOR"]), handler)
//
// Zašto niz uloga umjesto jedne: osoblje, doktor i admin mogu koristiti isti panel,
// pa je fleksibilnije proslijediti listu nego pisati više middlewarea.

import { Request, Response, NextFunction } from "express";

export const autorizacija = (dozvoljeneUloge: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const korisnik = (req as any).korisnik;

    // autentifikuj() nije pozvao next() — to ne bi trebalo biti moguće,
    // ali branimo se svejedno
    if (!korisnik) {
      res.status(401).json({ poruka: "Niste prijavljeni." });
      return;
    }

    if (!dozvoljeneUloge.includes(korisnik.uloga)) {
      res.status(403).json({
        poruka: "Nemate dozvolu za pristup ovom resursu.",
      });
      return;
    }

    next();
  };
};
