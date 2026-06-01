import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

// vi.hoisted() gwarantuje że kod wykona się PRZED hoistingiem vi.mock()
const { mockAnnouncement } = vi.hoisted(() => {
  const mockAnnouncement = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
  }
  return { mockAnnouncement }
})

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    announcement = mockAnnouncement
  },
}))

vi.mock('../routes/auth.js', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 1, neighborhoodId: 10, role: 'USER' }
    next()
  },
}))

import noticesRouter from '../routes/notices.js'

const buildApp = () => {
  const app = express()
  app.use(express.json())
  app.use('/notices', noticesRouter)
  return app
}

// ─── Dane testowe ─────────────────────────────────────────────────────────────

const fakeAuthor = {
  id: 1,
  firstName: 'Jan',
  lastName: 'Kowalski',
  photo: null,
  role: 'USER',
}

const fakeNotice = {
  id: 1,
  title: 'Przerwa w dostawie wody',
  content: 'Jutro od 8 do 12 brak wody.',
  media: null,
  authorId: 1,
  neighborhoodId: 10,
  createdAt: new Date().toISOString(),
  author: fakeAuthor,
}

// ─── Testy ────────────────────────────────────────────────────────────────────

describe('GET /notices', () => {
  beforeEach(() => vi.clearAllMocks())

  it('zwraca listę ogłoszeń', async () => {
    mockAnnouncement.findMany.mockResolvedValue([fakeNotice])

    const res = await request(buildApp()).get('/notices')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].title).toBe('Przerwa w dostawie wody')
  })

  it('filtruje po neighborhoodId gdy podany w query', async () => {
    mockAnnouncement.findMany.mockResolvedValue([fakeNotice])

    await request(buildApp()).get('/notices?neighborhoodId=10')

    expect(mockAnnouncement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { neighborhoodId: 10 },
      })
    )
  })

  it('nie filtruje gdy brak neighborhoodId w query', async () => {
    mockAnnouncement.findMany.mockResolvedValue([])

    await request(buildApp()).get('/notices')

    expect(mockAnnouncement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    )
  })

  it('zwraca 500 gdy Prisma rzuca błąd', async () => {
    mockAnnouncement.findMany.mockRejectedValue(new Error('DB error'))

    const res = await request(buildApp()).get('/notices')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Błąd serwera' })
  })
})

describe('GET /notices/:noticeId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('zwraca jedno ogłoszenie po id', async () => {
    mockAnnouncement.findUnique.mockResolvedValue(fakeNotice)

    const res = await request(buildApp()).get('/notices/1')

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(1)
    expect(mockAnnouncement.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    )
  })

  it('zwraca 404 gdy ogłoszenie nie istnieje', async () => {
    mockAnnouncement.findUnique.mockResolvedValue(null)

    const res = await request(buildApp()).get('/notices/999')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Ogłoszenie nie znalezione' })
  })

  it('zwraca 500 gdy Prisma rzuca błąd', async () => {
    mockAnnouncement.findUnique.mockRejectedValue(new Error('DB error'))

    const res = await request(buildApp()).get('/notices/1')

    expect(res.status).toBe(500)
  })
})

describe('POST /notices', () => {
  beforeEach(() => vi.clearAllMocks())

  it('tworzy ogłoszenie dla zalogowanego użytkownika', async () => {
    const created = { ...fakeNotice, title: 'Nowe ogłoszenie' }
    mockAnnouncement.create.mockResolvedValue(created)

    const res = await request(buildApp())
      .post('/notices')
      .send({ title: 'Nowe ogłoszenie', content: 'Treść ogłoszenia.' })

    expect(res.status).toBe(201)
    expect(res.body.title).toBe('Nowe ogłoszenie')
    expect(mockAnnouncement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          title: 'Nowe ogłoszenie',
          content: 'Treść ogłoszenia.',
          authorId: 1,
          neighborhoodId: 10,
        },
      })
    )
  })

  it('zwraca 500 gdy Prisma rzuca błąd przy tworzeniu', async () => {
    mockAnnouncement.create.mockRejectedValue(new Error('DB error'))

    const res = await request(buildApp())
      .post('/notices')
      .send({ title: 'X', content: 'Y' })

    expect(res.status).toBe(500)
  })
})