import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

const { mockEvent, mockUser } = vi.hoisted(() => ({
	mockEvent: {
		findMany: vi.fn(),
		create: vi.fn(),
		delete: vi.fn(),
	},
	mockUser: {
		findUnique: vi.fn(),
	},
}))

vi.mock('@prisma/client', () => ({
	PrismaClient: class {
		event = mockEvent
		user = mockUser
	},
}))

import eventsRouter from '../routes/events.js'

const buildApp = () => {
	const app = express()
	app.use(express.json())
	app.use('/events', eventsRouter)
	return app
}

const fakeUser = { id: 1, neighborhoodId: 10 }

const fakeEvent = {
	id: 1,
	name: 'Festyn osiedlowy',
	description: 'Zabawa dla całej rodziny',
	place: 'Park Centralny',
	date: new Date('2025-07-01').toISOString(),
	duration: '3h',
	price: null,
	image: 'http://img.example.com/event.jpg',
	authorId: 1,
	neighborhoodId: 10,
	createdAt: new Date().toISOString(),
	author: { firstName: 'Jan', lastName: 'Kowalski', photo: null },
}

// ─── GET /events ──────────────────────────────────────────────────────────────

describe('GET /events', () => {
	beforeEach(() => vi.clearAllMocks())

	it('zwraca listę wydarzeń', async () => {
		mockEvent.findMany.mockResolvedValue([fakeEvent])

		const res = await request(buildApp()).get('/events')

		expect(res.status).toBe(200)
		expect(res.body).toHaveLength(1)
		expect(res.body[0].name).toBe('Festyn osiedlowy')
	})

	it('zwraca pustą listę gdy brak wydarzeń', async () => {
		mockEvent.findMany.mockResolvedValue([])

		const res = await request(buildApp()).get('/events')

		expect(res.status).toBe(200)
		expect(res.body).toHaveLength(0)
	})

	it('zwraca 500 gdy Prisma rzuca błąd', async () => {
		mockEvent.findMany.mockRejectedValue(new Error('DB error'))

		const res = await request(buildApp()).get('/events')

		expect(res.status).toBe(500)
	})
})

// ─── POST /events ─────────────────────────────────────────────────────────────

describe('POST /events', () => {
	beforeEach(() => vi.clearAllMocks())

	const validPayload = {
		name: 'Festyn osiedlowy',
		description: 'Zabawa dla całej rodziny',
		place: 'Park Centralny',
		date: '2025-07-01T12:00:00.000Z',
		authorId: '1',
		image: 'http://img.example.com/event.jpg',
	}

	it('tworzy nowe wydarzenie', async () => {
		mockUser.findUnique.mockResolvedValue(fakeUser)
		mockEvent.create.mockResolvedValue(fakeEvent)

		const res = await request(buildApp()).post('/events').send(validPayload)

		expect(res.status).toBe(201)
		expect(res.body.name).toBe('Festyn osiedlowy')
		expect(mockEvent.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					neighborhoodId: fakeUser.neighborhoodId,
					authorId: 1,
				}),
			})
		)
	})

	it('zwraca 400 gdy brakuje wymaganych pól', async () => {
		const res = await request(buildApp()).post('/events').send({ name: 'Tylko nazwa' })

		expect(res.status).toBe(400)
		expect(res.body.error).toBe('Brak wymaganych pól')
	})

	it('zwraca 404 gdy autor nie istnieje', async () => {
		mockUser.findUnique.mockResolvedValue(null)

		const res = await request(buildApp()).post('/events').send(validPayload)

		expect(res.status).toBe(404)
		expect(res.body.error).toBe('Użytkownik nie znaleziony')
	})

	it('tworzy wydarzenie z ceną gdy podana', async () => {
		mockUser.findUnique.mockResolvedValue(fakeUser)
		mockEvent.create.mockResolvedValue({ ...fakeEvent, price: 15.0 })

		await request(buildApp())
			.post('/events')
			.send({ ...validPayload, price: '15.00' })

		expect(mockEvent.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ price: 15.0 }),
			})
		)
	})

	it('zwraca 500 gdy Prisma rzuca błąd', async () => {
		mockUser.findUnique.mockResolvedValue(fakeUser)
		mockEvent.create.mockRejectedValue(new Error('DB error'))

		const res = await request(buildApp()).post('/events').send(validPayload)

		expect(res.status).toBe(500)
	})
})

// ─── DELETE /events/:id ───────────────────────────────────────────────────────

describe('DELETE /events/:id', () => {
	beforeEach(() => vi.clearAllMocks())

	it('usuwa wydarzenie i zwraca 204', async () => {
		mockEvent.delete.mockResolvedValue(fakeEvent)

		const res = await request(buildApp()).delete('/events/1')

		expect(res.status).toBe(204)
		expect(mockEvent.delete).toHaveBeenCalledWith({ where: { id: 1 } })
	})

	it('zwraca 400 gdy id nie jest liczbą', async () => {
		const res = await request(buildApp()).delete('/events/abc')

		expect(res.status).toBe(400)
		expect(res.body.error).toBe('Invalid ID')
	})

	it('zwraca 500 gdy Prisma rzuca błąd', async () => {
		mockEvent.delete.mockRejectedValue(new Error('DB error'))

		const res = await request(buildApp()).delete('/events/1')

		expect(res.status).toBe(500)
	})
})