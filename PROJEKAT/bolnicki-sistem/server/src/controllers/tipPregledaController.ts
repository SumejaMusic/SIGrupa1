import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

// GET /api/tippregleda
// Svi dostupni tipovi pregleda
export const getSviTipoviPregleda = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tipovi = await prisma.tipPregleda.findMany({
      orderBy: { naziv: "asc" },
    });

    res.json(tipovi);
  } catch (err) {
    next(err);
  }
};

// GET /api/tippregleda/:id
export const getTipPregledaById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tip = await prisma.tipPregleda.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!tip) {
      res.status(404).json({ poruka: "Tip pregleda nije pronađen." });
      return;
    }

    res.json(tip);
  } catch (err) {
    next(err);
  }
};
