// controllers/odjelController.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

export const getOdjeli = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const odjeli = await prisma.odjel.findMany({
      include: {
        doktori: {
          include: { korisnik: true },
        },
      },
      orderBy: { id: "asc" },
    });
    res.json(odjeli);
  } catch (err) {
    next(err);
  }
};