import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../index.js';

let mockUser = { id: 10, neighborhoodId: 5, role: 'USER' };

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      forum = {
        findMany: vi.fn().mockResolvedValue([
          { id: 1, name: 'Ogólne', neighborhoodId: 5 }
        ])
      };

      post = {
        findMany: vi.fn().mockImplementation((args) => {
          const allPosts = [
            { id: 101, title: 'Malowanie klatki', content: 'Kiedy będzie malowanie?', forumId: 1 },
            { id: 102, title: 'Zgubiono klucze', content: 'Znaleziono pęk kluczy pod blokiem', forumId: 1 }
          ];

          if (args?.where?.OR) {
            const searchStr = args.where.OR[0].title.contains.toLowerCase();
            return Promise.resolve(allPosts.filter(p => 
              p.title.toLowerCase().includes(searchStr) || p.content.toLowerCase().includes(searchStr)
            ));
          }
          return Promise.resolve(allPosts);
        }),

        findUnique: vi.fn().mockImplementation((args) => {
          if (args.where.id === 101) {
            return Promise.resolve({ id: 101, title: 'Malowanie klatki', authorId: 10 }); 
          }
          if (args.where.id === 102) {
            return Promise.resolve({ id: 102, title: 'Zgubiono klucze', authorId: 99 });  
          }
          return Promise.resolve(null);
        }),
        
        create: vi.fn().mockResolvedValue({ id: 200, title: 'Nowy Post' }),
        delete: vi.fn().mockResolvedValue({ id: 101 })
      };

      comment = {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 })
      };

      user = { findUnique: vi.fn() };
      neighborhood = { findMany: vi.fn() };
      announcement = { findMany: vi.fn() };
      listing = { findMany: vi.fn() };
    }
  };
});

vi.mock('../routes/auth.js', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    authenticate: (req: any, res: any, next: any) => {
      req.user = mockUser; 
      next();
    }
  };
});

describe('Forums Router - Testy Logiki Biznesowej (Bez tautologii)', () => {

  describe('GET /api/forums/:forumId/posts', () => {
    it('powinien przefiltrować posty i zwrócić tylko te pasujące do frazy ?search=klucze', async () => {
      const response = await request(app).get('/api/forums/1/posts?search=klucze');

      expect(response.status).toBe(200);
      
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(102);
      expect(response.body[0].title).toBe('Zgubiono klucze');
    });

    it('powinien zwrócić błąd 400, jeśli zamiast ID forum w URL podano ciąg tekstowy', async () => {
      const response = await request(app).get('/api/forums/nie-liczba/posts');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Nieprawidłowe ID forum');
    });
  });

  describe('DELETE /api/forums/posts/:postId', () => {
    it('powinien pozwolić na usunięcie posta, jeśli zalogowany użytkownik jest jego autorem', async () => {
      mockUser = { id: 10, neighborhoodId: 5, role: 'USER' };

      const response = await request(app)
        .delete('/api/forums/posts/101')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Post usunięty');
    });

    it('powinien bezwzględnie zablokować próbę usunięcia cudzego posta (403 Forbidden)', async () => {
      mockUser = { id: 10, neighborhoodId: 5, role: 'USER' };

      const response = await request(app)
        .delete('/api/forums/posts/102')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Brak uprawnień');
    });

    it('powinien zezwolić na usunięcie cudzego posta, jeśli zalogowany użytkownik ma rolę ADMIN', async () => {
      mockUser = { id: 10, neighborhoodId: 5, role: 'ADMIN' };

      const response = await request(app)
        .delete('/api/forums/posts/102')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Post usunięty');
    });
  });
});