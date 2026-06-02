import { test, expect } from '@playwright/test'

const MOCK_LISTINGS = [
    {
        id: 1,
        title: 'Rower górski MTB',
        description: 'W dobrym stanie',
        price: '500.00',
        contact: '123456789',
        status: 'AVAILABLE',
        createdAt: '2026-06-01T12:00:00Z',
        authorId: 10,
        author: { firstName: 'Anna', lastName: 'Nowak' },
        images: []
    },
    {
        id: 2,
        title: 'Kosiarka spalinowa',
        description: 'Używana jeden sezon',
        price: '350.00',
        contact: '987654321',
        status: 'AVAILABLE',
        createdAt: '2026-06-01T13:00:00Z',
        authorId: 99,
        author: { firstName: 'Jan', lastName: 'Kowalski' },
        images: []
    }
]

const MOCK_NEW_LISTING = {
    id: 3,
    title: 'Stół drewniany',
    description: 'Piękny dębowy stół',
    price: 150.50,
    contact: 'test@tutej.app',
    status: 'AVAILABLE',
    createdAt: '2026-06-01T14:00:00Z',
    authorId: 99,
    author: { firstName: 'Jan', lastName: 'Kowalski' },
    images: []
}

test.describe('Giełda Sąsiedzka (Trade) - Filtry i Publikacja', () => {

    test.beforeEach(async ({ context, page }) => {
        await context.addInitScript(() => {
            window.localStorage.setItem('userId', '99')
            window.localStorage.setItem('token', 'valid-token')
        })

        await page.route('http://localhost:5000/api/listings', async (route) => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_LISTINGS) })
            } else {
                await route.continue()
            }
        })

        await page.goto('http://localhost:5173/trade')
        await page.getByRole('heading', { name: 'Giełda sąsiedzka' }).waitFor({ state: 'visible' })
    })

    test('powinien poprawnie odfiltrować ogłoszenia po kliknięciu "Moje oferty"', async ({ page }) => {
        await expect(page.locator('text=Rower górski MTB')).toBeVisible()
        await expect(page.locator('text=Kosiarka spalinowa')).toBeVisible()

        await page.getByRole('button', { name: 'Moje oferty' }).click()

        await expect(page.locator('text=Kosiarka spalinowa')).toBeVisible()
        await expect(page.locator('text=Rower górski MTB')).not.toBeVisible()
    })

    test('powinien po powrocie do "Wszystkie oferty" pokazać ponownie wszystkie ogłoszenia', async ({ page }) => {
        await page.getByRole('button', { name: 'Moje oferty' }).click()
        await expect(page.locator('text=Rower górski MTB')).not.toBeVisible()

        await page.getByRole('button', { name: 'Wszystkie oferty' }).click()

        await expect(page.locator('text=Rower górski MTB')).toBeVisible()
        await expect(page.locator('text=Kosiarka spalinowa')).toBeVisible()
    })

    test('powinien wysłać zapytanie POST i wyświetlić nowe ogłoszenie na liście', async ({ page }) => {
        let submittedPayload: any = null

        await page.route('http://localhost:5000/api/listings', async (route) => {
            if (route.request().method() === 'POST') {
                submittedPayload = route.request().postDataJSON()
                await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(MOCK_NEW_LISTING) })
            } else {
                await route.continue()
            }
        })

        await page.getByRole('button', { name: 'Dodaj nową ofertę' }).click()

        await page.locator('[class*="modal"]').getByRole('textbox').first().fill('Stół drewniany')
        await page.getByPlaceholder('Zostaw puste, jeśli darmowe').fill('150.50')
        await page.getByPlaceholder('Nr telefonu lub email').fill('test@tutej.app')
        await page.locator('[class*="modal"]').locator('textarea').fill('Piękny dębowy stół')

        const fileChooserPromise = page.waitForEvent('filechooser')
        await page.locator('label[for="photos"]').click()
        const fileChooser = await fileChooserPromise
        await fileChooser.setFiles({
            name: 'test-image.png',
            mimeType: 'image/png',
            buffer: Buffer.from('fake-base64-content')
        })

        await page.getByRole('button', { name: 'Opublikuj ogłoszenie' }).click()

        expect(submittedPayload).not.toBeNull()
        expect(typeof submittedPayload.price).toBe('number')
        expect(submittedPayload.price).toBe(150.50)
        expect(submittedPayload.title).toBe('Stół drewniany')
        expect(submittedPayload.contact).toBe('test@tutej.app')
        expect(submittedPayload.authorId).toBe(99)
        expect(Array.isArray(submittedPayload.images)).toBe(true)
        expect(submittedPayload.images.length).toBeGreaterThan(0)

        await expect(page.locator('text=Stół drewniany')).toBeVisible()
    })

    test('powinien zablokować wysłanie formularza gdy brak zdjęć', async ({ page }) => {
        let apiCalled = false
        await page.route('http://localhost:5000/api/listings', async (route) => {
            if (route.request().method() === 'POST') {
                apiCalled = true
                await route.abort()
            } else {
                await route.continue()
            }
        })

        await page.getByRole('button', { name: 'Dodaj nową ofertę' }).click()

        await page.locator('[class*="modal"]').getByRole('textbox').first().fill('Stół drewniany')
        await page.getByPlaceholder('Nr telefonu lub email').fill('test@tutej.app')
        await page.locator('textarea').fill('Opis')

        page.on('dialog', dialog => dialog.accept())

        await page.getByRole('button', { name: 'Opublikuj ogłoszenie' }).click()

        expect(apiCalled).toBe(false)
    })
})