import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pozoviChatAPI, ChatMessage } from "../services/chatService.js";
import { rateLimitChat } from "../middleware/rateLimitChat.js";

const router = Router();

function autentifikujOpcionalno(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!);
      (req as any).korisnik = payload;
    } catch {
      console.warn("Nevažeći token u Authorization headeru. Nastavljam bez korisničkog konteksta.");
      // Nevažeći token — nastavi bez konteksta
    }
  }
  next();
}

router.post("/", autentifikujOpcionalno, rateLimitChat, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ poruka: "Poruka ne smije biti prazna.", kod: "EMPTY_MESSAGE" });
      return;
    }

    if (message.length > 1000) {
      res.status(400).json({ poruka: "Poruka ne smije biti duža od 1000 znakova.", kod: "MESSAGE_TOO_LONG" });
      return;
    }

    if (!Array.isArray(history)) {
      res.status(400).json({ poruka: "History mora biti niz.", kod: "INVALID_HISTORY" });
      return;
    }

    if (history.length > 20) {
      res.status(400).json({ poruka: "History ne smije imati više od 20 poruka.", kod: "HISTORY_TOO_LONG" });
      return;
    }

    const validatedHistory: ChatMessage[] = history
      .filter(
        (item): item is ChatMessage =>
          item !== null &&
          typeof item === "object" &&
          (item.role === "user" || item.role === "assistant") &&
          typeof item.content === "string" &&
          item.content.length > 0
      )
      .map((item) => ({
        role: item.role,
        content: item.content.slice(0, 2000),
      }));

    const korisnikKontekst = (req as any).korisnik
      ? { id: (req as any).korisnik.id, uloga: (req as any).korisnik.uloga }
      : undefined;

    const reply = await pozoviChatAPI(message.trim(), validatedHistory, korisnikKontekst);

    res.json({ reply });
  } catch (err: any) {
    next(err);
  }
});

export default router;
