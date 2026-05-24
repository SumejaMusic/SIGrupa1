-- Fix stale 'NA_CEKANJU' status rows left over from an older schema version.
-- The current StatusTermina enum only knows: SLOBODAN, ZAKAZAN, POTVRDJEN, OTKAZAN.
-- Prisma 5 throws when deserialising any row whose status is not in the schema enum.
UPDATE "Termin" SET status = 'SLOBODAN' WHERE status::text = 'NA_CEKANJU';
