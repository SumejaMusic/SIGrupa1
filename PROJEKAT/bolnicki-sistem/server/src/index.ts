process.on("uncaughtException", (err: any) => {
  console.error("GREŠKA:", err?.message || err);
  console.error("STACK:", err?.stack);
});

process.on("unhandledRejection", (reason: any) => {
  console.error("UNHANDLED REJECTION:", reason);
});

import "dotenv/config";
import app, { httpServer } from "./app.js";
import { pokreniReminderJob } from "./jobs/reminderJob.js";

const PORT = Number(process.env.PORT) || 5000;

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`http://localhost:${PORT}`);
  pokreniReminderJob();
});