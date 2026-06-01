import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

const { mockNeighborhood } = vi.hoisted(() => ({
	mockNeighborhood: {
		findMany: vi.fn(),
	},
}))

vi.mock('@prisma/client', () => ({
	PrismaClient: class {
		neighborhood = mockNeighborhood
	},
}))

import neighborhoodsRouter from '../routes/neighborhoods.js'

const buildApp = () => {
	const app = express()
	app.use(express.json())
	app.use('/neighborhoods', neighborhoodsRouter)
	return app
}

const fakeNeighborhood = { id: 1, name: 'Osiedle Słoneczne' }

// ─── GET /neighborhoods ───────────────────────────────────────────────────────

describe('GET /neighborhoods', () => {
	beforeEach(() => vi.clearAllMocks())

	it('zwraca listę osiedli posortowaną alfabetycznie', async () => {
		const sorted = [
			{ id: 2, name: 'Osiedle Azalia' },
			{ id: 1, name: 'Osiedle Słoneczne' },
		]
		mockNeighborhood.findMany.mockResolvedValue(sorted)

		const res = await request(buildApp()).get('/neighborhoods')

		expect(res.status).toBe(200)
		expect(res.body).toHaveLength(2)
		expect(res.body[0].name).toBe('Osiedle Azalia')
		expect(mockNeighborhood.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ orderBy: { name: 'asc' } })
		)
	})

	it('zwraca pustą listę gdy brak osiedli', async () => {
		mockNeighborhood.findMany.mockResolvedValue([])

		const res = await request(buildApp()).get('/neighborhoods')

		expect(res.status).toBe(200)
		expect(res.body).toHaveLength(0)
	})

	it('zwraca 500 gdy Prisma rzuca błąd', async () => {
		mockNeighborhood.findMany.mockRejectedValue(new Error('DB error'))

		const res = await request(buildApp()).get('/neighborhoods')

		expect(res.status).toBe(500)
	})
})