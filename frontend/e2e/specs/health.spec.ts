import { test, expect } from '@playwright/test'
import { getApiUrl } from '../global-setup'

test.describe('Health checks', () => {
  test('backend health endpoint returns ok', async ({ request }) => {
    const apiUrl = getApiUrl()
    const response = await request.fetch(`${apiUrl}/health`)
    expect(response.ok()).toBeTruthy()

    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('ok')
    expect(typeof body.data.uptime).toBe('number')
  })

  test('frontend loads successfully', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.ok()).toBeTruthy()
    await expect(page.locator('body')).toBeVisible()
  })
})
