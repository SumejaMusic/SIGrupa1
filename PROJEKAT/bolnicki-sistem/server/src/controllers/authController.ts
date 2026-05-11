import { Request, Response, NextFunction } from "express";
import { registracijaService, prijavaService } from "../authService.js";

import crypto from "crypto";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";
import { posaljiResetPasswordEmail } from "../emailService.js";
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
    return res.status(500).json({ poruka: "Interna greška servera." });
  }


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

    const { token, ...korisnik } = await prijavaService({
      email,
      pristupnaSifra,
      ipAdresa: req.ip || req.socket.remoteAddress,
    });

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

    const rezultat = await prijavaService({
      email,
      pristupnaSifra,
      ipAdresa: req.ip || req.socket.remoteAddress,
    });

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
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

const hashResetToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

const validirajLozinku = (lozinka?: string) => {
  if (!lozinka || lozinka.length < 8) return "Lozinka mora imati najmanje 8 karaktera.";
  if (!/[A-Z]/.test(lozinka)) return "Lozinka mora sadržavati veliko slovo.";
  if (!/[a-z]/.test(lozinka)) return "Lozinka mora sadržavati malo slovo.";
  if (!/[0-9]/.test(lozinka)) return "Lozinka mora sadržavati broj.";
  if (!/[^A-Za-z0-9]/.test(lozinka)) return "Lozinka mora sadržavati specijalni karakter.";
  return null;
};

// Basic rate limiter using Redis
async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `rate-limit:forgot-password:${ip}`;
  const currentStr = await redis.get(key);
  const current = currentStr ? parseInt(currentStr, 10) : 0;

  if (current >= 3) {
    return false; // Rate limit exceeded (max 3 requests per 15 min)
  }

  // If there's no record, we set it with TTL. If there is, we should ideally keep the TTL,
  // but since we only have setex, we'll just extend it or we can do a simple setex
  const ttl = await redis.ttl(key);
  const expiry = ttl > 0 ? ttl : 15 * 60; // 15 minutes
  await redis.setex(key, expiry, (current + 1).toString());

  return true;
}

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const allowed = await checkRateLimit(ip);

    if (!allowed) {
      res.status(429).json({ poruka: "Previše zahtjeva. Pokušajte ponovo kasnije." });
      return;
    }

    const { email } = req.body;

    const user = await prisma.korisnik.findUnique({
      where: { email },
    });

    // Always return a generic success message
    const genericMessage = "Ukoliko račun postoji, poslan je email za reset lozinke.";

    if (!user) {
      res.status(200).json({ poruka: genericMessage });
      return;
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: {
          idKorisnika: user.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });

      await tx.passwordResetToken.create({
        data: {
          tokenHash,
          idKorisnika: user.id,
          expiresAt,
        },
      });
    });

    // Send reset email using Nodemailer
    await posaljiResetPasswordEmail(user.email, user.ime, token);

    res.status(200).json({ poruka: genericMessage });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ poruka: "Greška na serveru." });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token) {
      res.status(400).json({ poruka: "Nedostaje token." });
      return;
    }

    const greskaLozinke = validirajLozinku(newPassword);
    if (greskaLozinke) {
      res.status(400).json({ poruka: greskaLozinke });
      return;
    }

    const tokenHash = hashResetToken(token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
      res.status(400).json({ poruka: "Nevažeći ili istekao token." });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Reset lozinke je i siguran put za povrat pristupa nakon blokade naloga.
    await prisma.$transaction(async (tx) => {
      await tx.korisnik.update({
        where: { id: resetToken.idKorisnika },
        data: {
          pristupnaSifra: hashedPassword,
          brojNeuspjelihPrijava: 0,
          nalogZakljucan: false,
          vrijemeZakljucavanja: null,
          zadnjiNeuspjeliPokusaj: null,
        },
      });

      await tx.auditLog.create({
        data: {
          idKorisnika: resetToken.idKorisnika,
          tipAkcije: "RESET_LOZINKE",
          izmenjenaTabela: "Korisnik",
          stariPodaci: JSON.stringify({ akcija: "reset_lozinke" }),
          noviPodaci: JSON.stringify({
            brojNeuspjelihPrijava: 0,
            nalogZakljucan: false,
          }),
          ipAdresa: req.ip || req.socket.remoteAddress,
        },
      });

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });
    });

    res.status(200).json({ poruka: "Lozinka je uspješno resetovana." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ poruka: "Greška na serveru prilikom resetovanja lozinke." });
  }
};
