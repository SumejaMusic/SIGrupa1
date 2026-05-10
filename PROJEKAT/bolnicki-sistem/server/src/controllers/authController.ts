import { Request, Response } from "express";
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
      res.status(429).json({ message: "Previše zahtjeva. Pokušajte ponovo kasnije." });
      return;
    }

    const { email } = req.body;

    const user = await prisma.korisnik.findUnique({
      where: { email },
    });

    // Always return a generic success message
    const genericMessage = "Ukoliko račun postoji, poslan je email za reset lozinke.";

    if (!user) {
      res.status(200).json({ message: genericMessage });
      return;
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");
    
    // Store token in Redis with TTL of 15 minutes (900 seconds)
    const redisKey = `reset-password:${token}`;
    await redis.setex(redisKey, 900, user.id.toString());

    // Send reset email using Nodemailer
    await posaljiResetPasswordEmail(user.email, user.ime, token);

    res.status(200).json({ message: genericMessage });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Greška na serveru." });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token) {
      res.status(400).json({ message: "Nedostaje token." });
      return;
    }

    const redisKey = `reset-password:${token}`;
    const userIdStr = await redis.get(redisKey);

    if (!userIdStr) {
      res.status(400).json({ message: "Nevažeći ili istekao token." });
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

    res.status(200).json({ message: "Lozinka je uspješno resetovana." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Greška na serveru prilikom resetovanja lozinke." });
  }
};
