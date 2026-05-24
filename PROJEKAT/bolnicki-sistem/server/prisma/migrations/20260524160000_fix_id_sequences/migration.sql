-- Reset all autoincrement sequences to MAX(id) to fix seed-data desync.
-- Rows inserted with explicit IDs (upsert in seed.ts) do not advance the
-- PostgreSQL sequence, causing "Unique constraint failed on id" on next INSERT.

SELECT setval(pg_get_serial_sequence('"Odjel"',              'id'), COALESCE((SELECT MAX(id) FROM "Odjel"),              1));
SELECT setval(pg_get_serial_sequence('"Korisnik"',           'id'), COALESCE((SELECT MAX(id) FROM "Korisnik"),           1));
SELECT setval(pg_get_serial_sequence('"Doktor"',             'id'), COALESCE((SELECT MAX(id) FROM "Doktor"),             1));
SELECT setval(pg_get_serial_sequence('"Pacijent"',           'id'), COALESCE((SELECT MAX(id) FROM "Pacijent"),           1));
SELECT setval(pg_get_serial_sequence('"MediciskoOsoblje"',   'id'), COALESCE((SELECT MAX(id) FROM "MediciskoOsoblje"),   1));
SELECT setval(pg_get_serial_sequence('"Soba"',               'id'), COALESCE((SELECT MAX(id) FROM "Soba"),               1));
SELECT setval(pg_get_serial_sequence('"Termin"',             'id'), COALESCE((SELECT MAX(id) FROM "Termin"),             1));
SELECT setval(pg_get_serial_sequence('"Rezervacije"',        'id'), COALESCE((SELECT MAX(id) FROM "Rezervacije"),        1));
SELECT setval(pg_get_serial_sequence('"AuditLog"',           'id'), COALESCE((SELECT MAX(id) FROM "AuditLog"),           1));
SELECT setval(pg_get_serial_sequence('"HistorijaPregleda"',  'id'), COALESCE((SELECT MAX(id) FROM "HistorijaPregleda"),  1));
SELECT setval(pg_get_serial_sequence('"RasporedDoktora"',    'id'), COALESCE((SELECT MAX(id) FROM "RasporedDoktora"),    1));
SELECT setval(pg_get_serial_sequence('"TipPregleda"',        'id'), COALESCE((SELECT MAX(id) FROM "TipPregleda"),        1));
SELECT setval(pg_get_serial_sequence('"ListaCekanja"',       'id'), COALESCE((SELECT MAX(id) FROM "ListaCekanja"),       1));
SELECT setval(pg_get_serial_sequence('"Recept"',             'id'), COALESCE((SELECT MAX(id) FROM "Recept"),             1));
SELECT setval(pg_get_serial_sequence('"Podsjetnik"',         'id'), COALESCE((SELECT MAX(id) FROM "Podsjetnik"),         1));
SELECT setval(pg_get_serial_sequence('"Komentar"',           'id'), COALESCE((SELECT MAX(id) FROM "Komentar"),           1));
SELECT setval(pg_get_serial_sequence('"PasswordResetToken"', 'id'), COALESCE((SELECT MAX(id) FROM "PasswordResetToken"), 1));
