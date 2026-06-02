import { test, expect } from '@playwright/test'

const MOCK_FORUMS = [
    {
        id: 12,
        name: 'Ogródki i Zieleń',
        description: 'Wymiana doświadczeń o osiedlowej roślinności.',
        icon: '🌿',
        _count: { posts: 45 }
    },
    {
        id: 15,
        name: 'Bezpieczeństwo',
        description: 'Zgłoszenia i dyskusje o monitoringu.',
        icon: null,     
        _count: null    
    }
]

test.describe('Strona Główna Forum - Cykl Życia i Nawigacja (Bez bazy danych)', () => {

    test.beforeEach(async ({ context }) => {
        await context.addInitScript(() => {
            window.localStorage.setItem('userId', '200')
            window.localStorage.setItem('isAuth', 'true')
            window.localStorage.setItem('token', 'fake-jwt-token')
        })
    })

    test('powinien wyświetlić stan ładowania przed wstrzyknięciem danych z API', async ({ page }) => {
        let resolveRoute: (value: unknown) => void
        const routePromise = new Promise(resolve => { resolveRoute = resolve })

        await page.route('**/api/forums', async (route) => {
            await routePromise
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(MOCK_FORUMS)
            })
        })

        await page.goto('http://localhost:5173/forum')

        await expect(page.locator('div[class*="loadingState"]')).toBeVisible()

        await expect(page.locator('h2:has-text("Ogródki i Zieleń")')).not.toBeVisible()
        await expect(page.locator('h2:has-text("Bezpieczeństwo")')).not.toBeVisible()

        resolveRoute!(true)
    })

    test('powinien prawidłowo obsłużyć brakujące dane z API i przekierować do wątku po kliknięciu', async ({ page }) => {
        await page.route('**/api/forums', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(MOCK_FORUMS)
            })
        })

        await page.goto('http://localhost:5173/forum')

        await expect(page.locator('div[class*="loadingState"]')).not.toBeVisible({ timeout: 7000 })

        const defaultIconCard = page.locator('button', { hasText: 'Bezpieczeństwo' })

        await expect(defaultIconCard.locator('text=💬')).toBeVisible()

        await expect(defaultIconCard.locator('[class*="postCount"]:has-text("0")')).toBeVisible()

        await page.locator('h2:has-text("Ogródki i Zieleń")').click()
        await expect(page).toHaveURL('http://localhost:5173/forum/12')
    })

    test('powinien wyświetlić pustą listę i nie crashować, gdy serwer zwróci błąd sieci', async ({ page }) => {
        await page.route('**/api/forums', async (route) => {
            await route.abort('failed')
        })

        await page.goto('http://localhost:5173/forum')

        await expect(page.locator('div[class*="loadingState"]')).not.toBeVisible({ timeout: 7000 })

        await expect(page.locator('h2:has-text("Ogródki i Zieleń")')).not.toBeVisible()

        await expect(page.locator('text=Forum')).toBeVisible()
    })
})