import { Request, Response, NextFunction } from "express";
import { getZauzetostSobaService } from "../sobaOccupancyService.js";

export async function getZauzetostSoba(req: Request, res: Response, next: NextFunction) {
  try {
    const date = req.query.date as string | undefined;
    const occupancy = await getZauzetostSobaService(date);
    res.status(200).json(occupancy);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ poruka: err.poruka });
      return;
    }

    next(err);
  }
}
