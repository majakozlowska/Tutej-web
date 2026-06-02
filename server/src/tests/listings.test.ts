import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../index.js';

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      listing = {
        findMany: vi.fn().mockResolvedValue([
          { id: 2, title: 'Nowsze ogłoszenie', createdAt: new Date('2026-06-02') },
          { id: 1, title: 'Starsze ogłoszenie', createdAt: new Date('2026-06-01') }
        ]),
        
        create: vi.fn().mockImplementation((args) => {
          return Promise.resolve({
            id: 123,
            title: args.data.title,
            price: args.data.price, 
            authorId: args.data.authorId, 
            neighborhoodId: args.data.neighborhoodId 
          });
        }),

        update: vi.fn().mockImplementation((args) => {
          return Promise.resolve({
            id: args.where.id,
            status: args.data.status
          });
        })
      };

      user = {
        findUnique: vi.fn().mockImplementation((args) => {
          if (args.where.id === 5) {
            return Promise.resolve({ id: 5, neighborhoodId: 99 });
          }
          return Promise.resolve(null);
        })
      };

      event = { findMany: vi.fn() };
      neighborhood = { findMany: vi.fn() };
      announcement = { findMany: vi.fn() };
    }
  };
});

describe('Listings Router - Testy Logiki i Walidacji (Bez tautologii)', () => {

  describe('POST /api/listings', () => {
    it('powinien poprawnie sparsować Stringi na typy liczbowe oraz automatycznie przypisać osiedle autora', async () => {
      const payload = {
        title: 'Rower miejski',
        description: 'W dobrym stanie',
        price: '150.50', 
        contact: '123456789',
        authorId: '5',  
        images: ['data:image/png;base64,xyz']
      };

      const response = await request(app).post('/api/listings').send(payload);

      expect(response.status).toBe(201);
      
      expect(response.body.price).toBe(150.50);
      expect(typeof response.body.price).toBe('number');

      expect(response.body.authorId).toBe(5);

      expect(response.body.neighborhoodId).toBe(99);
    });

    it('powinien zwrócić błąd 404, jeśli wskazany authorId nie istnieje w systemie', async () => {
      const payload = {
        title: 'Szafa',
        description: 'Oddam za darmo',
        contact: '999',
        authorId: '9999', 
        images: ['img.jpg']
      };

      const response = await request(app).post('/api/listings').send(payload);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Użytkownik nie znaleziony');
    });

    it('powinien wypluć 400, gdy tablica zdjęć jest pusta', async () => {
      const payload = {
        title: 'Szafa',
        description: 'Opis',
        contact: '999',
        authorId: '5',
        images: [] 
      };

      const response = await request(app).post('/api/listings').send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Brak wymaganych pól lub zdjęć');
    });
  });

  describe('PATCH /api/listings/:id/status', () => {
    it('powinien pomyślnie zaktualizować status, gdy podano wartość z bezpiecznej listy (Enum)', async () => {
      const response = await request(app)
        .patch('/api/listings/42/status')
        .send({ status: 'RESERVED' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('RESERVED');
    });

    it('powinien bezwzględnie odrzucić żądanie (400), gdy status jest spoza dozwolonego słownika', async () => {
      const response = await request(app)
        .patch('/api/listings/42/status')
        .send({ status: 'KUPIONE_PRZEZ_SASIADA' }); 

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid data');
    });
  });
});