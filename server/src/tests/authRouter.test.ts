import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import bcrypt from 'bcrypt';

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      user = {
        findUnique: vi.fn().mockImplementation((args) => {
          if (args.where.email === 'zajety@test.pl') {
            return Promise.resolve({
              id: 1,
              email: 'zajety@test.pl',
              password: 'hashed_password_123', 
              role: 'USER',
              neighborhoodId: 5
            });
          }
          if (args.where.id === 10) {
            return Promise.resolve({
              id: 10,
              email: 'jan@test.pl',
              password: 'hashed_stare_haslo',
              role: 'USER',
              neighborhoodId: 5
            });
          }
          return Promise.resolve(null); 
        }),
        create: vi.fn().mockResolvedValue({
          id: 2,
          email: 'nowy@test.pl',
          role: 'USER',
          neighborhoodId: 5
        }),
        update: vi.fn().mockResolvedValue({ message: 'Zaktualizowano' })
      };
      event = { findMany: vi.fn() };
      neighborhood = { findMany: vi.fn() };
      announcement = { findMany: vi.fn() };
    }
  };
});

vi.mock('jose', () => {
  return {
    SignJWT: class {
      setProtectedHeader() { return this; }
      setExpirationTime() { return this; }
      sign() { return Promise.resolve('sztuczny_token_jwt_123'); }
    },
    jwtVerify: vi.fn().mockResolvedValue({
      payload: { id: 10, email: 'jan@test.pl', role: 'USER', neighborhoodId: 5 }
    }),
    TextEncoder: class {
      encode() { return new Uint8Array(); }
    }
  };
});

describe('Auth Router - Testy Logiki Biznesowej (Bez tautologii)', () => {

  describe('POST /api/auth/register', () => {
    it('powinien zwrócić błąd 409, gdy użytkownik próbuje zarejestrować zajęty adres e-mail', async () => {
      const payload = {
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'zajety@test.pl', 
        password: 'haslo',
        neighborhoodId: 5
      };

      const response = await request(app).post('/api/auth/register').send(payload);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Email już istnieje.');
    });
  });

  describe('POST /api/auth/login', () => {
    it('powinien odmówić dostępu (401), gdy hasło nie zgadza się z hashem w bazie danych', async () => {
      const bcryptCompareSpy = vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const payload = {
        email: 'zajety@test.pl',
        password: 'zle_haslo_uzytkownika'
      };

      const response = await request(app).post('/api/auth/login').send(payload);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Nieprawidłowy email lub hasło.');
      expect(response.body.token).toBeUndefined(); 

      bcryptCompareSpy.mockRestore(); 
    });
  });

  describe('PUT /api/auth/me/password', () => {
    it('powinien zwrócić błąd 400, jeśli podane "obecne hasło" jest nieprawidłowe', async () => {
      const bcryptCompareSpy = vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const payload = {
        currentPassword: 'bledne_stare_haslo',
        newPassword: 'nowe_super_haslo_123'
      };

      const response = await request(app)
        .put('/api/auth/me/password')
        .set('Authorization', 'Bearer poprawny_token')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Nieprawidłowe obecne hasło.');

      bcryptCompareSpy.mockRestore();
    });
  });
});