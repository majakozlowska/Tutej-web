import { Router, type Request, type Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from './auth.js'

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (req: Request, res: Response) => {
	try {
		const { neighborhoodId } = req.query
		const where = neighborhoodId ? { neighborhoodId: Number(neighborhoodId) } : {}

		const notices = await prisma.announcement.findMany({
			where,
			include: {
				author: {
					select: { id: true, firstName: true, lastName: true, photo: true, role: true },
				},
			},
			orderBy: { createdAt: 'desc' },
		})

		res.json(notices)
	} catch (error) {
		res.status(500).json({ error: 'Błąd serwera' })
	}
})

router.get('/:noticeId', async (req: Request, res: Response) => {
	try {
		const { noticeId } = req.params

		const notice = await prisma.announcement.findUnique({
			where: { id: Number(noticeId) },
			include: {
				author: {
					select: { id: true, firstName: true, lastName: true, photo: true, role: true },
				},
			},
		})

		if (!notice) return res.status(404).json({ error: 'Ogłoszenie nie znalezione' })

		res.json(notice)
	} catch (error) {
		res.status(500).json({ error: 'Błąd serwera' })
	}
})

router.post('/', authenticate, async (req: Request, res: Response) => {
	try {
		const user = (req as any).user
		const { title, content } = req.body
		const notice = await prisma.announcement.create({
			data: {
				title,
				content,
				authorId: user.id,
				neighborhoodId: user.neighborhoodId,
			},
			include: { author: true },
		})
		res.status(201).json(notice)
	} catch (error) {
		res.status(500).json({ error: 'Błąd serwera' })
	}
})

export default router
