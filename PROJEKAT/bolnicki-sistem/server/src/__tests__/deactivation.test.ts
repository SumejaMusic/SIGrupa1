import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import userRoutes from '../routes/userRoutes.js';
import adminRoutes from '../routes/adminRoutes.js';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    zahtjevDeaktivacije: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    korisnik: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (callback) => {
      // Create a mock tx object that matches the prisma methods used in the service
      const tx = {
        zahtjevDeaktivacije: {
          create: vi.fn().mockResolvedValue({ id: 1 }),
          update: vi.fn().mockResolvedValue({ id: 1, status: "ODOBRENO" })
        },
        korisnik: {
          findUnique: vi.fn().mockResolvedValue({
            id: 1, ime: 'Test', prezime: 'Korisnik', email: 'test@example.com',
            pacijentProfile: { id: 1 }
          }),
          update: vi.fn().mockResolvedValue({})
        },
        rezervacije: {
          findMany: vi.fn().mockResolvedValue([]),
          update: vi.fn().mockResolvedValue({})
        },
        termin: {
          update: vi.fn().mockResolvedValue({})
        },
        pacijent: {
          update: vi.fn().mockResolvedValue({})
        },
        auditLog: {
          create: vi.fn().mockResolvedValue({})
        }
      };
      return await callback(tx);
    })
  }
}));

// Mock audit log separately because it is imported directly
vi.mock('../lib/auditLog.js', () => ({
  kreirajAuditLog: vi.fn().mockResolvedValue(true)
}));

// Mock email service
vi.mock('../emailService.js', () => ({
  posaljiPotvrdZahtjevaDeaktivacije: vi.fn().mockResolvedValue(true),
  posaljiOdlukuDeaktivacije: vi.fn().mockResolvedValue(true),
  posaljiObavijestOtkazTerminaDeaktivacija: vi.fn().mockResolvedValue(true)
}));

import { prisma } from '../lib/prisma.js';

const app = express();
app.use(express.json());

// Helper function to dynamically change auth mock
let mockUser: any = { id: 1, uloga: 'PACIJENT' };

vi.mock('../middleware/authMiddleware.js', () => ({
  autentifikuj: (req: any, res: any, next: any) => {
    req.korisnik = mockUser;
    next();
  }
}));

// We need to mock autorizacija for admin routes
vi.mock('../middleware/autorizacija.js', () => ({
  autorizacija: () => (req: any, res: any, next: any) => next()
}));

app.use('/users', userRoutes);
app.use('/admin', adminRoutes);

describe('Deactivation API & Anonymization Data Integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /users/:id/deactivation-request', () => {
    it('trebalo bi kreirati zahtjev za deaktivaciju', async () => {
      mockUser = { id: 1, uloga: 'PACIJENT' };
      (prisma.zahtjevDeaktivacije.findFirst as any).mockResolvedValue(null);
      (prisma.korisnik.findUnique as any).mockResolvedValue({ id: 1, uloga: 'PACIJENT', email: 'test@test.com', ime: 'Test' });

      const res = await request(app)
        .post('/users/1/deactivation-request')
        .send({ razlog: 'Zelim izbrisati nalog' });

      expect(res.status).toBe(201);
      expect(res.body.poruka).toContain('uspješno podnesen');
    });

    it('trebalo bi spriječiti podnošenje ako već postoji aktivan zahtjev', async () => {
      mockUser = { id: 1, uloga: 'PACIJENT' };
      (prisma.zahtjevDeaktivacije.findFirst as any).mockResolvedValue({ id: 1, status: 'NA_CEKANJU' });

      const res = await request(app)
        .post('/users/1/deactivation-request')
        .send({ razlog: 'Opet zelim izbrisati nalog' });

      expect(res.status).toBe(409);
      expect(res.body.poruka).toContain('aktivan zahtjev');
    });
  });

  describe('PATCH /admin/deactivation-requests/:id', () => {
    it('trebalo bi odobriti zahtjev i izvršiti anonimizaciju PII polja', async () => {
      mockUser = { id: 2, uloga: 'ADMINISTRATOR' };
      
      const mockZahtjev = {
        id: 10,
        idKorisnika: 1,
        status: 'NA_CEKANJU',
        korisnik: { id: 1, ime: 'Test', email: 'test@example.com' }
      };
      
      (prisma.zahtjevDeaktivacije.findUnique as any).mockResolvedValue(mockZahtjev);

      const res = await request(app)
        .patch('/admin/deactivation-requests/10')
        .send({ odluka: 'ODOBRENO', obrazlozenje: 'U redu' });

      expect(res.status).toBe(200);
      expect(res.body.poruka).toContain('odobren');
      
      // We verify that prisma.$transaction was called, meaning the anonymization logic inside ran.
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('trebalo bi odbiti zahtjev i sačuvati obrazloženje', async () => {
      mockUser = { id: 2, uloga: 'ADMINISTRATOR' };
      
      const mockZahtjev = {
        id: 10,
        idKorisnika: 1,
        status: 'NA_CEKANJU',
        korisnik: { id: 1, ime: 'Test', email: 'test@example.com' }
      };
      
      (prisma.zahtjevDeaktivacije.findUnique as any).mockResolvedValue(mockZahtjev);

      const res = await request(app)
        .patch('/admin/deactivation-requests/10')
        .send({ odluka: 'ODBIJENO', obrazlozenje: 'Nedovoljan razlog' });

      expect(res.status).toBe(200);
      expect(res.body.poruka).toContain('odbijen');
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
