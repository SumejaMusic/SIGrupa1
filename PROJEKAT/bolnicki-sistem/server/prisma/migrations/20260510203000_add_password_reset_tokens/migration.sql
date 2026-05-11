CREATE TABLE "PasswordResetToken" (
    "id" SERIAL NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "idKorisnika" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_idKorisnika_idx" ON "PasswordResetToken"("idKorisnika");

ALTER TABLE "PasswordResetToken"
ADD CONSTRAINT "PasswordResetToken_idKorisnika_fkey"
FOREIGN KEY ("idKorisnika") REFERENCES "Korisnik"("id") ON DELETE CASCADE ON UPDATE CASCADE;
