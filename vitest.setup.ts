import '@testing-library/dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock localStorage for tests
const localStorageMock = {
  getItem: (key: string) => localStorageMock.store[key] || null,
  setItem: (key: string, value: string) => {
    localStorageMock.store[key] = value
  },
  removeItem: (key: string) => {
    delete localStorageMock.store[key]
  },
  clear: () => {
    localStorageMock.store = {}
  },
  store: {} as Record<string, string>,
}

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
})
