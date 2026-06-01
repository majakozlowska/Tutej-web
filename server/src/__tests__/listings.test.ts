import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

const { mockListing, mockUser } = vi.hoisted(() => ({
	mockListing: {
		findMany: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
	},
	mockUser: {
		findUnique: vi.fn(),
	},
}))

vi.mock('@prisma/client', () => ({
	PrismaClient: class {
		listing = mockListing
		user = mockUser
	},
}))

import listingsRouter from '../routes/listings.js'

const buildApp = () => {
	const app = express()
	app.use(express.json())
	app.use('/listings', listingsRouter)
	return app
}

const fakeUser = { id: 1, neighborhoodId: 10 }

const fakeListing = {
	id: 1,
	title: 'Rower górski',
	description: 'Stan bardzo dobry',
	price: 500.0,
	contact: '123456789',
	status: 'AVAILABLE',
	authorId: 1,
	neighborhoodId: 10,
	createdAt: new Date().toISOString(),
	author: { firstName: 'Jan', lastName: 'Kowalski', photo: null },
	images: [{ id: 1, url: 'http://img.example.com/bike.jpg', listingId: 1 }],
}

// ─── GET /listings ────────────────────────────────────────────────────────────

describe('GET /listings', () => {
	beforeEach(() => vi.clearAllMocks())

	it('zwraca listę ogłoszeń', async () => {
		mockListing.findMany.mockResolvedValue([fakeListing])

		const res = await request(buildApp()).get('/listings')

		expect(res.status).toBe(200)
		expect(res.body).toHaveLength(1)
		expect(res.body[0].title).toBe('Rower górski')
	})

	it('zwraca pustą listę gdy brak ogłoszeń', async () => {
		mockListing.findMany.mockResolvedValue([])

		const res = await request(buildApp()).get('/listings')

		expect(res.status).toBe(200)
		expect(res.body).toHaveLength(0)
	})

	it('zwraca 500 gdy Prisma rzuca błąd', async () => {
		mockListing.findMany.mockRejectedValue(new Error('DB error'))

		const res = await request(buildApp()).get('/listings')

		expect(res.status).toBe(500)
	})
})

// ─── POST /listings ───────────────────────────────────────────────────────────

describe('POST /listings', () => {
	beforeEach(() => vi.clearAllMocks())

	const validPayload = {
		title: 'Rower górski',
		description: 'Stan bardzo dobry',
		contact: '123456789',
		authorId: '1',
		images: ['base64encodedimage1'],
	}

	it('tworzy nowe ogłoszenie', async () => {
		mockUser.findUnique.mockResolvedValue(fakeUser)
		mockListing.create.mockResolvedValue(fakeListing)

		const res = await request(buildApp()).post('/listings').send(validPayload)

		expect(res.status).toBe(201)
		expect(res.body.title).toBe('Rower górski')
		expect(mockListing.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					neighborhoodId: fakeUser.neighborhoodId,
					authorId: 1,
					images: {
						create: [{ url: 'base64encodedimage1' }],
					},
				}),
			})
		)
	})

	it('zwraca 400 gdy brakuje wymaganych pól', async () => {
		const res = await request(buildApp()).post('/listings').send({ title: 'Tylko tytuł' })

		expect(res.status).toBe(400)
		expect(res.body.error).toBe('Brak wymaganych pól lub zdjęć')
	})

	it('zwraca 400 gdy tablica images jest pusta', async () => {
		const res = await request(buildApp())
			.post('/listings')
			.send({ ...validPayload, images: [] })

		expect(res.status).toBe(400)
	})

	it('zwraca 404 gdy autor nie istnieje', async () => {
		mockUser.findUnique.mockResolvedValue(null)

		const res = await request(buildApp()).post('/listings').send(validPayload)

		expect(res.status).toBe(404)
		expect(res.body.error).toBe('Użytkownik nie znaleziony')
	})

	it('tworzy ogłoszenie z ceną gdy podana', async () => {
		mockUser.findUnique.mockResolvedValue(fakeUser)
		mockListing.create.mockResolvedValue(fakeListing)

		await request(buildApp())
			.post('/listings')
			.send({ ...validPayload, price: '500.00' })

		expect(mockListing.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ price: 500.0 }),
			})
		)
	})

	it('zwraca 500 gdy Prisma rzuca błąd', async () => {
		mockUser.findUnique.mockResolvedValue(fakeUser)
		mockListing.create.mockRejectedValue(new Error('DB error'))

		const res = await request(buildApp()).post('/listings').send(validPayload)

		expect(res.status).toBe(500)
	})
})

// ─── PATCH /listings/:id/status ───────────────────────────────────────────────

describe('PATCH /listings/:id/status', () => {
	beforeEach(() => vi.clearAllMocks())

	it('aktualizuje status na RESERVED', async () => {
		mockListing.update.mockResolvedValue({ ...fakeListing, status: 'RESERVED' })

		const res = await request(buildApp())
			.patch('/listings/1/status')
			.send({ status: 'RESERVED' })

		expect(res.status).toBe(200)
		expect(res.body.status).toBe('RESERVED')
		expect(mockListing.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: 1 },
				data: { status: 'RESERVED' },
			})
		)
	})

	it('aktualizuje status na SOLD', async () => {
		mockListing.update.mockResolvedValue({ ...fakeListing, status: 'SOLD' })

		const res = await request(buildApp())
			.patch('/listings/1/status')
			.send({ status: 'SOLD' })

		expect(res.status).toBe(200)
		expect(res.body.status).toBe('SOLD')
	})

	it('zwraca 400 gdy status jest nieprawidłowy', async () => {
		const res = await request(buildApp())
			.patch('/listings/1/status')
			.send({ status: 'INVALID_STATUS' })

		expect(res.status).toBe(400)
		expect(res.body.error).toBe('Invalid data')
	})

	it('zwraca 400 gdy id nie jest liczbą', async () => {
		const res = await request(buildApp())
			.patch('/listings/abc/status')
			.send({ status: 'AVAILABLE' })

		expect(res.status).toBe(400)
	})

	it('zwraca 500 gdy Prisma rzuca błąd', async () => {
		mockListing.update.mockRejectedValue(new Error('DB error'))

		const res = await request(buildApp())
			.patch('/listings/1/status')
			.send({ status: 'AVAILABLE' })

		expect(res.status).toBe(500)
	})
})