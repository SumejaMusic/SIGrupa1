import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const autentifikuj = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ poruka: "Niste prijavljeni." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).korisnik = payload;
    next();
  } catch {
    res.status(401).json({ poruka: "Token nije validan ili je istekao." });
  }
};