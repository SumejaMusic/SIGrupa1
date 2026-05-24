-- CreateTable for staff weekly schedule templates
CREATE TABLE "RasporedOsoblja" (
    "id" SERIAL NOT NULL,
    "idOsoblje" INTEGER NOT NULL,
    "danUSedmici" "DanUSedmici" NOT NULL,
    "vrijemeOd" TIME(6) NOT NULL,
    "vrijemeDo" TIME(6) NOT NULL,
    "aktivan" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "RasporedOsoblja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RasporedOsoblja_idOsoblje_danUSedmici_key" ON "RasporedOsoblja"("idOsoblje", "danUSedmici");

-- AddForeignKey
ALTER TABLE "RasporedOsoblja" ADD CONSTRAINT "RasporedOsoblja_idOsoblje_fkey" FOREIGN KEY ("idOsoblje") REFERENCES "MediciskoOsoblje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
