//glavni entry point cijele aplikacije

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
//import { PrismaClient } from '@prisma/client';

import routes from "./routes/router.js";


dotenv.config();

const app = express();
//const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

//Ova linija registruje sve tvoje na server
// i dodaje /api prefiks svima. 
// Bez nje server ne zna da rute uopće postoje.
app.use("/api", routes); 

app.get('/', (req, res) => {
  res.send('Bolnički sistem API radi!');
});

app.listen(PORT, () => {
  console.log(`Server trči na http://localhost:${PORT}`);
});