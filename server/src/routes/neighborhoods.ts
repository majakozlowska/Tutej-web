import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (req, res) => {
	try {
		const neighborhoods = await prisma.neighborhood.findMany({
			orderBy: {
				name: 'asc',
			},
		})
		res.json(neighborhoods)
	} catch (error) {
		res.status(500).json({ error: 'Internal Server Error' })
	}
})

export default router
