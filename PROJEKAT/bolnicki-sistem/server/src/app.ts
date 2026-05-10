// src/app.ts
/*
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/router.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("Bolnički sistem API radi!");
});

export default app;*/
// src/app.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/router.js";

import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
//app.use(cors());
/*app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));*/
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || "https://bolnicki-sistem-rezervacija.onrender.com",
    "http://localhost:5173",
  ],
  credentials: true,
}));
app.use(express.json());

// Test-only middleware — aktivan SAMO u test okruženju
// Kad dodaš JWT, ovaj blok ostaje netaknut, dodaš JWT middleware ispod
if (process.env.NODE_ENV === "test") {
  app.use((req: any, res, next) => {
    const testKorisnikId = req.headers["x-test-korisnik-id"];
    if (testKorisnikId) {
      req.korisnik = { id: Number(testKorisnikId) };
    }
    next();
  });
}

// TODO: kad implementiraš JWT, dodaj ovdje:
// app.use(jwtMiddleware);

app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("Bolnički sistem API radi!");
});

// Socket.io setup za NFR-09
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.CORS_ORIGIN || "https://bolnicki-sistem-rezervacija.onrender.com",
      "http://localhost:5173",
    ],
    credentials: true,
  },
});

// Error middleware — mora biti zadnji
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const status = err.status || 500;
    const poruka = err.poruka || 'Interna greška servera.';
    res.status(status).json({ poruka });
});
export { io, httpServer };
export default app;