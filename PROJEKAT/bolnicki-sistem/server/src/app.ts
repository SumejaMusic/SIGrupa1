// src/app.ts
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

export default app;