import { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

export interface AuditLogPodaci {
  idKorisnika: number;
  tipAkcije: string;
  izmenjenaTabela: string;
  stariPodaci?: any;
  noviPodaci?: any;
  ipAdresa?: string;
}

/**
 * Kreira audit log zapis unutar transakcije.
 * Ako se proslijedi `tx` (transakcijski klijent), koristi ga.
 * Ako ne, koristi standardni prisma klijent.
 */
export function kreirajAuditLog(
  podaci: AuditLogPodaci,
  tx?: Prisma.TransactionClient
) {
  const klijent = tx || prisma;

  return klijent.auditLog.create({
    data: {
      idKorisnika: podaci.idKorisnika,
      tipAkcije: podaci.tipAkcije,
      izmenjenaTabela: podaci.izmenjenaTabela,
      stariPodaci: podaci.stariPodaci
        ? JSON.stringify(podaci.stariPodaci)
        : null,
      noviPodaci: podaci.noviPodaci
        ? JSON.stringify(podaci.noviPodaci)
        : null,
      ipAdresa: podaci.ipAdresa || null,
    },
  });
}