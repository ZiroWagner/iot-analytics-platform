import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'

test.describe('Login', () => {
  test('login form renders with required fields', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    await expect(page.getByText('Correo electrónico')).toBeVisible()
    await expect(page.getByText('Contraseña')).toBeVisible()
    await expect(page.getByText('Iniciar sesión')).toBeVisible()
    await expect(page.getByPlaceholder('m@ejemplo.com')).toBeVisible()
  })

  test('shows error with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    await loginPage.fillEmail('wrong@example.com')
    await loginPage.fillPassword('wrongpassword')
    await submitLogin(page)

    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible({ timeout: 10000 })
  })

  test('logs in successfully with test user', async ({ page }) => {
    const token = process.env.E2E_TEST_TOKEN
    test.skip(!token, 'No test user token - skipping')

    const loginPage = new LoginPage(page)
    await loginPage.loginAs(
      'e2e-smoke@example.com',
      'SmokeTest123!',
    )

    await loginPage.isOnDashboard()
    await expect(page.locator('body')).toBeVisible()
  })
})

async function submitLogin(page: import('@playwright/test').Page) {
  await page.click('button[type="submit"]')
}
