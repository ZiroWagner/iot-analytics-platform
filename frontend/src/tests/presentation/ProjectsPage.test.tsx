import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProjectsPage } from '@/features/projects/presentation/pages/ProjectsPage'
import { useProjects } from '@/features/projects/presentation/hooks/useProjects'
import { httpProjectsRepository } from '@/features/projects/infrastructure/projects.repository'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import userEvent from '@testing-library/user-event'

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/features/projects/presentation/hooks/useProjects', () => ({
  useProjects: vi.fn(),
}))

vi.mock('@/features/projects/infrastructure/projects.repository', () => ({
  httpProjectsRepository: {
    create: vi.fn(),
  },
}))

vi.mock('../../domain/schemas', async () => {
  const { z } = await vi.importActual<typeof import('zod')>('zod')
  return {
    createProjectSchema: z.object({
      name: z.string().min(2),
    }),
  }
})

describe('ProjectsPage', () => {
  const mockRouter = { push: vi.fn() }
  const mockProjects = [
    { id: 'p1', name: 'Project 1', createdAt: new Date().toISOString(), _count: { devices: 5 }, devices: [] },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter as any)
    vi.mocked(useProjects).mockReturnValue({
      projects: mockProjects,
      loading: false,
      unauthorized: false,
      refetch: vi.fn(),
    } as any)
  })

  it('renders loading state', () => {
    vi.mocked(useProjects).mockReturnValue({
      projects: [],
      loading: true,
      unauthorized: false,
      refetch: vi.fn(),
    } as any)

    const { container } = render(<ProjectsPage />)
    expect(container.querySelector('.animate-spin')).toBeDefined()
  })

  it('renders empty state', () => {
    vi.mocked(useProjects).mockReturnValue({
      projects: [],
      loading: false,
      unauthorized: false,
      refetch: vi.fn(),
    } as any)

    render(<ProjectsPage />)
    expect(screen.getByText(/No tienes proyectos creados aún/i)).toBeDefined()
  })

  it('renders projects list', () => {
    render(<ProjectsPage />)
    expect(screen.getByText('Project 1')).toBeDefined()
    expect(screen.getByText(/Devices Activos/i)).toBeDefined()
  })

  it('redirects to login if unauthorized', () => {
    vi.mocked(useProjects).mockReturnValue({
      projects: [],
      loading: false,
      unauthorized: true,
      refetch: vi.fn(),
    } as any)

    render(<ProjectsPage />)
    expect(mockRouter.push).toHaveBeenCalledWith('/login')
  })

  it('opens dialog and creates project successfully', async () => {
    const user = userEvent.setup()
    vi.mocked(httpProjectsRepository.create).mockResolvedValue({ id: 'new-p' } as any)
    
    render(<ProjectsPage />)
    
    await user.click(screen.getByText('Nuevo Proyecto'))
    expect(screen.getByText('Crear Nuevo Proyecto')).toBeDefined()
    
    await user.type(screen.getByPlaceholderText(/Sector Logístico/i), 'New Project')
    await user.click(screen.getByRole('button', { name: /Guardar/i }))
    
    await waitFor(() => {
      expect(httpProjectsRepository.create).toHaveBeenCalledWith({ name: 'New Project' })
      expect(toast.success).toHaveBeenCalledWith('Proyecto creado exitosamente')
    })
  })

  it('handles project creation error', async () => {
    const user = userEvent.setup()
    vi.mocked(httpProjectsRepository.create).mockRejectedValue(new Error('Failed'))
    
    render(<ProjectsPage />)
    await user.click(screen.getByText('Nuevo Proyecto'))
    await user.type(screen.getByPlaceholderText(/Sector Logístico/i), 'Fail Project')
    await user.click(screen.getByRole('button', { name: /Guardar/i }))
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Hubo un problema al crear el proyecto')
    })
  })

  it('navigates to project detail', async () => {
    const user = userEvent.setup()
    render(<ProjectsPage />)
    await user.click(screen.getByText('Gestionar Sensores'))
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/projects/p1')
  })
})
