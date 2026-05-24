import { Redis } from "ioredis";

type LockRecord = {
  value: string;
  expiresAt: number;
};

const memoryLocks = new Map<string, LockRecord>();
const memorySets = new Map<string, Set<string>>();
const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    })
  : null;

redisClient?.on("error", () => {
  // Redis je opcionalan u lokalu; operacije ispod fallbackaju na in-memory lock.
});

const getMemoryLock = (key: string) => {
  const record = memoryLocks.get(key);

  if (!record) {
    return null;
  }

  if (record.expiresAt <= Date.now()) {
    memoryLocks.delete(key);
    return null;
  }

  return record.value;
};

export const redis = {
  async get(key: string) {
    if (redisClient) {
      try {
        return await redisClient.get(key);
      } catch {
        return getMemoryLock(key);
      }
    }

    return getMemoryLock(key);
  },

  async setex(key: string, ttlSeconds: number, value: string) {
    if (redisClient) {
      try {
        await redisClient.setex(key, ttlSeconds, value);
        return;
      } catch {
        memoryLocks.set(key, {
          value,
          expiresAt: Date.now() + ttlSeconds * 1000,
        });
        return;
      }
    }

    memoryLocks.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },
 async sadd(key: string, ...members: string[]) {
    if (redisClient) {
      try {
        await redisClient.sadd(key, ...members);
        return;
      } catch {
        const set = memorySets.get(key) ?? new Set();
        members.forEach(m => set.add(m));
        memorySets.set(key, set);
        return;
      }
    }
    const set = memorySets.get(key) ?? new Set();
    members.forEach(m => set.add(m));
    memorySets.set(key, set);
  },

  async smembers(key: string): Promise<string[]> {
    if (redisClient) {
      try {
        return await redisClient.smembers(key);
      } catch {
        return Array.from(memorySets.get(key) ?? []);
      }
    }
    return Array.from(memorySets.get(key) ?? []);
  },

  async expire(key: string, ttlSeconds: number) {
    if (redisClient) {
      try {
        await redisClient.expire(key, ttlSeconds);
        return;
      } catch {}
    }
    // Za memory fallback expire nije kritičan — setovi se čiste kad se termin oslobodi
  },
  async del(key: string) {
    if (redisClient) {
      try {
        await redisClient.del(key);
      } catch {
        memoryLocks.delete(key);
        memorySets.delete(key); // ← dodaj i ovo
        return;
      }
    }

    memoryLocks.delete(key);
    memorySets.delete(key);
  },
  async ttl(key: string): Promise<number> {
    if (redisClient) {
      try {
        return await redisClient.ttl(key);
      } catch {
        const record = memoryLocks.get(key);
        if (!record || record.expiresAt <= Date.now()) return -2;
        return Math.ceil((record.expiresAt - Date.now()) / 1000);
      }
    }

    const record = memoryLocks.get(key);
    if (!record || record.expiresAt <= Date.now()) return -2;
    return Math.ceil((record.expiresAt - Date.now()) / 1000);
  },
};
