import { beforeEach } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { Redis } from "ioredis";

export const redisMock = mockDeep<Redis>();
export const redis = redisMock;

beforeEach(() => {
  mockReset(redisMock);
});