import { test, expect } from '@playwright/test'

const MOCK_NOTICES = [
    {
        id: 101,
        title: 'Znaleziono pęk kluczy',
        content: 'Leżały na ławce przy placu zabaw obok bloku numer 4.',
        media: null,
        createdAt: '2026-06-01T12:00:00Z',
        author: { id: 1, firstName: 'Jan', lastName: 'Kowalski', photo: null, role: 'USER' }
    },
    {
        id: 102,
        title: 'Sprzedam rower dziecięcy',
        content: 'Stan bardzo dobry, odbiór osobisty.',
        media: null,
        createdAt: '2026-06-01T14:00:00Z',
        author: { id: 2, firstName: 'Anna', lastName: 'Nowak', photo: null, role: 'USER' }
    }
]

const MOCK_EVENTS = [
    {
        id: 50,
        name: 'Wspólne sprzątanie lasu',
        description: 'Zbieramy się pod leśniczówką o godzinie 10:00.',
        place: 'Las Kabacki',
        date: '2026-06-07T10:00:00Z',
        image: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
        authorId: 3,
        author: { firstName: 'Piotr', lastName: 'Zieliński' },
        attendees: []
    }
]

test.describe('Dashboard Główny (Home) - Agregacja danych i Stany Puste', () => {

    test.beforeEach(async ({ context }) => {
        await context.addInitScript(() => {
            window.localStorage.setItem('userId', '1')
            window.localStorage.setItem('isAuth', 'true')
            window.localStorage.setItem('token', 'fake-jwt-token')
        })
    })

    test('powinien pokazywać loader i ukryć go dopiero po zakończeniu obu żądań API', async ({ page }) => {
        let resolveNotices: (value: unknown) => void
        const noticesPromise = new Promise(res => { resolveNotices = res })

        await page.route('**/api/notices', async (route) => {
            await noticesPromise
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(MOCK_NOTICES)
            })
        })

        await page.route('**/api/events', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(MOCK_EVENTS)
            })
        })

        await page.goto('http://localhost:5173/')

        const loader = page.locator('text=Ładowanie podglądu...')
        await expect(loader).toBeVisible()

        await expect(page.locator('text=Znaleziono pęk kluczy')).not.toBeVisible()

        resolveNotices!(true)

        await expect(loader).not.toBeVisible({ timeout: 7000 })

        await expect(page.locator('text=Znaleziono pęk kluczy')).toBeVisible()
    })

    test('powinien wyrenderować tylko pierwszy element z listy ogłoszeń', async ({ page }) => {
        await page.route('**/api/notices', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(MOCK_NOTICES)
            })
        })

        await page.route('**/api/events', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(MOCK_EVENTS)
            })
        })

        await page.goto('http://localhost:5173/')
        await expect(page.locator('text=Ładowanie podglądu...')).not.toBeVisible({ timeout: 7000 })

        await expect(page.locator('text=Znaleziono pęk kluczy')).toBeVisible()
        await expect(page.locator('text=Sprzedam rower dziecięcy')).not.toBeVisible()

        await expect(page.locator('text=Wspólne sprzątanie lasu')).toBeVisible()
    })

    test('powinien wyświetlić fallback gdy API wydarzeń zwróci pustą tablicę', async ({ page }) => {
        await page.route('**/api/notices', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(MOCK_NOTICES)
            })
        })

        await page.route('**/api/events', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            })
        })

        await page.goto('http://localhost:5173/')
        await expect(page.locator('text=Ładowanie podglądu...')).not.toBeVisible({ timeout: 7000 })

        await expect(page.locator('text=Brak zaplanowanych wydarzeń.')).toBeVisible()
        await expect(page.locator('text=Wspólne sprzątanie lasu')).not.toBeVisible()
    })

    test('powinien wyświetlić oba fallbacki gdy oba API zwrócą puste tablice', async ({ page }) => {
        await page.route('**/api/notices', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            })
        })

        await page.route('**/api/events', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            })
        })

        await page.goto('http://localhost:5173/')
        await expect(page.locator('text=Ładowanie podglądu...')).not.toBeVisible({ timeout: 7000 })

        await expect(page.locator('text=Brak nowych ogłoszeń.')).toBeVisible()
        await expect(page.locator('text=Brak zaplanowanych wydarzeń.')).toBeVisible()
    })

    test('powinien nie crashować gdy oba API zwrócą błąd sieci', async ({ page }) => {
        await page.route('**/api/notices', async (route) => {
            await route.abort('failed')
        })

        await page.route('**/api/events', async (route) => {
            await route.abort('failed')
        })

        await page.goto('http://localhost:5173/')

        await expect(page.locator('text=Ładowanie podglądu...')).not.toBeVisible({ timeout: 7000 })
        await expect(page.locator('text=Dzień dobry!')).toBeVisible()
    })
})