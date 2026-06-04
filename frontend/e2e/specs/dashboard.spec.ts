import { test, expect } from '@playwright/test'
import { DashboardPage } from '../pages/DashboardPage'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const token = process.env.E2E_TEST_TOKEN
    test.skip(!token, 'No test user token - skipping')

    await page.goto('/login')
    await page.evaluate((t) => {
      window.localStorage.setItem('iot_token', t)
    }, token!)
  })

  test('dashboard loads after authentication', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await dashboard.isLoaded()

    await expect(page.locator('body')).toBeVisible()
    await expect(page).toHaveURL('/dashboard')
  })

  test('dashboard page has no critical errors', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await dashboard.isLoaded()

    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.waitForTimeout(2000)

    expect(consoleErrors.filter((e) => !e.includes('favicon'))).toEqual([])
  })
})
