import {Redis} from "ioredis"; //bitno: redis koristi ovakav import 

export const redis = new Redis(process.env.REDIS_URL!, {
  lazyConnect: true, // konekcija se uspostavlja tek kad zatreba
  maxRetriesPerRequest: 3,
});