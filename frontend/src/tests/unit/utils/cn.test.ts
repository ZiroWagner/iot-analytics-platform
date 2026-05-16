import { describe, expect, it } from 'vitest'
import { cn } from '@/shared/lib/utils'

describe('cn', () => {
  it('merges simple class names', () => {
    const result = cn('bg-red-500', 'text-white')
    expect(result).toBe('bg-red-500 text-white')
  })

  it('handles conditional classes', () => {
    const isActive = true
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toContain('base-class')
    expect(result).toContain('active-class')
  })

  it('filters out falsy values', () => {
    const result = cn('valid', false, null, undefined, 0, 'also-valid')
    expect(result).toBe('valid also-valid')
  })

  it('deduplicates conflicting tailwind classes', () => {
    const result = cn('bg-red-500', 'bg-blue-500')
    expect(result).toBe('bg-blue-500')
  })

  it('handles array inputs', () => {
    const classes = ['class1', 'class2']
    const result = cn(classes)
    expect(result).toBe('class1 class2')
  })

  it('handles object inputs for conditional classes', () => {
    const result = cn({
      'bg-red-500': true,
      'bg-blue-500': false,
    })
    expect(result).toBe('bg-red-500')
  })
})