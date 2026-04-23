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
		prisma.neighborhood.create({ data: { name: 'Stare Miasto' } }),
		prisma.neighborhood.create({ data: { name: 'Nad Potokiem' } }),
	])

	const users = await Promise.all([
		prisma.user.create({
			data: {
				firstName: 'Anna',
				lastName: 'Kowalska',
				email: 'anna@example.com',
				password: 'password123',
				role: Role.ADMIN,
				neighborhoodId: neighborhoods[0].id,
			},
		}),
		prisma.user.create({
			data: {
				firstName: 'Jan',
				lastName: 'Nowak',
				email: 'jan@example.com',
				password: 'password123',
				role: Role.COUNCILLOR,
				neighborhoodId: neighborhoods[0].id,
			},
		}),
		prisma.user.create({
			data: {
				firstName: 'Marek',
				lastName: 'Zieliński',
				email: 'marek@example.com',
				password: 'password123',
				role: Role.USER,
				neighborhoodId: neighborhoods[1].id,
			},
		}),
		prisma.user.create({
			data: {
				firstName: 'Ewa',
				lastName: 'Wiśniewska',
				email: 'ewa@example.com',
				password: 'password123',
				role: Role.USER,
				neighborhoodId: neighborhoods[2].id,
			},
		}),
		prisma.user.create({
			data: {
				firstName: 'Piotr',
				lastName: 'Mazur',
				email: 'piotr@example.com',
				password: 'password123',
				role: Role.COUNCILLOR,
				neighborhoodId: neighborhoods[3].id,
			},
		}),
	])

	await Promise.all([
		prisma.event.create({
			data: {
				name: 'Festyn Sąsiedzki',
				description: 'Wspólne grillowanie i zabawy.',
				place: 'Plac zabaw',
				date: new Date('2026-06-15T14:00:00Z'),
				neighborhoodId: neighborhoods[0].id,
				attendees: { connect: [{ id: users[0].id }, { id: users[1].id }] },
			},
		}),
		prisma.event.create({
			data: {
				name: 'Spotkanie z Radą',
				description: 'Dyskusja o nowym oświetleniu.',
				place: 'Świetlica',
				date: new Date('2026-05-10T18:00:00Z'),
				neighborhoodId: neighborhoods[1].id,
				attendees: { connect: [{ id: users[2].id }] },
			},
		}),
		prisma.event.create({
			data: {
				name: 'Sprzątanie Świata',
				description: 'Zbieramy śmieci w parku.',
				place: 'Główne wejście do parku',
				date: new Date('2026-04-22T09:00:00Z'),
				neighborhoodId: neighborhoods[2].id,
			},
		}),
		prisma.event.create({
			data: {
				name: 'Kino Plenerowe',
				description: 'Pokaz filmu pod gwiazdami.',
				place: 'Polana',
				date: new Date('2026-07-20T21:00:00Z'),
				neighborhoodId: neighborhoods[3].id,
			},
		}),
		prisma.event.create({
			data: {
				name: 'Turniej Piłkarski',
				description: 'Mecze między osiedlami.',
				place: 'Orlik',
				date: new Date('2026-08-05T10:00:00Z'),
				neighborhoodId: neighborhoods[4].id,
			},
		}),
	])

	const posts = await Promise.all([
		prisma.post.create({
			data: {
				title: 'Piękna pogoda!',
				content: 'Ktoś chętny na spacer po parku?',
				authorId: users[2].id,
				neighborhoodId: neighborhoods[1].id,
			},
		}),
		prisma.post.create({
			data: {
				title: 'Zgubione klucze',
				content: 'Znaleziono klucze przy bloku nr 5.',
				authorId: users[3].id,
				neighborhoodId: neighborhoods[2].id,
			},
		}),
		prisma.post.create({
			data: {
				title: 'Polecam mechanika',
				content: 'Pan Mirek z garaży robi świetną robotę.',
				authorId: users[0].id,
				neighborhoodId: neighborhoods[0].id,
			},
		}),
		prisma.post.create({
			data: {
				title: 'Remont ulicy',
				content: 'Uważajcie na utrudnienia na ul. Polnej.',
				authorId: users[1].id,
				neighborhoodId: neighborhoods[0].id,
			},
		}),
		prisma.post.create({
			data: {
				title: 'Nowa piekarnia',
				content: 'Mają pyszne jagodzianki!',
				authorId: users[4].id,
				neighborhoodId: neighborhoods[3].id,
			},
		}),
	])

	await Promise.all([
		prisma.comment.create({
			data: { content: 'Ja chętnie!', authorId: users[0].id, postId: posts[0].id },
		}),
		prisma.comment.create({
			data: {
				content: 'Widziałem ogłoszenie na klatce.',
				authorId: users[1].id,
				postId: posts[1].id,
			},
		}),
		prisma.comment.create({
			data: { content: 'Dzięki za polecenie!', authorId: users[2].id, postId: posts[2].id },
		}),
		prisma.comment.create({
			data: {
				content: 'Wreszcie to naprawiają.',
				authorId: users[3].id,
				postId: posts[3].id,
			},
		}),
		prisma.comment.create({
			data: {
				content: 'Potwierdzam, są genialne.',
				authorId: users[0].id,
				postId: posts[4].id,
			},
		}),
	])

	await Promise.all([
		prisma.announcement.create({
			data: {
				title: 'Przerwa w dostawie wody',
				content: 'W środę od 8 do 12.',
				authorId: users[1].id,
				neighborhoodId: neighborhoods[0].id,
			},
		}),
		prisma.announcement.create({
			data: {
				title: 'Remont dachu',
				content: 'Zaczynamy w poniedziałek.',
				authorId: users[4].id,
				neighborhoodId: neighborhoods[3].id,
			},
		}),
		prisma.announcement.create({
			data: {
				title: 'Wywóz gabarytów',
				content: 'Już w najbliższy piątek.',
				authorId: users[1].id,
				neighborhoodId: neighborhoods[0].id,
			},
		}),
		prisma.announcement.create({
			data: {
				title: 'Szczepienia psów',
				content: 'Punkt mobilny przy fontannie.',
				authorId: users[1].id,
				neighborhoodId: neighborhoods[2].id,
			},
		}),
		prisma.announcement.create({
			data: {
				title: 'Zebranie mieszkańców',
				content: 'Obecność obowiązkowa.',
				authorId: users[1].id,
				neighborhoodId: neighborhoods[0].id,
			},
		}),
	])

	await Promise.all([
		prisma.listing.create({
			data: {
				title: 'Rower górski',
				description: 'Mało używany, 26 cali.',
				price: 800,
				contact: '555-111-222',
				status: ListingStatus.AVAILABLE,
				authorId: users[2].id,
				neighborhoodId: neighborhoods[1].id,
			},
		}),
		prisma.listing.create({
			data: {
				title: 'Stół kuchenny',
				description: 'Drewniany, rozkładany.',
				price: 300,
				contact: '555-333-444',
				status: ListingStatus.RESERVED,
				authorId: users[3].id,
				neighborhoodId: neighborhoods[2].id,
			},
		}),
		prisma.listing.create({
			data: {
				title: 'Kosiarka spalinowa',
				description: 'Mocna, po przeglądzie.',
				price: 1200,
				contact: '555-555-555',
				status: ListingStatus.AVAILABLE,
				authorId: users[0].id,
				neighborhoodId: neighborhoods[0].id,
			},
		}),
		prisma.listing.create({
			data: {
				title: 'Książki do nauki JS',
				description: 'Zestaw 3 książek.',
				price: 50,
				contact: '555-666-777',
				status: ListingStatus.SOLD,
				authorId: users[4].id,
				neighborhoodId: neighborhoods[3].id,
			},
		}),
		prisma.listing.create({
			data: {
				title: 'Wynajmę garaż',
				description: 'Suchy, z prądem.',
				price: 400,
				contact: '555-888-999',
				status: ListingStatus.AVAILABLE,
				authorId: users[1].id,
				neighborhoodId: neighborhoods[0].id,
			},
		}),
	])
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
