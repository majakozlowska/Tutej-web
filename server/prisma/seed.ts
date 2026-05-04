import { PrismaClient, Role, ListingStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
	await prisma.comment.deleteMany()
	await prisma.post.deleteMany()
	await prisma.announcement.deleteMany()
	await prisma.listing.deleteMany()
	await prisma.event.deleteMany()
	await prisma.user.deleteMany()
	await prisma.neighborhood.deleteMany()

	const neighborhoods = await Promise.all([
		prisma.neighborhood.create({ data: { name: 'Osiedle Słoneczne' } }),
		prisma.neighborhood.create({ data: { name: 'Zielona Dolina' } }),
		prisma.neighborhood.create({ data: { name: 'Parkowe Wzgórze' } }),
	])

	const users = await Promise.all([
		prisma.user.create({
			data: {
				firstName: 'Anna',
				lastName: 'Kowalska',
				email: 'anna@example.com',
				password: 'hashed_password_123',
				role: Role.ADMIN,
				neighborhoodId: neighborhoods[0].id,
			},
		}),
		prisma.user.create({
			data: {
				firstName: 'Jan',
				lastName: 'Nowak',
				email: 'jan@example.com',
				password: 'hashed_password_123',
				role: Role.COUNCILLOR,
				neighborhoodId: neighborhoods[0].id,
			},
		}),
		prisma.user.create({
			data: {
				firstName: 'Marek',
				lastName: 'Zieliński',
				email: 'marek@example.com',
				password: 'hashed_password_123',
				role: Role.USER,
				neighborhoodId: neighborhoods[1].id,
			},
		}),
		prisma.user.create({
			data: {
				firstName: 'Ewa',
				lastName: 'Wiśniewska',
				email: 'ewa@example.com',
				password: 'hashed_password_123',
				role: Role.USER,
				neighborhoodId: neighborhoods[2].id,
			},
		}),
	])

	await prisma.event.create({
		data: {
			name: 'Wielkie Grillowanie u Anny',
			description:
				'Zapraszam wszystkich sąsiadów na wspólne pieczenie kiełbasek i rozmowy o przyszłości naszego osiedla. Zapewniamy napoje i dobrą muzykę!',
			place: 'Skwer przy ul. Kwiatowej 5',
			date: new Date('2026-06-20T16:00:00Z'),
			duration: '4 GODZ.',
			price: 0,
			authorId: users[0].id,
			neighborhoodId: neighborhoods[0].id,
			attendees: {
				connect: [{ id: users[1].id }, { id: users[2].id }, { id: users[3].id }],
			},
		},
	})

	await prisma.event.create({
		data: {
			name: 'Turniej Szachowy',
			description:
				'Lokalny turniej dla amatorów i profesjonalistów. Nagrody dla pierwszej trójki gwarantowane przez Radę Osiedla.',
			place: 'Świetlica Osiedlowa',
			date: new Date('2026-05-15T10:00:00Z'),
			duration: '6 GODZ.',
			price: 15.0,
			authorId: users[1].id,
			neighborhoodId: neighborhoods[0].id,
			attendees: {
				connect: [{ id: users[0].id }, { id: users[2].id }],
			},
		},
	})

	await prisma.event.create({
		data: {
			name: 'Joga na trawie',
			description:
				'Poranna sesja jogi dla każdego, bez względu na poziom zaawansowania. Zabierzcie własne maty!',
			place: 'Park Zielona Dolina',
			date: new Date('2026-07-01T08:00:00Z'),
			duration: '1.5 GODZ.',
			price: 10.0,
			authorId: users[2].id,
			neighborhoodId: neighborhoods[1].id,
			attendees: {
				connect: [{ id: users[0].id }, { id: users[3].id }],
			},
		},
	})

	const posts = await Promise.all([
		prisma.post.create({
			data: {
				title: 'Uwaga na dziki!',
				content:
					'Widziałem dzisiaj rano watahę dzików przy śmietnikach na ul. Leśnej. Uważajcie na psy.',
				authorId: users[2].id,
				neighborhoodId: neighborhoods[1].id,
			},
		}),
		prisma.post.create({
			data: {
				title: 'Polecam hydraulika',
				content:
					'Jeśli ktoś szuka rzetelnego fachowca, Pan Zbyszek uratował moją zalaną kuchnię w 15 minut.',
				authorId: users[3].id,
				neighborhoodId: neighborhoods[2].id,
			},
		}),
	])

	await prisma.comment.create({
		data: {
			content: 'Dzięki za informację, będę omijać ten rejon.',
			authorId: users[0].id,
			postId: posts[0].id,
		},
	})

	await prisma.announcement.create({
		data: {
			title: 'Przerwa w dostawie wody',
			content:
				'W związku z awarią rury głównej, w dniu jutrzejszym od 8:00 do 14:00 nie będzie wody w blokach 4-10.',
			authorId: users[1].id,
			neighborhoodId: neighborhoods[0].id,
		},
	})

	await prisma.listing.create({
		data: {
			title: 'Rower dziecięcy na sprzedaż',
			description: 'Używany tylko przez jeden sezon, stan idealny. Koła 16 cali.',
			price: 250,
			contact: '555-123-456',
			status: ListingStatus.AVAILABLE,
			authorId: users[3].id,
			neighborhoodId: neighborhoods[2].id,
		},
	})
}

main()
	.then(async () => {
		await prisma.$disconnect()
	})
	.catch(async (e) => {
		console.error(e)
		await prisma.$disconnect()
		process.exit(1)
	})
