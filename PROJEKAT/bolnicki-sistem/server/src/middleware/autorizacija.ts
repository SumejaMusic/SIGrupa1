import { Request, Response, NextFunction } from "express";

type Uloga = "ADMINISTRATOR" | "PACIJENT" | "DOKTOR" | "MEDICINSKO_OSOBLJE" | "VLASNIK";

/**
 * Middleware za provjeru uloge korisnika (autorizacija).
 * Koristi se NAKON `autentifikuj` middleware-a koji postavlja `req.korisnik`.
 * 
 * @param dozvoljeneUloge - Uloge koje imaju pristup ruti
 * @returns Express middleware koji provjerava ulogu
 * 
 * @example
 * // Samo doktor i administrator mogu pristupiti
 * router.get("/ruta", autentifikuj, autorizuj("DOKTOR", "ADMINISTRATOR"), handler);
 */
export const autorizuj = (...dozvoljeneUloge: Uloga[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const korisnik = (req as any).korisnik;

    if (!korisnik || !korisnik.uloga) {
      res.status(401).json({ poruka: "Niste prijavljeni." });
      return;
    }

    if (!dozvoljeneUloge.includes(korisnik.uloga)) {
      res.status(403).json({ poruka: "Nemate dozvolu za ovu akciju." });
      return;
    }

    next();
  };
};
