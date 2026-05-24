// env.ts — ovaj fajl se mora učitati PRVI
process.env.DATABASE_URL = "postgresql://testuser:testpass@localhost:5433/bolnica_test";
process.env.REDIS_URL = "redis://localhost:6380";
process.env.JWT_SECRET = "nekiDugačakTajniKljučKojiNikoNeZna123!";
process.env.NODE_ENV = "test";