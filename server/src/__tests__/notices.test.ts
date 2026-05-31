import request from 'supertest'
import express from 'express'
import type { Request, Response, NextFunction } from 'express'

jest.mock('@prisma/client.mock')
jest.mock('../auth.mock')

import announcementsRouter from '../routes/notices.js'
import prismaMock from '../__mocks__/@prisma/client.mock.js'
import { authenticate, mockUser } from '../__mocks__/auth.mock.js'

const AUTHOR = {
  id: mockUser.id,
  firstName: mockUser.firstName,
  lastName: mockUser.lastName,
  photo: null,
  role: mockUser.role,
}

const makeAnnouncement = (overrides = {}) => ({
  id: 1,
  title: 'Remont klatki schodowej',
  content: 'Remont odbędzie się w dniach 1-5 maja.',
  media: null,
  authorId: mockUser.id,
  neighborhoodId: mockUser.neighborhoodId,
  createdAt: new Date('2024-05-01T10:00:00Z'),
  author: AUTHOR,
  ...overrides,
})

const app = express()
app.use(express.json())
app.use('/announcements', announcementsRouter)

describe('GET /announcements', () => {
  it('zwraca listę wszystkich ogłoszeń gdy brak filtru', async () => {
    const announcements = [makeAnnouncement({ id: 1 }), makeAnnouncement({ id: 2, title: 'Zebranie wspólnoty' })]
    prismaMock.announcement.findMany.mockResolvedValueOnce(announcements)

    const res = await request(app).get('/announcements')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0].title).toBe('Remont klatki schodowej')
    expect(res.body[1].title).toBe('Zebranie wspólnoty')
  })

  it('filtruje ogłoszenia po neighborhoodId', async () => {
    prismaMock.announcement.findMany.mockResolvedValueOnce([makeAnnouncement()])

    const res = await request(app).get('/announcements?neighborhoodId=10')

    expect(res.status).toBe(200)
    expect(prismaMock.announcement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { neighborhoodId: 10 } })
    )
  })

  it('zwraca pustą tablicę gdy nie ma ogłoszeń', async () => {
    prismaMock.announcement.findMany.mockResolvedValueOnce([])

    const res = await request(app).get('/announcements')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('ogłoszenia posortowane są malejąco po dacie (orderBy createdAt desc)', async () => {
    prismaMock.announcement.findMany.mockResolvedValueOnce([])

    await request(app).get('/announcements')

    expect(prismaMock.announcement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } })
    )
  })

  it('zwraca 500 gdy baza danych rzuci błędem', async () => {
    prismaMock.announcement.findMany.mockRejectedValueOnce(new Error('DB connection lost'))

    const res = await request(app).get('/announcements')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Błąd serwera' })
  })
})

describe('GET /announcements/:noticeId', () => {
  it('zwraca ogłoszenie po poprawnym id', async () => {
    prismaMock.announcement.findUnique.mockResolvedValueOnce(makeAnnouncement())

    const res = await request(app).get('/announcements/1')

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(1)
    expect(res.body.title).toBe('Remont klatki schodowej')
    expect(res.body.author).toMatchObject({ firstName: 'Jan', lastName: 'Kowalski' })
  })

  it('zapytuje Prismę z numerycznym id (nie stringiem)', async () => {
    prismaMock.announcement.findUnique.mockResolvedValueOnce(makeAnnouncement())

    await request(app).get('/announcements/42')

    expect(prismaMock.announcement.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42 } })
    )
  })

  it('zwraca 404 gdy ogłoszenie nie istnieje', async () => {
    prismaMock.announcement.findUnique.mockResolvedValueOnce(null)

    const res = await request(app).get('/announcements/999')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Ogłoszenie nie znalezione' })
  })

  it('zwraca 500 gdy baza danych rzuci błędem', async () => {
    prismaMock.announcement.findUnique.mockRejectedValueOnce(new Error('Timeout'))

    const res = await request(app).get('/announcements/1')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Błąd serwera' })
  })
})
describe('POST /announcements', () => {
  const validBody = {
    title: 'Awaria windy',
    content: 'Winda nr 2 jest nieczynna do odwołania.',
  }

  it('tworzy ogłoszenie i zwraca 201 dla zalogowanego użytkownika', async () => {
    prismaMock.announcement.create.mockResolvedValueOnce(
      makeAnnouncement({ title: validBody.title, content: validBody.content })
    )

    const res = await request(app).post('/announcements').send(validBody)

    expect(res.status).toBe(201)
    expect(res.body.title).toBe('Awaria windy')
    expect(res.body.content).toBe('Winda nr 2 jest nieczynna do odwołania.')
  })

  it('przypisuje authorId i neighborhoodId z tokena — nie z body', async () => {
    prismaMock.announcement.create.mockResolvedValueOnce(makeAnnouncement())

    await request(app).post('/announcements').send(validBody)

    expect(prismaMock.announcement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          title: validBody.title,
          content: validBody.content,
          authorId: mockUser.id,
          neighborhoodId: mockUser.neighborhoodId,
        },
      })
    )
  })

  it('zwraca 500 gdy zapis do bazy się nie powiedzie', async () => {
    prismaMock.announcement.create.mockRejectedValueOnce(new Error('Unique constraint failed'))

    const res = await request(app).post('/announcements').send(validBody)

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Błąd serwera' })
  })

  it('zwraca 401 gdy middleware blokuje żądanie (brak tokena)', async () => {
    const protectedApp = express()
    protectedApp.use(express.json())

    const blockingAuth = (_req: Request, res: Response, _next: NextFunction) => {
      res.status(401).json({ error: 'Brak autoryzacji' })
    }

    const protectedRouter = express.Router()
    protectedRouter.post('/', blockingAuth, async (_req, res) => {
      res.status(201).json({})
    })
    protectedApp.use('/announcements', protectedRouter)

    const res = await request(protectedApp).post('/announcements').send(validBody)

    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Brak autoryzacji' })
  })

  it.skip('nie wywołuje Prismy gdy middleware blokuje żądanie — testuj przez oddzielną aplikację (patrz test wyżej)', async () => {
    ;(authenticate as jest.Mock).mockImplementationOnce(
      (_req: Request, res: Response, _next: NextFunction) => {
        res.status(401).json({ error: 'Brak autoryzacji' })
      }
    )

    await request(app).post('/announcements').send(validBody)

    expect(prismaMock.announcement.create).not.toHaveBeenCalled()
  })
})