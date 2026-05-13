import { Prisma } from '@prisma/client';
import { enkriptuj, dekriptuj } from './encryption.js';

const ENCRYPTED_FIELDS: Partial<Record<Prisma.ModelName, string[]>> = {
  HistorijaPregleda: ['dijagnoza', 'terapija', 'biljeske'],
  Recept: ['nazivLijeka', 'doza', 'napomena'],
  RezervacijaSpecijalista: ['razlogPregleda'],
  AuditLog: ['stariPodaci', 'noviPodaci'],
};

function encryptFields(model: Prisma.ModelName, data: Record<string, unknown>) {
  const fields = ENCRYPTED_FIELDS[model];
  if (!fields || !data) return;
  for (const field of fields) {
    if (typeof data[field] === 'string') {
      data[field] = enkriptuj(data[field] as string);
    }
  }
}

function decryptResult(model: Prisma.ModelName, result: unknown) {
  if (!result || typeof result !== 'object') return;
  const fields = ENCRYPTED_FIELDS[model];
  if (!fields) return;
  if (Array.isArray(result)) {
    result.forEach(item => decryptResult(model, item));
    return;
  }
  const obj = result as Record<string, unknown>;
  for (const field of fields) {
    if (typeof obj[field] === 'string') {
      try {
        obj[field] = dekriptuj(obj[field] as string);
      } catch {
        // već dekriptovano ili neispravan format, ostavi kako je
      }
    }
  }
}

export const applyEncryptionMiddleware: Prisma.Middleware = async (params, next) => {
  const model = params.model as Prisma.ModelName | undefined;

  console.log("=== MIDDLEWARE POKRENUT ===", model, params.action);

  if (model && ['create', 'update', 'upsert'].includes(params.action)) {
    console.log("Data PRIJE:", JSON.stringify(params.args.data));
    if (params.args.data) encryptFields(model, params.args.data);
    console.log("Data NAKON:", JSON.stringify(params.args.data));

    if (params.action === 'upsert') {
      if (params.args.create) encryptFields(model, params.args.create);
      if (params.args.update) encryptFields(model, params.args.update);
    }
  }

  if (model && params.action === 'createMany' && Array.isArray(params.args.data)) {
    params.args.data.forEach((item: Record<string, unknown>) => encryptFields(model, item));
  }

  const result = await next(params);

  if (model && result) decryptResult(model, result);

  return result;
};