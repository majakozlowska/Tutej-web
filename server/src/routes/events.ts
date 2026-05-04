import { Router, type Request, type Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (req: Request, res: Response) => {
	try {
		const events = await prisma.event.findMany({
			include: {
				author: {
					select: {
						firstName: true,
						lastName: true,
						photo: true,
					},
				},
				attendees: {
					select: {
						id: true,
						firstName: true,
						photo: true,
					},
				},
			},
			orderBy: {
				date: 'asc',
			},
		})
		return res.status(200).json(events)
	} catch (error) {
		console.error(error)
		return res.status(500).json({ message: 'Błąd serwera.' })
	}
})

export default router
