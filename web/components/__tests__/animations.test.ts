// web/components/__tests__/animations.test.ts
import { getElementStyle } from '../../../src/compositions/animations'

const FPS = 30

describe('getElementStyle', () => {
  test('returns invisible style before startSec', () => {
    const result = getElementStyle(0, FPS, 2, 5, 'fade', 'fade-out')
    expect(result.style.opacity).toBe(0)
  })

  test('returns invisible style after end', () => {
    const result = getElementStyle(91, FPS, 0, 3, 'fade', 'fade-out')
    expect(result.style.opacity).toBe(0)
  })

  test('returns entryProgress=1 in steady state', () => {
    const result = getElementStyle(75, FPS, 0, 5, 'fade', 'fade-out')
    expect(result.entryProgress).toBe(1)
    expect(result.exitProgress).toBe(0)
    expect(result.style.opacity).toBe(1)
  })

  test('fade entry: opacity increases from 0 to 1 over 20 frames', () => {
    const at0 = getElementStyle(0, FPS, 0, 5, 'fade', 'fade-out')
    const at10 = getElementStyle(10, FPS, 0, 5, 'fade', 'fade-out')
    const at20 = getElementStyle(20, FPS, 0, 5, 'fade', 'fade-out')
    expect(at0.style.opacity).toBeCloseTo(0, 1)
    expect(at10.style.opacity).toBeCloseTo(0.5, 1)
    expect(at20.style.opacity).toBe(1)
  })

  test('none entry: immediately opacity 1', () => {
    const result = getElementStyle(0, FPS, 0, 5, 'none', 'none')
    expect(result.style.opacity).toBe(1)
  })

  test('fade-out exit: opacity decreases from 1 to 0', () => {
    const at70 = getElementStyle(70, FPS, 0, 3, 'fade', 'fade-out')
    const at80 = getElementStyle(80, FPS, 0, 3, 'fade', 'fade-out')
    const at89 = getElementStyle(89, FPS, 0, 3, 'fade', 'fade-out')
    expect(at70.exitProgress).toBeCloseTo(0, 1)
    expect(at80.exitProgress).toBeCloseTo(0.5, 1)
    expect(at89.exitProgress).toBeCloseTo(0.95, 1)
  })

  test('wave entry: returns opacity 1 (per-letter handles it)', () => {
    const result = getElementStyle(0, FPS, 0, 5, 'wave', 'fade-out')
    expect(result.style.opacity).toBe(1)
    expect(result.entryProgress).toBeCloseTo(0, 1)
  })
})
