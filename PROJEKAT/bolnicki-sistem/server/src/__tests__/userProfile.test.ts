import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import userRoutes from '../routes/userRoutes.js';

// Mock the prisma client
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    korisnik: {
      findUnique: vi.fn(),
      update: vi.fn(),
    }
  }
}));

import { prisma } from '../lib/prisma.js';

const app = express();
app.use(express.json());

// Mock auth middleware for testing
vi.mock('../middleware/authMiddleware.js', () => ({
  autentifikuj: (req: any, res: any, next: any) => {
    req.korisnik = {
      id: 1,
      uloga: 'PACIJENT'
    };
    next();
  }
}));

app.use('/users', userRoutes);

describe('User Profile API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /users/:id/profile', () => {
    it('trebalo bi vratiti podatke profila za validan id', async () => {
      const mockUser = { id: 1, ime: 'Test', prezime: 'Testic', email: 'test@test.com', brojTelefona: '12345', datumRodjenja: new Date('1990-01-01'), uloga: 'PACIJENT' };
      (prisma.korisnik.findUnique as any).mockResolvedValue(mockUser);

      const res = await request(app).get('/users/1/profile');
      expect(res.status).toBe(200);
      expect(res.body.ime).toBe('Test');
    });

    it('trebalo bi vratiti 403 ako korisnik pristupa tudjem profilu', async () => {
      const res = await request(app).get('/users/2/profile');
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /users/:id/profile', () => {
    it('trebalo bi uspješno ažurirati profil', async () => {
      const mockUpdatedUser = { id: 1, ime: 'NovoIme', prezime: 'NovoPrezime', email: 'test@test.com', brojTelefona: '98765', datumRodjenja: new Date('1990-01-01') };
      (prisma.korisnik.update as any).mockResolvedValue(mockUpdatedUser);

      const res = await request(app)
        .patch('/users/1/profile')
        .send({
          ime: 'NovoIme',
          prezime: 'NovoPrezime',
          brojTelefona: '98765',
          datumRodjenja: '1990-01-01'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.poruka).toBe('Profil uspješno ažuriran');
      expect(res.body.korisnik.ime).toBe('NovoIme');
    });

    it('trebalo bi vratiti grešku za nevalidan datum', async () => {
      const res = await request(app)
        .patch('/users/1/profile')
        .send({ datumRodjenja: 'nevalidan-datum' });
      
      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].msg).toBe('Nevalidan format datuma');
    });
  });
});
