import { test, expect } from '@playwright/test'

const MOCK_USER = {
    id: 42,
    firstName: 'Jan',
    lastName: 'Kowalski',
    email: 'jan@tutej.app',
    photo: null,
    neighborhood: { name: 'Osiedle Różane' }
}

test.describe('Ustawienia Użytkownika - Profil i Bezpieczeństwo', () => {

    test.beforeEach(async ({ context, page }) => {
        await context.addInitScript(() => {
            window.localStorage.setItem('token', 'valid-settings-token')
        })

        await page.route('**/api/auth/me', async (route) => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) })
            }
        })
        await page.goto('http://localhost:5173/settings/account')
        await page.locator('text=jan@tutej.app').waitFor({ state: 'visible' })
    })

    test('powinien zablokować wysłanie zapytania HTTP gdy hasła się nie zgadzają', async ({ page }) => {
        let apiCalled = false
        await page.route('**/api/auth/me/password', async (route) => {
            apiCalled = true
            await route.abort()
        })

        await page.getByPlaceholder('••••••••').nth(0).fill('StareHaslo123')
        await page.getByPlaceholder('••••••••').nth(1).fill('NoweHaslo123')
        await page.getByPlaceholder('••••••••').nth(2).fill('InneHaslo123')

        await page.getByRole('button', { name: 'Zmień hasło' }).click()

        expect(apiCalled).toBe(false)

        await expect(page.locator('[class*="error"]').last()).toBeVisible()
    })

    test('powinien zablokować wysłanie zapytania HTTP gdy nowe hasło jest za krótkie', async ({ page }) => {
        let apiCalled = false
        await page.route('**/api/auth/me/password', async (route) => {
            apiCalled = true
            await route.abort()
        })

        await page.getByPlaceholder('••••••••').nth(0).fill('StareHaslo123')
        await page.getByPlaceholder('••••••••').nth(1).fill('Ab1')   
        await page.getByPlaceholder('••••••••').nth(2).fill('Ab1')  

        await page.getByRole('button', { name: 'Zmień hasło' }).click()

        expect(apiCalled).toBe(false)
        await expect(page.locator('[class*="error"]').last()).toBeVisible()
    })

    test('powinien wysłać poprawne zapytanie PUT podczas aktualizacji danych profilu', async ({ page }) => {
        let interceptedBody: any = null

        await page.route('**/api/auth/me', async (route) => {
            if (route.request().method() === 'PUT') {
                interceptedBody = route.request().postDataJSON()
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
            }
        })

        await page.getByPlaceholder('Wpisz imię').fill('Janusz')
        await page.getByRole('button', { name: 'Zapisz zmiany' }).click()

        expect(interceptedBody).not.toBeNull()
        expect(interceptedBody.firstName).toBe('Janusz')
        expect(interceptedBody.lastName).toBe('Kowalski')
    })

    test('powinien wysłać żądanie zmiany hasła z poprawnymi danymi gdy walidacja przejdzie', async ({ page }) => {
        let interceptedBody: any = null

        await page.route('**/api/auth/me/password', async (route) => {
            interceptedBody = route.request().postDataJSON()
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
        })

        await page.getByPlaceholder('••••••••').nth(0).fill('StareHaslo123')
        await page.getByPlaceholder('••••••••').nth(1).fill('NoweHaslo123')
        await page.getByPlaceholder('••••••••').nth(2).fill('NoweHaslo123')

        await page.getByRole('button', { name: 'Zmień hasło' }).click()

        expect(interceptedBody).not.toBeNull()
        expect(interceptedBody.currentPassword).toBe('StareHaslo123')
        expect(interceptedBody.newPassword).toBe('NoweHaslo123')
        expect(interceptedBody.confirmPassword).toBeUndefined()
    })
})