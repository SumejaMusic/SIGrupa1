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
    console.error("🔴 GREŠKA:", error); // ← DODAJ OVO OVDJE
    if (typeof error === "object" && error !== null && "status" in error) {
      const err = error as { status?: number; poruka?: string };
      return res.status(err.status || 500).json({ poruka: err.poruka });
    }
    return res.status(500).json({ poruka: "Interna greška servera." });
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

import crypto from "crypto";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";
import { posaljiResetPasswordEmail } from "../emailService.js";

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

    // Store token in Redis with TTL of 15 minutes (900 seconds)
    const redisKey = `reset-password:${token}`;
    await redis.setex(redisKey, 900, user.id.toString());

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

    const redisKey = `reset-password:${token}`;
    const userIdStr = await redis.get(redisKey);

    if (!userIdStr) {
      res.status(400).json({ poruka: "Nevažeći ili istekao token." });
      return;
    }

    const userId = parseInt(userIdStr, 10);

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password in Prisma
    await prisma.korisnik.update({
      where: { id: userId },
      data: { pristupnaSifra: hashedPassword },
    });

    // Delete reset token from Redis immediately after successful reset
    await redis.del(redisKey);

    res.status(200).json({ poruka: "Lozinka je uspješno resetovana." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ poruka: "Greška na serveru prilikom resetovanja lozinke." });
  }
};
