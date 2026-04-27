# API Request Flow: GET /api/termini/:id

Ovaj dokument prikazuje putanju HTTP zahteva od klijenta (Postman) do baze podataka i nazad kroz slojeve aplikacije.

## Dijagram toka

```mermaid
A [Postman: GET /api/termini/1] 
|
--> B [index.ts = app.use('/api', router)]
    | 
    -->C [router.ts = router.use('/termini', terminRoutes)]
        |
        --> D [terminRoutes.ts = router.get('/:id', getTerminById)]
            | 
            -->E [terminController.ts = prisma.termin.findUnique] 
                |
                -->F [(PostgreSQL baza)]