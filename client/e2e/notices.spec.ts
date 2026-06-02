import { test, expect } from '@playwright/test'

const MOCK_NOTICES = [
    {
        id: 201,
        title: 'Modernizacja placu zabaw',
        content: 'Od poniedziałku ruszają prace konserwacyjne.',
        media: null,
        createdAt: '2026-06-01T10:00:00Z',
        author: { id: 5, firstName: 'Adam', lastName: 'Nowak', photo: null, role: 'COUNCILLOR' }
    }
]

test.describe('Ogłoszenia - Zarządzanie Uprawnieniami i Publikacja', () => {

    test('powinien ukryć przycisk tworzenia dla zwykłego użytkownika (USER)', async ({ context, page }) => {
        await context.addInitScript(() => {
            window.localStorage.setItem('isAuth', 'true')
            window.localStorage.setItem('userRole', 'USER')
            window.localStorage.setItem('token', 'user-token')
        })

        await page.route('**/api/notices', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(MOCK_NOTICES)
            })
        })

        await page.goto('http://localhost:5173/notices')
        await expect(page.locator('text=Modernizacja placu zabaw')).toBeVisible({ timeout: 7000 })

        await expect(page.getByRole('button', { name: 'Dodaj nowe ogłoszenie' })).not.toBeVisible()
    })

    test('powinien pozwolić radnemu (COUNCILLOR) dodać ogłoszenie i umieścić je na początku listy', async ({ context, page }) => {
        await context.addInitScript(() => {
            window.localStorage.setItem('isAuth', 'true')
            window.localStorage.setItem('userRole', 'COUNCILLOR')
            window.localStorage.setItem('token', 'councillor-token')
        })

        await page.route('**/api/notices', async (route) => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(MOCK_NOTICES)
                })
            }
            if (route.request().method() === 'POST') {
                const headers = route.request().headers()
                expect(headers['authorization']).toBe('Bearer councillor-token')

                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: 202,
                        title: 'Pilny komunikat o wodzie',
                        content: 'W czwartek nastąpi przerwa w dostawie wody.',
                        media: null,
                        createdAt: '2026-06-01T11:00:00Z',
                        author: { id: 5, firstName: 'Adam', lastName: 'Nowak', photo: null, role: 'COUNCILLOR' }
                    })
                })
            }
        })

        await page.goto('http://localhost:5173/notices')
        await expect(page.locator('text=Modernizacja placu zabaw')).toBeVisible({ timeout: 7000 })

        await page.getByRole('button', { name: 'Dodaj nowe ogłoszenie' }).click()

        await page.getByPlaceholder('Wpisz tytuł...').fill('Pilny komunikat o wodzie')
        await page.locator('textarea').fill('W czwartek nastąpi przerwa w dostawie wody.')

        await page.getByRole('button', { name: 'Opublikuj' }).click()

        await expect(page.locator('text=Pilny komunikat o wodzie')).toBeVisible()
        await expect(page.getByPlaceholder('Wpisz tytuł...')).not.toBeVisible()
    })

    test('powinien wyświetlić pustą listę i nie crashować gdy serwer zwróci błąd sieci', async ({ context, page }) => {
        await context.addInitScript(() => {
            window.localStorage.setItem('isAuth', 'true')
            window.localStorage.setItem('userRole', 'USER')
            window.localStorage.setItem('token', 'user-token')
        })

        await page.route('**/api/notices', async (route) => {
            await route.abort('failed')
        })

        await page.goto('http://localhost:5173/notices')

        await expect(page.locator('[class*="skeletonList"]')).not.toBeVisible({ timeout: 7000 })

        await expect(page.locator('text=Ogłoszenia')).toBeVisible()
        await expect(page.locator('text=Modernizacja placu zabaw')).not.toBeVisible()
    })
})