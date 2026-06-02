import { Request, Response, NextFunction } from "express";
import {
  kreirajZahtjevDeaktivacije,
  dohvatiStatusZahtjeva,
  dohvatiZahtjeveDeaktivacije,
  obradiZahtjevDeaktivacije,
} from "../services/deactivationService.js";

// ══════════════════════════════════════════════════════════════
//  POST /api/users/:id/deactivation-request — pacijent podnosi zahtjev
// ══════════════════════════════════════════════════════════════
export const podnosenjeZahtjeva = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id as string);
    const authUser = (req as any).korisnik;

    // Samo sam korisnik može podnijeti zahtjev za svoj nalog
    if (authUser.id !== id) {
      res.status(403).json({ poruka: "Zabranjen pristup." });
      return;
    }

    const { razlog } = req.body;
    const ipAdresa = req.ip;

    const zahtjev = await kreirajZahtjevDeaktivacije(id, razlog, ipAdresa);

    res.status(201).json({
      poruka:
        "Zahtjev za deaktivaciju je uspješno podnesen. Bićete obaviješteni emailom o odluci u roku od 30 dana.",
      zahtjev,
    });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ poruka: err.poruka });
      return;
    }
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════
//  GET /api/users/:id/deactivation-request — pacijent dohvata status
// ══════════════════════════════════════════════════════════════
export const dohvatiStatusZahtjevaHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id as string);
    const authUser = (req as any).korisnik;

    if (authUser.id !== id && authUser.uloga !== "ADMINISTRATOR") {
      res.status(403).json({ poruka: "Zabranjen pristup." });
      return;
    }

    const zahtjev = await dohvatiStatusZahtjeva(id);
    res.json({ zahtjev });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ poruka: err.poruka });
      return;
    }
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════
//  GET /api/admin/deactivation-requests — admin dohvata zahtjeve
// ══════════════════════════════════════════════════════════════
export const dohvatiZahtjeveHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const status = req.query.status as string | undefined;
    const stranica = parseInt(req.query.stranica as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const rezultat = await dohvatiZahtjeveDeaktivacije({
      status,
      stranica,
      limit,
    });

    res.json(rezultat);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ poruka: err.poruka });
      return;
    }
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════
//  PATCH /api/admin/deactivation-requests/:id — admin odobri/odbij
// ══════════════════════════════════════════════════════════════
export const obradiZahtjevHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idZahtjeva = parseInt(req.params.id as string);
    const adminId = (req as any).korisnik.id;
    const { odluka, obrazlozenje } = req.body;

    if (!["ODOBRENO", "ODBIJENO"].includes(odluka)) {
      res
        .status(400)
        .json({ poruka: 'Odluka mora biti "ODOBRENO" ili "ODBIJENO".' });
      return;
    }

    const ipAdresa = req.ip;

    const rezultat = await obradiZahtjevDeaktivacije(
      idZahtjeva,
      odluka,
      adminId,
      obrazlozenje,
      ipAdresa
    );

    res.json(rezultat);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ poruka: err.poruka });
      return;
    }
    next(err);
  }
};
