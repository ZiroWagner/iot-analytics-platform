import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_URL } from '@/shared/infrastructure/http'
import { server } from '../../mocks/server'
import { httpAuthRepository } from '@/features/auth/infrastructure/auth.repository'

describe('httpAuthRepository', () => {
  it('sends login credentials to the auth endpoint', async () => {
    const credentials = {
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 }),
    }
    const token = faker.string.alphanumeric(24)

    server.use(
      http.post(`${API_URL}/auth/login`, async ({ request }) => {
        await expect(request.json()).resolves.toEqual(credentials)
        return HttpResponse.json({ access_token: token })
      }),
    )

    await expect(httpAuthRepository.login(credentials)).resolves.toEqual({
      access_token: token,
    })
  })

  it('sends registration data to the auth endpoint', async () => {
    const credentials = {
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 }),
      name: faker.person.firstName(),
    }
    const token = faker.string.alphanumeric(24)

    server.use(
      http.post(`${API_URL}/auth/register`, async ({ request }) => {
        await expect(request.json()).resolves.toEqual(credentials)
        return HttpResponse.json({ access_token: token })
      }),
    )

    await expect(httpAuthRepository.register(credentials)).resolves.toEqual({
      access_token: token,
    })
  })
})