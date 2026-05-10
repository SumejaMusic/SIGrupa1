import { Request, Response, NextFunction } from "express";
import { registracijaService, prijavaService } from "../authService.js";

export const registrujSe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const noviKorisnik = await registracijaService(req.body);

        return res.status(201).json({
            poruka: "Korisnik uspješno registrovan",
            korisnik: noviKorisnik
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/auth/login
export const prijaviSe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, pristupnaSifra } = req.body;

    if (!email || !pristupnaSifra) {
      res.status(400).json({ poruka: "Email i lozinka su obavezni." });
      return;
    }

    const { token, ...korisnik } = await prijavaService({ email, pristupnaSifra });

    res.status(200).json({
      poruka: "Uspješna prijava.",
      korisnik,
      token,
    });
  } catch (error) {
    next(error);
  }
};


export const prijavi = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, pristupnaSifra } = req.body;

        const rezultat = await prijavaService({ email, pristupnaSifra });

        // NE: const { korisnik, token } = await prijavaService(...)
        // rezultat već sadrži sve direktno

        return res.status(200).json({
            poruka: "Uspješna prijava.",
            korisnik: {
                id: rezultat.id,
                ime: rezultat.ime,
                prezime: rezultat.prezime,
                email: rezultat.email,
                uloga: rezultat.uloga
            },
            token: rezultat.token
        });
    } catch (error) {
        next(error);
    }
};