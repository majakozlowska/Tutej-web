import { test, expect } from '@playwright/test'

test.describe('Strona Logowania - Przepływy Biznesowe i Integracja API (Bez bazy danych)', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/login')
        await page.evaluate(() => localStorage.clear())
        await page.reload()
    })

    test('powinien zalogować użytkownika, zapisać sesję i przekierować na stronę główną przy poprawnych danych', async ({ page }) => {
        const fakeJwt = 'header.' + btoa(JSON.stringify({ id: 42, role: 'USER' })) + '.signature'

        await page.route('**/api/auth/login', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    token: fakeJwt,
                    user: { id: 42, role: 'USER' }
                })
            })
        })

        await page.getByPlaceholder('Adres e-mail').fill('jan.kowalski@tutej.pl')
        await page.getByPlaceholder('Hasło').fill('Zorza2026!')
        await page.getByRole('button', { name: 'Zaloguj się' }).click()

        await expect(page).toHaveURL('http://localhost:5173/')

        const localStorageData = await page.evaluate(() => ({
            token: localStorage.getItem('token'),
            isAuth: localStorage.getItem('isAuth'),
            userId: localStorage.getItem('userId')
        }))

        expect(localStorageData.isAuth).toBe('true')
        expect(localStorageData.userId).toBe('42')
        expect(localStorageData.token).toBe(fakeJwt)
    })

    test('powinien wyświetlić komunikat o błędzie przesłany z API, gdy podano złe dane', async ({ page }) => {
        await page.route('**/api/auth/login', async (route) => {
            await route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Podany adres e-mail nie istnieje w systemie.' })
            })
        })

        await page.getByPlaceholder('Adres e-mail').fill('nieistnieje@tutej.pl')
        await page.getByPlaceholder('Hasło').fill('BledneHaslo123')
        await page.getByRole('button', { name: 'Zaloguj się' }).click()

        await expect(page.locator('text=Podany adres e-mail nie istnieje w systemie.')).toBeVisible()
        await expect(page).toHaveURL('http://localhost:5173/login')
    })

    test('powinien obsłużyć awarię infrastruktury sieciowej serwera', async ({ page }) => {
        await page.route('**/api/auth/login', async (route) => {
            await route.abort('failed')
        })

        await page.getByPlaceholder('Adres e-mail').fill('serwer.lezy@tutej.pl')
        await page.getByPlaceholder('Hasło').fill('JakiesHaslo123')
        await page.getByRole('button', { name: 'Zaloguj się' }).click()

        await expect(page.locator('text=Nie można połączyć się z serwerem.')).toBeVisible()
    })

    test('powinien wyświetlić błąd walidacji i nie wysłać żądania, gdy pola są puste', async ({ page }) => {
        let fetchWasCalled = false

        await page.route('**/api/auth/login', async (route) => {
            fetchWasCalled = true
            await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
        })

        await page.getByRole('button', { name: 'Zaloguj się' }).click()

        await expect(page.locator('text=Wszystkie pola są wymagane.')).toBeVisible()
        await expect(page).toHaveURL('http://localhost:5173/login')
        expect(fetchWasCalled).toBe(false)
    })

})