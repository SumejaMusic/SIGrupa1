import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

// GET /api/reminder-logovi/pacijent/:pacijentId
export const getReminderLogoviZaPacijenta = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pacijentId = Number(req.params.pacijentId);

    if (isNaN(pacijentId)) {
      return res.status(400).json({ poruka: "Neispravan ID pacijenta." });
    }

    const logovi = await prisma.reminderLog.findMany({
      where: { idPacijent: pacijentId },
      orderBy: { sentAt: "desc" },
      include: {
        pacijent: {
          include: {
            korisnik: {
              select: {
                ime: true,
                prezime: true,
                email: true,
              }
            }
          }
        }
      }
    });

    res.json(logovi);
  } catch (err) {
    next(err);
  }
};