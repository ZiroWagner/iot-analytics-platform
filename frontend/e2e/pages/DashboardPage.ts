import type { Page } from '@playwright/test'

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard')
    await this.page.waitForLoadState('load')
    await this.page.waitForTimeout(500)
  }

  async isLoaded() {
    await this.page.waitForURL('/dashboard', { timeout: 10000 })
  }

  get projectList() {
    return this.page.locator('[data-testid="project-list"]')
  }

  get sidebar() {
    return this.page.locator('[role="navigation"]')
  }

  async navigateToProjects() {
    await this.page.getByText('Mis Proyectos').click()
    await this.page.waitForURL('/dashboard/projects', { timeout: 10000 })
    await this.page.waitForLoadState('load')
  }

  async navigateToSettings() {
    await this.page.getByText('Ajustes').click()
    await this.page.waitForURL('/dashboard/settings', { timeout: 10000 })
  }

  async navigateToMetrics() {
    await this.page.getByText('Métricas').click()
    await this.page.waitForURL('/dashboard/metrics', { timeout: 10000 })
  }

  async logout() {
    await this.page.goto('/dashboard/settings')
    await this.page.waitForLoadState('load')
    const logoutBtn = this.page.getByText(/cerrar sesión|logout|sign out/i)
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click()
    }
  }
}
