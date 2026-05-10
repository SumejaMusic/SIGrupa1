import { Request, Response, NextFunction } from "express";
import { registracijaService } from "../authService.js";

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