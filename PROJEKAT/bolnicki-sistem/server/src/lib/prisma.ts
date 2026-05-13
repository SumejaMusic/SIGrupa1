// singleton instanca; bitno

import { PrismaClient } from "@prisma/client";
import { applyEncryptionMiddleware } from "./prismaEncryptionMiddleware.js";

const prisma = new PrismaClient();

prisma.$use(applyEncryptionMiddleware);

export { prisma };