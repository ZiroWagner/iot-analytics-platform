import { describe, it, expect } from 'vitest'

// Import all pages to ensure re-exports are covered
import LoginPage from '@/app/login/page'
import DashboardPage from '@/app/dashboard/page'
import DashboardLayout from '@/app/dashboard/layout'
import ProjectsPage from '@/app/dashboard/projects/page'
import ProjectDetailPage from '@/app/dashboard/projects/[id]/page'
import MetricsPage from '@/app/dashboard/metrics/page'
import OAuthCallbackPage from '@/app/auth/callback/page'
import * as HealthCheck from '@/app/api/health/route'

describe('App Pages Smoke Test', () => {
  it('should export valid components/routes', () => {
    expect(LoginPage).toBeDefined()
    expect(DashboardPage).toBeDefined()
    expect(DashboardLayout).toBeDefined()
    expect(ProjectsPage).toBeDefined()
    expect(ProjectDetailPage).toBeDefined()
    expect(MetricsPage).toBeDefined()
    expect(OAuthCallbackPage).toBeDefined()
    expect(HealthCheck.GET).toBeDefined()
  })
})
