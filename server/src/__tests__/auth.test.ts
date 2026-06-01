import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

const { mockUser } = vi.hoisted(() => {
	const mockUser = {
		findUnique: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
	}
	return { mockUser }
})

vi.mock('@prisma/client', () => ({
	PrismaClient: class {
		user = mockUser
	},
}))

vi.mock('bcrypt', () => ({
	default: {
		hash: vi.fn().mockResolvedValue('hashed_password'),
		compare: vi.fn(),
	},
}))

vi.mock('jose', () => ({
	SignJWT: class {
		setProtectedHeader() { return this }
		setExpirationTime() { return this }
		async sign() { return 'mock.jwt.token' }
	},
	jwtVerify: vi.fn(),
}))

import authRouter from '../routes/auth.js'
import bcrypt from 'bcrypt'
import { jwtVerify } from 'jose'

const buildApp = () => {
	const app = express()
	app.use(express.json())
	app.use('/auth', authRouter)
	return app
}

const fakeUser = {
	id: 1,
	firstName: 'Jan',
	lastName: 'Kowalski',
	email: 'jan@example.com',
	password: 'hashed_password',
	photo: null,
	role: 'USER',
	neighborhoodId: 10,
	createdAt: new Date().toISOString(),
}

// ─── POST /auth/register ──────────────────────────────────────────────────────

describe('POST /auth/register', () => {
	beforeEach(() => vi.clearAllMocks())

	it('rejestruje nowego użytkownika i zwraca token', async () => {
		mockUser.findUnique.mockResolvedValue(null)
		mockUser.create.mockResolvedValue(fakeUser)

		const res = await request(buildApp()).post('/auth/register').send({
			firstName: 'Jan',
			lastName: 'Kowalski',
			email: 'jan@example.com',
			password: 'haslo123',
			neighborhoodId: 10,
		})

		expect(res.status).toBe(201)
		expect(res.body.token).toBe('mock.jwt.token')
		expect(res.body.userId).toBe(1)
	})

	it('zwraca 409 gdy email już istnieje', async () => {
		mockUser.findUnique.mockResolvedValue(fakeUser)

		const res = await request(buildApp()).post('/auth/register').send({
			email: 'jan@example.com',
			password: 'haslo123',
		})

		expect(res.status).toBe(409)
		expect(res.body.message).toBe('Email już istnieje.')
	})

	it('zwraca 500 gdy Prisma rzuca błąd', async () => {
		mockUser.findUnique.mockRejectedValue(new Error('DB error'))

		const res = await request(buildApp()).post('/auth/register').send({
			email: 'jan@example.com',
			password: 'haslo123',
		})

		expect(res.status).toBe(500)
	})
})

// ─── POST /auth/login ─────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
	beforeEach(() => vi.clearAllMocks())

	it('loguje użytkownika i zwraca token oraz dane', async () => {
		mockUser.findUnique.mockResolvedValue(fakeUser)
		vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

		const res = await request(buildApp()).post('/auth/login').send({
			email: 'jan@example.com',
			password: 'haslo123',
		})

		expect(res.status).toBe(200)
		expect(res.body.token).toBe('mock.jwt.token')
		expect(res.body.user.email).toBe('jan@example.com')
		expect(res.body.user.password).toBeUndefined()
	})

	it('zwraca 401 gdy użytkownik nie istnieje', async () => {
		mockUser.findUnique.mockResolvedValue(null)

		const res = await request(buildApp()).post('/auth/login').send({
			email: 'nieznany@example.com',
			password: 'haslo123',
		})

		expect(res.status).toBe(401)
	})

	it('zwraca 401 gdy hasło jest nieprawidłowe', async () => {
		mockUser.findUnique.mockResolvedValue(fakeUser)
		vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

		const res = await request(buildApp()).post('/auth/login').send({
			email: 'jan@example.com',
			password: 'zle_haslo',
		})

		expect(res.status).toBe(401)
		expect(res.body.message).toBe('Nieprawidłowy email lub hasło.')
	})

	it('zwraca 500 gdy Prisma rzuca błąd', async () => {
		mockUser.findUnique.mockRejectedValue(new Error('DB error'))

		const res = await request(buildApp()).post('/auth/login').send({
			email: 'jan@example.com',
			password: 'haslo123',
		})

		expect(res.status).toBe(500)
	})
})

// ─── GET /auth/me ─────────────────────────────────────────────────────────────

describe('GET /auth/me', () => {
	beforeEach(() => vi.clearAllMocks())

	it('zwraca dane zalogowanego użytkownika', async () => {
		vi.mocked(jwtVerify).mockResolvedValue({
			payload: { id: 1, email: 'jan@example.com', role: 'USER', neighborhoodId: 10 },
		} as never)
		mockUser.findUnique.mockResolvedValue({
			...fakeUser,
			neighborhood: { name: 'Osiedle Słoneczne' },
		})

		const res = await request(buildApp())
			.get('/auth/me')
			.set('Authorization', 'Bearer mock.jwt.token')

		expect(res.status).toBe(200)
		expect(res.body.email).toBe('jan@example.com')
		expect(res.body.neighborhood.name).toBe('Osiedle Słoneczne')
	})

	it('zwraca 401 gdy brak tokena', async () => {
		const res = await request(buildApp()).get('/auth/me')

		expect(res.status).toBe(401)
	})

	it('zwraca 404 gdy użytkownik nie istnieje w bazie', async () => {
		vi.mocked(jwtVerify).mockResolvedValue({
			payload: { id: 999 },
		} as never)
		mockUser.findUnique.mockResolvedValue(null)

		const res = await request(buildApp())
			.get('/auth/me')
			.set('Authorization', 'Bearer mock.jwt.token')

		expect(res.status).toBe(404)
	})

	it('zwraca 401 gdy token jest nieprawidłowy', async () => {
		vi.mocked(jwtVerify).mockRejectedValue(new Error('invalid token'))

		const res = await request(buildApp())
			.get('/auth/me')
			.set('Authorization', 'Bearer zly.token')

		expect(res.status).toBe(401)
	})
})

// ─── PUT /auth/me ─────────────────────────────────────────────────────────────

describe('PUT /auth/me', () => {
	beforeEach(() => vi.clearAllMocks())

	it('aktualizuje dane użytkownika', async () => {
		vi.mocked(jwtVerify).mockResolvedValue({
			payload: { id: 1 },
		} as never)
		const updated = { ...fakeUser, firstName: 'Piotr' }
		mockUser.update.mockResolvedValue(updated)

		const res = await request(buildApp())
			.put('/auth/me')
			.set('Authorization', 'Bearer mock.jwt.token')
			.send({ firstName: 'Piotr', lastName: 'Kowalski' })

		expect(res.status).toBe(200)
		expect(res.body.firstName).toBe('Piotr')
	})

	it('zwraca 401 gdy brak tokena', async () => {
		const res = await request(buildApp()).put('/auth/me').send({ firstName: 'Piotr' })

		expect(res.status).toBe(401)
	})
})

// ─── PUT /auth/me/password ────────────────────────────────────────────────────

describe('PUT /auth/me/password', () => {
	beforeEach(() => vi.clearAllMocks())

	it('zmienia hasło gdy obecne hasło jest poprawne', async () => {
		vi.mocked(jwtVerify).mockResolvedValue({ payload: { id: 1 } } as never)
		mockUser.findUnique.mockResolvedValue(fakeUser)
		vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
		mockUser.update.mockResolvedValue(fakeUser)

		const res = await request(buildApp())
			.put('/auth/me/password')
			.set('Authorization', 'Bearer mock.jwt.token')
			.send({ currentPassword: 'stare_haslo', newPassword: 'nowe_haslo' })

		expect(res.status).toBe(200)
		expect(res.body.message).toBe('Hasło zmienione.')
	})

	it('zwraca 400 gdy obecne hasło jest nieprawidłowe', async () => {
		vi.mocked(jwtVerify).mockResolvedValue({ payload: { id: 1 } } as never)
		mockUser.findUnique.mockResolvedValue(fakeUser)
		vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

		const res = await request(buildApp())
			.put('/auth/me/password')
			.set('Authorization', 'Bearer mock.jwt.token')
			.send({ currentPassword: 'zle_haslo', newPassword: 'nowe_haslo' })

		expect(res.status).toBe(400)
		expect(res.body.message).toBe('Nieprawidłowe obecne hasło.')
	})

	it('zwraca 404 gdy użytkownik nie istnieje', async () => {
		vi.mocked(jwtVerify).mockResolvedValue({ payload: { id: 999 } } as never)
		mockUser.findUnique.mockResolvedValue(null)

		const res = await request(buildApp())
			.put('/auth/me/password')
			.set('Authorization', 'Bearer mock.jwt.token')
			.send({ currentPassword: 'stare', newPassword: 'nowe' })

		expect(res.status).toBe(404)
	})
})