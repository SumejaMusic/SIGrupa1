import { Redis } from "ioredis";

type LockRecord = {
  value: string;
  expiresAt: number;
};

const memoryLocks = new Map<string, LockRecord>();

const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    })
  : null;

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

  async del(key: string) {
    if (redisClient) {
      try {
        await redisClient.del(key);
      } catch {
        memoryLocks.delete(key);
        return;
      }
    }

    memoryLocks.delete(key);
  },
};
