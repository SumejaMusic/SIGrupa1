import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

// GET /api/users/:id/profile
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const authUser = (req as any).korisnik;
    
    // Check if the user is fetching their own profile or is an admin
    if (authUser.id !== id && authUser.uloga !== "ADMINISTRATOR" && authUser.uloga !== "VLASNIK") {
        res.status(403).json({ poruka: "Zabranjen pristup." });
        return;
    }

    const korisnik = await prisma.korisnik.findUnique({
      where: { id },
      select: {
        id: true,
        ime: true,
        prezime: true,
        email: true,
        brojTelefona: true,
        datumRodjenja: true,
        uloga: true
      }
    });

    if (!korisnik) {
      res.status(404).json({ poruka: "Korisnik nije pronađen." });
      return;
    }

    res.json(korisnik);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id/profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const authUser = (req as any).korisnik;

    if (authUser.id !== id && authUser.uloga !== "ADMINISTRATOR" && authUser.uloga !== "VLASNIK") {
        res.status(403).json({ poruka: "Zabranjen pristup." });
        return;
    }

    const { ime, prezime, brojTelefona, datumRodjenja } = req.body;
    
    const updateData: any = {};
    if (ime) updateData.ime = ime;
    if (prezime) updateData.prezime = prezime;
    if (brojTelefona !== undefined) updateData.brojTelefona = brojTelefona;
    
    if (datumRodjenja) {
      updateData.datumRodjenja = new Date(datumRodjenja);
    }

    const updatedUser = await prisma.korisnik.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        ime: true,
        prezime: true,
        email: true,
        brojTelefona: true,
        datumRodjenja: true,
      }
    });

    res.json({ poruka: "Profil uspješno ažuriran", korisnik: updatedUser });
  } catch (err) {
    next(err);
  }
};
