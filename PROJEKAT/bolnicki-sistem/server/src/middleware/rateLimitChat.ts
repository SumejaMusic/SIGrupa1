import { Request, Response, NextFunction } from "express";

const MAX_PORUKA_PO_SATU = 2;
const PROZOR_MS = 60 * 60 * 1000;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup starih unosa svakih sat vremena da se spriječi memory leak
setInterval(() => {
  const sada = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < sada) store.delete(key);
  }
}, PROZOR_MS);

export function rateLimitChat(req: Request, res: Response, next: NextFunction): void {
  const korisnik = (req as any).korisnik;
  const key = korisnik ? `user:${korisnik.id}` : `ip:${req.ip ?? "unknown"}`;
  const sada = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < sada) {
    store.set(key, { count: 1, resetAt: sada + PROZOR_MS });
    next();
    return;
  }

  if (entry.count >= MAX_PORUKA_PO_SATU) {
    res.status(429).json({
      poruka: "Dostigli ste limit od 2 poruke po satu. Pokušajte ponovo za sat vremena.",
      kod: "RATE_LIMIT_EXCEEDED",
    });
    return;
  }

  entry.count++;
  next();
}
