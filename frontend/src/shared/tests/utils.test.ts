import { describe, expect, it } from 'vitest'
import { cn } from '@/shared/lib'

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b', false, null, undefined, 'd')).toBe('a b d')
  })

  it('dedupes conflicting tailwind utilities (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('returns an empty string for no arguments', () => {
    expect(cn()).toBe('')
  })
})
