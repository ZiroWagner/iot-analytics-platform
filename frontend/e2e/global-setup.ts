import { request } from '@playwright/test'

export const TEST_USER = {
  email: 'e2e-smoke@example.com',
  password: 'SmokeTest123!',
  name: 'Smoke Test User',
}

export const getApiBaseUrl = () =>
  process.env.CI
    ? 'http://backend:3000'
    : process.env.API_URL || 'http://localhost:3000'

export const getApiUrl = () => `${getApiBaseUrl()}/api/v1`

async function globalSetup() {
  const baseUrl = getApiBaseUrl()
  const apiContext = await request.newContext({ baseURL: baseUrl })

  const response = await apiContext.post('/api/v1/auth/register', {
    data: TEST_USER,
  })

  if (response.ok()) {
    const body = await response.json()
    process.env['E2E_TEST_TOKEN'] = body.data.access_token
    console.log('Test user registered successfully')
  } else if (response.status() === 409) {
    const loginResponse = await apiContext.post('/api/v1/auth/login', {
      data: { email: TEST_USER.email, password: TEST_USER.password },
    })
    if (loginResponse.ok()) {
      const loginBody = await loginResponse.json()
      process.env['E2E_TEST_TOKEN'] = loginBody.data.access_token
      console.log('Test user already exists, logged in')
    }
  } else {
    const text = await response.text()
    console.error('Failed to create test user:', response.status(), text)
  }

  await apiContext.dispose()
}

export default globalSetup
