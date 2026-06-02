import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

const ocistiTekstualnoPolje = (vrijednost: unknown) => {
  if (typeof vrijednost !== "string") return undefined;
  const trimmed = vrijednost.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parsirajBoolean = (vrijednost: unknown) => {
  if (typeof vrijednost === "boolean") return vrijednost;
  if (vrijednost === "true") return true;
  if (vrijednost === "false") return false;
  return undefined;
};

const pacijentProfileSelect = {
  id: true,
  alergije: true,
  hronicneBolesti: true,
  krvnaGrupa: true,
  doniraKrv: true,
  imaoOperacije: true,
  operacijeOpis: true,
};

// GET /api/users/:id/profile
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
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
        uloga: true,
        pacijentProfile: {
          select: pacijentProfileSelect,
        },
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
    const id = parseInt(req.params.id as string);
    const authUser = (req as any).korisnik;

    if (authUser.id !== id && authUser.uloga !== "ADMINISTRATOR" && authUser.uloga !== "VLASNIK") {
        res.status(403).json({ poruka: "Zabranjen pristup." });
        return;
    }

    const {
      ime,
      prezime,
      brojTelefona,
      datumRodjenja,
      alergije,
      hronicneBolesti,
      krvnaGrupa,
      doniraKrv,
      imaoOperacije,
      operacijeOpis,
    } = req.body;
    
    const updateData: any = {};
    if (ime) updateData.ime = ime;
    if (prezime) updateData.prezime = prezime;
    if (brojTelefona !== undefined) updateData.brojTelefona = brojTelefona;
    
    if (datumRodjenja) {
      updateData.datumRodjenja = new Date(datumRodjenja);
    }

    const medicinskiUpdateData: any = {};
    const alergijeValue = ocistiTekstualnoPolje(alergije);
    const hronicneBolestiValue = ocistiTekstualnoPolje(hronicneBolesti);
    const krvnaGrupaValue = ocistiTekstualnoPolje(krvnaGrupa);
    const operacijeOpisValue = ocistiTekstualnoPolje(operacijeOpis);
    const doniraKrvValue = parsirajBoolean(doniraKrv);
    const imaoOperacijeValue = parsirajBoolean(imaoOperacije);

    if (alergijeValue !== undefined) medicinskiUpdateData.alergije = alergijeValue;
    if (hronicneBolestiValue !== undefined) medicinskiUpdateData.hronicneBolesti = hronicneBolestiValue;
    if (krvnaGrupaValue !== undefined) medicinskiUpdateData.krvnaGrupa = krvnaGrupaValue;
    if (doniraKrvValue !== undefined) medicinskiUpdateData.doniraKrv = doniraKrvValue;
    if (imaoOperacijeValue !== undefined) medicinskiUpdateData.imaoOperacije = imaoOperacijeValue;
    if (operacijeOpisValue !== undefined) medicinskiUpdateData.operacijeOpis = operacijeOpisValue;

    const updatedUser: any = await prisma.korisnik.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        ime: true,
        prezime: true,
        email: true,
        brojTelefona: true,
        datumRodjenja: true,
        uloga: true,
        pacijentProfile: {
          select: pacijentProfileSelect,
        },
      }
    });

    if (Object.keys(medicinskiUpdateData).length > 0) {
      const updatedPatientProfile = await prisma.pacijent.update({
        where: { idKorisnik: id },
        data: medicinskiUpdateData,
        select: pacijentProfileSelect,
      });
      updatedUser.pacijentProfile = updatedPatientProfile;
    }

    res.json({ poruka: "Profil uspješno ažuriran", korisnik: updatedUser });
  } catch (err) {
    next(err);
  }
};
