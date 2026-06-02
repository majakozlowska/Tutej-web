import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      announcement = {
        findMany: vi.fn().mockImplementation((args) => {
          const mockData = [
            { id: 1, title: 'Ogłoszenie Osiedle A', neighborhoodId: 10, authorId: 1 },
            { id: 2, title: 'Ogłoszenie Osiedle B', neighborhoodId: 20, authorId: 2 }
          ];
          if (args?.where?.neighborhoodId) {
            return Promise.resolve(mockData.filter(item => item.neighborhoodId === args.where.neighborhoodId));
          }
          return Promise.resolve(mockData);
        }),
        findUnique: vi.fn().mockImplementation((args) => {
          if (args.where.id === 1) {
            return Promise.resolve({ id: 1, title: 'Ogłoszenie Istniejące', authorId: 1 });
          }
          return Promise.resolve(null);
        }),
        create: vi.fn().mockResolvedValue({
          id: 99,
          title: 'Nowe Ogłoszenie',
          content: 'Treść',
          authorId: 1,
          neighborhoodId: 5
        })
      };
      user = { findUnique: vi.fn() };
      neighborhood = { findMany: vi.fn() };
    }
  };
});

vi.mock('../routes/auth.js', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual, 
    authenticate: (req: any, res: any, next: any) => {
      req.user = { id: 1, neighborhoodId: 5, role: 'USER' };
      next();
    }
  };
});

describe('Notices Router - Testy bez bazy (Nietautologiczne)', () => {

  describe('GET /api/notices', () => {
    it('powinien zwrócić wszystkie ogłoszenia, gdy nie przekazano query param', async () => {
      const response = await request(app).get('/api/notices');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('powinien poprawnie przefiltrować wyniki po podaniu ?neighborhoodId=10', async () => {
      const response = await request(app).get('/api/notices?neighborhoodId=10');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Ogłoszenie Osiedle A');
    });
  });

  describe('GET /api/notices/:noticeId', () => {
    it('powinien zwrócić szczegóły ogłoszenia dla poprawnego ID', async () => {
      const response = await request(app).get('/api/notices/1');
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Ogłoszenie Istniejące');
    });

    it('powinien zwrócić status 404, gdy ogłoszenie nie istnieje w bazie', async () => {
      const response = await request(app).get('/api/notices/999');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Ogłoszenie nie znalezione');
    });
  });

  describe('POST /api/notices', () => {
    it('powinien pomyślnie utworzyć ogłoszenie przypisując dane z zalogowanego użytkownika', async () => {
      const payload = {
        title: 'Nowe Ogłoszenie',
        content: 'Treść'
      };

      const response = await request(app).post('/api/notices').send(payload);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(99);
      expect(response.body.neighborhoodId).toBe(5); 
    });
  });
});