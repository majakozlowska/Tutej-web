import { test, expect } from '@playwright/test'

const MOCK_EVENTS = [
    {
        id: 1,
        name: 'Dzielnicowy Turniej Szachowy',
        description: 'Zapraszamy wszystkich pasjonatów królewskiej gry.',
        place: 'Świetlica osiedlowa, pokój 12',
        date: '2026-06-15T18:00',
        duration: '3 hours',
        price: 10,
        authorId: 200,
        image: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='
    },
    {
        id: 2,
        name: 'Pokaz Filmów Plenerowych',
        description: 'Kino pod chmurką dla każdego mieszkańca.',
        place: 'Park Centralny',
        date: '2026-06-20T21:00',
        duration: '2 hours',
        price: null,
        authorId: 999,
        image: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='
    }
]

test.describe('Podstrona Wydarzeń - Filtrowanie, Cykl Życia i Interakcje (Bez bazy danych)', () => {

    test.beforeEach(async ({ context, page }) => {
        await context.addInitScript(() => {
            window.localStorage.setItem('userId', '200')
            window.localStorage.setItem('isAuth', 'true')
            window.localStorage.setItem('token', 'fake-jwt-token')
        })

        const apiEventsRegex = /\/api\/events(\/|$|\?)/

        await page.route(apiEventsRegex, async (route) => {
            const method = route.request().method()
            
            if (method === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(MOCK_EVENTS)
                })
            } else if (method === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: 3,
                        name: 'Sąsiedzkie Grillowanie',
                        description: 'Przynieście własne kiełbaski i dobry humor!',
                        place: 'Polana przy stawie',
                        date: '2026-07-01T15:00',
                        duration: null,
                        price: null,
                        authorId: 200,
                        image: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='
                    })
                })
            } else if (method === 'DELETE') {
                await route.fulfill({ status: 200 })
            }
        })

        await page.goto('http://localhost:5173/events')
        await page.locator('text=Wydarzenia').first().waitFor({ state: 'visible' })
    })

    test('powinien poprawnie filtrować listę wyświetlając tylko wydarzenia zalogowanego autora', async ({ page }) => {
        await expect(page.locator('text=Dzielnicowy Turniej Szachowy').first()).toBeVisible({ timeout: 7000 })
        await expect(page.locator('text=Pokaz Filmów Plenerowych').first()).toBeVisible()

        await page.getByRole('button', { name: 'Moje wydarzenia' }).click()

        await expect(page.locator('text=Dzielnicowy Turniej Szachowy').first()).toBeVisible()
        await expect(page.locator('text=Pokaz Filmów Plenerowych').first()).not.toBeVisible()

        await page.getByRole('button', { name: 'Wszystkie wydarzenia' }).click()
        await expect(page.locator('text=Pokaz Filmów Plenerowych').first()).toBeVisible()
    })

    test('powinien zablokować wysłanie formularza i pokazać alert, gdy brakuje wymaganego zdjęcia', async ({ page }) => {
        let capturedMessage = ''
        page.on('dialog', async (dialog) => {
            capturedMessage = dialog.message()
            await dialog.accept()
        })

        await page.getByRole('button', { name: 'Dodaj nowe wydarzenie' }).click()
        await page.locator('p:has-text("Nazwa wydarzenia") + div input').fill('Wydarzenie bez zdjęcia')
        await page.locator('p:has-text("Adres") + div input').fill('Gdzieś')
        await page.locator('p:has-text("Data i godzina") + div input').fill('2026-07-01T15:00')
        await page.locator('textarea').fill('Opis bez zdjęcia')

        await page.getByRole('button', { name: 'Utwórz wydarzenie' }).click()
        await expect.poll(() => capturedMessage).toContain('zdjęcie')
    })

    test('powinien pomyślnie przejść proces walidacji, obsłużyć upload zdjęcia i dodać kartę do listy', async ({ page }) => {
        await page.getByRole('button', { name: 'Dodaj nowe wydarzenie' }).click()

        await page.locator('p:has-text("Nazwa wydarzenia") + div input').fill('Sąsiedzkie Grillowanie')
        await page.locator('p:has-text("Adres") + div input').fill('Polana przy stawie')
        await page.locator('p:has-text("Data i godzina") + div input').fill('2026-07-01T15:00')
        await page.locator('textarea').fill('Przynieście własne kiełbaski i dobry humor!')

        const fileChooserPromise = page.waitForEvent('filechooser')
        await page.locator('label[for="event-photo"]').click()
        const fileChooser = await fileChooserPromise
        await fileChooser.setFiles({
            name: 'cover.jpg',
            mimeType: 'image/jpeg',
            buffer: Buffer.from('fake-image-data')
        })

        await expect(page.locator('img[alt="Event Preview"]')).toBeVisible()
        await page.getByRole('button', { name: 'Utwórz wydarzenie' }).click()

        await expect(page.locator('text=Sąsiedzkie Grillowanie').first()).toBeVisible()
    })

    test('powinien pokazać alert błędu, gdy serwer odrzuci dodawanie wydarzenia (status != ok)', async ({ page }) => {
        let capturedMessage = ''
        page.on('dialog', async (dialog) => {
            capturedMessage = dialog.message()
            await dialog.accept()
        })

        await page.route('**/api/events', async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({ status: 500, body: '{}' })
            } else {
                await route.fallback()
            }
        })

        await page.getByRole('button', { name: 'Dodaj nowe wydarzenie' }).click()
        await page.locator('p:has-text("Nazwa wydarzenia") + div input').fill('Błędne wydarzenie')
        await page.locator('p:has-text("Adres") + div input').fill('Gdzieś')
        await page.locator('p:has-text("Data i godzina") + div input').fill('2026-07-01T15:00')
        await page.locator('textarea').fill('Opis')

        const fileChooserPromise = page.waitForEvent('filechooser')
        await page.locator('label[for="event-photo"]').click()
        const fileChooser = await fileChooserPromise
        await fileChooser.setFiles({
            name: 'cover.jpg',
            mimeType: 'image/jpeg',
            buffer: Buffer.from('fake-image-data')
        })

        await page.getByRole('button', { name: 'Utwórz wydarzenie' }).click()
        await expect.poll(() => capturedMessage).toContain('błąd')
    })

    test('nie powinien usuwać wydarzenia, jeśli użytkownik kliknie Anuluj w oknie dialogowym', async ({ page }) => {
        page.on('dialog', async (dialog) => {
            expect(dialog.message()).toBe('Czy na pewno chcesz usunąć to wydarzenie?')
            await dialog.dismiss()
        })

        const eventCard = page.locator('text=Dzielnicowy Turniej Szachowy').first()
        await expect(eventCard).toBeVisible({ timeout: 5000 })

        const deleteButton = page.locator('div').filter({ hasText: /^Dzielnicowy Turniej Szachowy/ }).locator('button').first()
        
        await deleteButton.click()

        await expect(page.locator('text=Dzielnicowy Turniej Szachowy').first()).toBeVisible()
    })
})