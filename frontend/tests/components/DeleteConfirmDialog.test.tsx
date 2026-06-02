import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'

describe('DeleteConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Test Project',
    description: 'This action is irreversible.',
    onConfirm: vi.fn(),
  }

  it('renders the dialog with title and description', () => {
    render(<DeleteConfirmDialog {...defaultProps} />)

    expect(screen.getByText('Confirmar Eliminación')).toBeInTheDocument()
    expect(screen.getByText(/Test Project/)).toBeInTheDocument()
    expect(screen.getByText('This action is irreversible.')).toBeInTheDocument()
  })

  it('renders cancel and delete buttons', () => {
    render(<DeleteConfirmDialog {...defaultProps} />)

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument()
  })

  it('calls onConfirm when delete button is clicked', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()

    render(<DeleteConfirmDialog {...defaultProps} onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onOpenChange(false) when cancel button is clicked', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()

    render(<DeleteConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows loading state and disables buttons when loading', () => {
    render(<DeleteConfirmDialog {...defaultProps} loading={true} />)

    expect(screen.getByRole('button', { name: 'Eliminando...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })

  it('does not render when open is false', () => {
    const { container } = render(
      <DeleteConfirmDialog {...defaultProps} open={false} />,
    )

    expect(container.textContent).not.toContain('Confirmar Eliminación')
  })
})
