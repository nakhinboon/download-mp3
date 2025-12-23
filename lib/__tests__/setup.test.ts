import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Test file to verify testing framework setup
 * - Vitest for unit testing
 * - fast-check for property-based testing
 */

describe('Testing Framework Setup', () => {
  it('should run basic Vitest test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have access to globals', () => {
    expect(typeof describe).toBe('function')
    expect(typeof it).toBe('function')
    expect(typeof expect).toBe('function')
  })

  it('should have localStorage mock available', () => {
    localStorage.setItem('test-key', 'test-value')
    expect(localStorage.getItem('test-key')).toBe('test-value')
    localStorage.removeItem('test-key')
    expect(localStorage.getItem('test-key')).toBeNull()
  })
})

describe('fast-check Property-Based Testing Setup', () => {
  it('should run property-based tests with fast-check', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        // Commutative property of addition
        return a + b === b + a
      }),
      { numRuns: 100 }
    )
  })

  it('should generate arbitrary strings', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        // String length is always non-negative
        return s.length >= 0
      }),
      { numRuns: 100 }
    )
  })

  it('should generate arbitrary arrays', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (arr) => {
        // Array length is always non-negative
        return arr.length >= 0
      }),
      { numRuns: 100 }
    )
  })
})
