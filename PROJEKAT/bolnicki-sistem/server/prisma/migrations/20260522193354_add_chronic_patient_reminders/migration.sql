-- AlterTable
ALTER TABLE "Pacijent" ADD COLUMN     "reviewPeriodDays" INTEGER,
ADD COLUMN     "zadnjiRutinskiPregledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ReminderLog" (
    "id" SERIAL NOT NULL,
    "idPacijent" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,

    CONSTRAINT "ReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReminderLog_idPacijent_idx" ON "ReminderLog"("idPacijent");

-- CreateIndex
CREATE INDEX "ReminderLog_sentAt_idx" ON "ReminderLog"("sentAt");

-- CreateIndex
CREATE INDEX "ReminderLog_idPacijent_sentAt_idx" ON "ReminderLog"("idPacijent", "sentAt");

-- AddForeignKey
ALTER TABLE "ReminderLog" ADD CONSTRAINT "ReminderLog_idPacijent_fkey" FOREIGN KEY ("idPacijent") REFERENCES "Pacijent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
