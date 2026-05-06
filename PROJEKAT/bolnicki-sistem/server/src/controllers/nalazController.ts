// controllers/nalazController.ts

import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

// GET /api/nalazi/pacijent/:pacijentId
export const getNalaziZaPacijenta = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const nalazi = await prisma.nalaz.findMany({
      where: {
        pregledi: {
          some: {
            idPacijent: Number(req.params.pacijentId),
          },
        },
      },
      select: {
        id: true,
        naziv: true,
        vrijemeNalaza: true,
        opis: true,
        // dokumentPDF namjerno ne vracamo — preveliko
      },
      orderBy: { vrijemeNalaza: "desc" },
    });

    res.json(nalazi);
  } catch (err) {
    next(err);
  }
};

// GET /api/nalazi/:id/pdf
export const getNalazPDF = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const nalaz = await prisma.nalaz.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!nalaz) {
      res.status(404).json({ poruka: "Nalaz nije pronađen." });
      return;
    }

    if (!nalaz.dokumentPDF) {
      res.status(404).json({ poruka: "PDF nije priložen uz ovaj nalaz." });
      return;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${nalaz.naziv}"`);
    res.send(nalaz.dokumentPDF);
  } catch (err) {
    next(err);
  }
};