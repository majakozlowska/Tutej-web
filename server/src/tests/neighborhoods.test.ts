import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../index.js';

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      neighborhood = {
        findMany: vi.fn().mockImplementation((args) => {
          const unsortedData = [
            { id: 1, name: 'Wilda' },
            { id: 2, name: 'Jeżyce' },
            { id: 3, name: 'Grunwald' }
          ];

          if (args?.orderBy?.name === 'asc') {
            return Promise.resolve(
              [...unsortedData].sort((a, b) => a.name.localeCompare(b.name))
            );
          }

          return Promise.resolve(unsortedData);
        })
      };
      event = { findMany: vi.fn() };
      user = { findUnique: vi.fn() };
      announcement = { findMany: vi.fn() };
    }
  };
});

describe('Neighborhoods Router - Testy bez bazy (Nietautologiczne)', () => {

  describe('GET /api/neighborhoods', () => {
    it('powinien zwrócić status 200 oraz listę osiedli ułożoną ALFABETYCZNIE', async () => {
      const response = await request(app).get('/api/neighborhoods');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);

      expect(response.body[0].name).toBe('Grunwald');
      expect(response.body[1].name).toBe('Jeżyce');
      expect(response.body[2].name).toBe('Wilda');
    });
  });
});