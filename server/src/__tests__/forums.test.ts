import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

const { mockForum, mockPost, mockComment } = vi.hoisted(() => ({
	mockForum: {
		findMany: vi.fn(),
	},
	mockPost: {
		findMany: vi.fn(),
		findUnique: vi.fn(),
		create: vi.fn(),
		delete: vi.fn(),
	},
	mockComment: {
		findMany: vi.fn(),
		findUnique: vi.fn(),
		create: vi.fn(),
		deleteMany: vi.fn(),
		delete: vi.fn(),
	},
}))

vi.mock('@prisma/client', () => ({
	PrismaClient: class {
		forum = mockForum
		post = mockPost
		comment = mockComment
	},
}))

vi.mock('../routes/auth.js', () => ({
	authenticate: (req: any, _res: any, next: any) => {
		req.user = { id: 1, neighborhoodId: 10, role: 'USER' }
		next()
	},
}))

import forumsRouter from '../routes/forum.js'

const buildApp = () => {
	const app = express()
	app.use(express.json())
	app.use('/forums', forumsRouter)
	return app
}

const fakeAuthor = { id: 1, firstName: 'Jan', lastName: 'Kowalski', photo: null }

const fakeForum = {
	id: 1,
	name: 'Ogólne',
	description: 'Forum ogólne',
	icon: null,
	neighborhoodId: 10,
	createdAt: new Date().toISOString(),
	_count: { posts: 5 },
}

const fakePost = {
	id: 1,
	title: 'Pytanie o parking',
	content: 'Gdzie można parkować?',
	media: null,
	authorId: 1,
	neighborhoodId: 10,
	forumId: 1,
	createdAt: new Date().toISOString(),
	author: fakeAuthor,
	_count: { comments: 2 },
}

const fakeComment = {
	id: 1,
	content: 'Przy bloku 5',
	authorId: 1,
	postId: 1,
	createdAt: new Date().toISOString(),
	author: fakeAuthor,
}

// ─── GET /forums ──────────────────────────────────────────────────────────────

describe('GET /forums', () => {
	beforeEach(() => vi.clearAllMocks())

	it('zwraca listę forów', async () => {
		mockForum.findMany.mockResolvedValue([fakeForum])

		const res = await request(buildApp()).get('/forums')

		expect(res.status).toBe(200)
		expect(res.body).toHaveLength(1)
		expect(res.body[0].name).toBe('Ogólne')
	})

	it('filtruje po neighborhoodId', async () => {
		mockForum.findMany.mockResolvedValue([fakeForum])

		await request(buildApp()).get('/forums?neighborhoodId=10')

		expect(mockForum.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { neighborhoodId: 10 } })
		)
	})

	it('zwraca 400 gdy neighborhoodId nie jest liczbą', async () => {
		const res = await request(buildApp()).get('/forums?neighborhoodId=abc')

		expect(res.status).toBe(400)
		expect(res.body.error).toBe('Nieprawidłowe ID osiedla')
	})

	it('zwraca 500 gdy Prisma rzuca błąd', async () => {
		mockForum.findMany.mockRejectedValue(new Error('DB error'))

		const res = await request(buildApp()).get('/forums')

		expect(res.status).toBe(500)
	})
})

// ─── GET /forums/:forumId/posts ───────────────────────────────────────────────

describe('GET /forums/:forumId/posts', () => {
	beforeEach(() => vi.clearAllMocks())

	it('zwraca posty z forum', async () => {
		mockPost.findMany.mockResolvedValue([fakePost])

		const res = await request(buildApp()).get('/forums/1/posts')

		expect(res.status).toBe(200)
		expect(res.body[0].title).toBe('Pytanie o parking')
	})

	it('zwraca 400 gdy forumId nie jest liczbą', async () => {
		const res = await request(buildApp()).get('/forums/abc/posts')

		expect(res.status).toBe(400)
	})

	it('sortuje od najstarszych gdy sort=oldest', async () => {
		mockPost.findMany.mockResolvedValue([fakePost])

		await request(buildApp()).get('/forums/1/posts?sort=oldest')

		expect(mockPost.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ orderBy: { createdAt: 'asc' } })
		)
	})

	it('filtruje po frazie gdy podano search', async () => {
		mockPost.findMany.mockResolvedValue([fakePost])

		await request(buildApp()).get('/forums/1/posts?search=parking')

		expect(mockPost.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					OR: expect.arrayContaining([
						expect.objectContaining({ title: expect.objectContaining({ contains: 'parking' }) }),
					]),
				}),
			})
		)
	})
})

// ─── GET /forums/posts/:postId ────────────────────────────────────────────────

describe('GET /forums/posts/:postId', () => {
	beforeEach(() => vi.clearAllMocks())

	it('zwraca post z komentarzami', async () => {
		mockPost.findUnique.mockResolvedValue({ ...fakePost, comments: [fakeComment], forum: fakeForum })

		const res = await request(buildApp()).get('/forums/posts/1')

		expect(res.status).toBe(200)
		expect(res.body.title).toBe('Pytanie o parking')
		expect(res.body.comments).toHaveLength(1)
	})

	it('zwraca 404 gdy post nie istnieje', async () => {
		mockPost.findUnique.mockResolvedValue(null)

		const res = await request(buildApp()).get('/forums/posts/999')

		expect(res.status).toBe(404)
		expect(res.body.error).toBe('Post nie znaleziony')
	})

	it('zwraca 400 gdy postId nie jest liczbą', async () => {
		const res = await request(buildApp()).get('/forums/posts/abc')

		expect(res.status).toBe(400)
	})
})

// ─── GET /forums/posts/:postId/comments ──────────────────────────────────────

describe('GET /forums/posts/:postId/comments', () => {
	beforeEach(() => vi.clearAllMocks())

	it('zwraca komentarze do posta', async () => {
		mockComment.findMany.mockResolvedValue([fakeComment])

		const res = await request(buildApp()).get('/forums/posts/1/comments')

		expect(res.status).toBe(200)
		expect(res.body).toHaveLength(1)
		expect(res.body[0].content).toBe('Przy bloku 5')
	})

	it('zwraca 400 gdy postId nie jest liczbą', async () => {
		const res = await request(buildApp()).get('/forums/posts/abc/comments')

		expect(res.status).toBe(400)
	})
})

// ─── POST /forums/:forumId/posts ──────────────────────────────────────────────

describe('POST /forums/:forumId/posts', () => {
	beforeEach(() => vi.clearAllMocks())

	it('tworzy nowy post', async () => {
		mockPost.create.mockResolvedValue(fakePost)

		const res = await request(buildApp())
			.post('/forums/1/posts')
			.send({ title: 'Pytanie o parking', content: 'Gdzie można parkować?' })

		expect(res.status).toBe(201)
		expect(res.body.title).toBe('Pytanie o parking')
		expect(mockPost.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					authorId: 1,
					forumId: 1,
					neighborhoodId: 10,
				}),
			})
		)
	})

	it('zwraca 400 gdy brak tytułu lub treści', async () => {
		const res = await request(buildApp())
			.post('/forums/1/posts')
			.send({ title: 'Tylko tytuł' })

		expect(res.status).toBe(400)
		expect(res.body.error).toBe('Tytuł i treść są wymagane')
	})

	it('zwraca 400 gdy forumId nie jest liczbą', async () => {
		const res = await request(buildApp())
			.post('/forums/abc/posts')
			.send({ title: 'Test', content: 'Treść' })

		expect(res.status).toBe(400)
	})
})

// ─── POST /forums/posts/:postId/comments ─────────────────────────────────────

describe('POST /forums/posts/:postId/comments', () => {
	beforeEach(() => vi.clearAllMocks())

	it('dodaje komentarz do posta', async () => {
		mockComment.create.mockResolvedValue(fakeComment)

		const res = await request(buildApp())
			.post('/forums/posts/1/comments')
			.send({ content: 'Przy bloku 5' })

		expect(res.status).toBe(201)
		expect(res.body.content).toBe('Przy bloku 5')
	})

	it('zwraca 400 gdy brak treści', async () => {
		const res = await request(buildApp())
			.post('/forums/posts/1/comments')
			.send({})

		expect(res.status).toBe(400)
		expect(res.body.error).toBe('Treść komentarza jest wymagana')
	})
})

// ─── DELETE /forums/posts/:postId ─────────────────────────────────────────────

describe('DELETE /forums/posts/:postId', () => {
	beforeEach(() => vi.clearAllMocks())

	it('usuwa post gdy użytkownik jest autorem', async () => {
		mockPost.findUnique.mockResolvedValue({ ...fakePost, authorId: 1 })
		mockComment.deleteMany.mockResolvedValue({})
		mockPost.delete.mockResolvedValue(fakePost)

		const res = await request(buildApp()).delete('/forums/posts/1')

		expect(res.status).toBe(200)
		expect(res.body.message).toBe('Post usunięty')
		expect(mockComment.deleteMany).toHaveBeenCalledWith({ where: { postId: 1 } })
		expect(mockPost.delete).toHaveBeenCalledWith({ where: { id: 1 } })
	})

	it('zwraca 403 gdy użytkownik nie jest autorem ani adminem', async () => {
		mockPost.findUnique.mockResolvedValue({ ...fakePost, authorId: 99 })

		const res = await request(buildApp()).delete('/forums/posts/1')

		expect(res.status).toBe(403)
		expect(res.body.error).toBe('Brak uprawnień')
	})

	it('zwraca 404 gdy post nie istnieje', async () => {
		mockPost.findUnique.mockResolvedValue(null)

		const res = await request(buildApp()).delete('/forums/posts/1')

		expect(res.status).toBe(404)
	})
})

// ─── DELETE /forums/comments/:commentId ───────────────────────────────────────

describe('DELETE /forums/comments/:commentId', () => {
	beforeEach(() => vi.clearAllMocks())

	it('usuwa komentarz gdy użytkownik jest autorem', async () => {
		mockComment.findUnique.mockResolvedValue({ ...fakeComment, authorId: 1 })
		mockComment.delete.mockResolvedValue(fakeComment)

		const res = await request(buildApp()).delete('/forums/comments/1')

		expect(res.status).toBe(200)
		expect(res.body.message).toBe('Komentarz usunięty')
	})

	it('zwraca 403 gdy użytkownik nie jest autorem', async () => {
		mockComment.findUnique.mockResolvedValue({ ...fakeComment, authorId: 99 })

		const res = await request(buildApp()).delete('/forums/comments/1')

		expect(res.status).toBe(403)
	})

	it('zwraca 404 gdy komentarz nie istnieje', async () => {
		mockComment.findUnique.mockResolvedValue(null)

		const res = await request(buildApp()).delete('/forums/comments/1')

		expect(res.status).toBe(404)
	})
})