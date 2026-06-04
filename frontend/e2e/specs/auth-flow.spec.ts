import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'

const REGISTER_USER = {
  email: `e2e-register-${Date.now()}@example.com`,
  password: 'RegisterTest123!',
  name: 'Register Test User',
}

test.describe('Authentication flow', () => {
  test('register new user and redirect to dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    await loginPage.switchToRegister()

    await loginPage.fillName(REGISTER_USER.name)
    await loginPage.fillEmail(REGISTER_USER.email)
    await loginPage.fillPassword(REGISTER_USER.password)

    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn).toBeEnabled({ timeout: 5000 })
    await submitBtn.click()

    await loginPage.isOnDashboard()
    await expect(page.locator('body')).toBeVisible()
  })

  test('login with registered user returns to dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.loginAs(REGISTER_USER.email, REGISTER_USER.password)
    await loginPage.isOnDashboard()
    await expect(page.locator('body')).toBeVisible()
  })
})
