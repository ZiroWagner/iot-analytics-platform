import { test, expect } from '@playwright/test'
import { DashboardPage } from '../pages/DashboardPage'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    const token = process.env.E2E_TEST_TOKEN
    test.skip(!token, 'No test user token - skipping')

    await page.goto('/login')
    await page.evaluate((t) => {
      window.localStorage.setItem('iot_token', t)
    }, token!)
  })

  test('sidebar navigation links are visible', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await dashboard.isLoaded()

    await expect(page.getByText('Mis Proyectos')).toBeVisible()
  })

  test('navigates to projects page', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await dashboard.isLoaded()

    await dashboard.navigateToProjects()
    await expect(page).toHaveURL(/\/dashboard\/projects/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('navigates to settings page', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await dashboard.isLoaded()

    await dashboard.navigateToSettings()
    await expect(page).toHaveURL(/\/dashboard\/settings/)
    await expect(page.locator('body')).toBeVisible()
  })
})
