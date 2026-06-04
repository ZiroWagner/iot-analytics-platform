import type { Page } from '@playwright/test'

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login')
    await this.page.waitForLoadState('networkidle')
  }

  async fillEmail(email: string) {
    await this.page.fill('input[name="email"]', email)
  }

  async fillPassword(password: string) {
    await this.page.fill('input[name="password"]', password)
  }

  async submit() {
    await this.page.click('button[type="submit"]')
  }

  async loginAs(email: string, password: string) {
    await this.goto()
    await this.fillEmail(email)
    await this.fillPassword(password)
    await this.submit()
  }

  async switchToRegister() {
    await this.page.getByText('¿No tienes cuenta? Regístrate').click()
  }

  async switchToLogin() {
    await this.page.getByText('¿Ya tienes cuenta? Inicia sesión').click()
  }

  async fillName(name: string) {
    await this.page.fill('input[name="name"]', name)
  }

  async getErrorMessage() {
    return this.page.getByRole('alert')
  }

  async isOnDashboard() {
    return this.page.waitForURL('/dashboard', { timeout: 10000 })
  }
}
