// src/__mocks__/prisma.ts 
import { vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient } from "@prisma/client";
import { beforeEach } from "vitest";

export const prismaMock = mockDeep<PrismaClient>();


export const prisma = prismaMock;

beforeEach(() => {
  mockReset(prismaMock);
});