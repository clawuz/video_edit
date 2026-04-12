import { PLATFORMS, PLATFORM_KEYS, FONTS } from '../../src/compositions/platforms'

describe('PLATFORMS', () => {
  it('tiktok has correct safe areas', () => {
    expect(PLATFORMS['tiktok'].safeTop).toBe(160)
    expect(PLATFORMS['tiktok'].safeBottom).toBe(480)
    expect(PLATFORMS['tiktok'].safeLeft).toBe(120)
    expect(PLATFORMS['tiktok'].safeRight).toBe(120)
  })

  it('1:1 has square dimensions', () => {
    expect(PLATFORMS['1:1'].w).toBe(1080)
    expect(PLATFORMS['1:1'].h).toBe(1080)
  })

  it('16:9 has landscape dimensions', () => {
    expect(PLATFORMS['16:9'].w).toBe(1920)
    expect(PLATFORMS['16:9'].h).toBe(1080)
  })

  it('PLATFORM_KEYS contains all platforms', () => {
    expect(PLATFORM_KEYS).toContain('tiktok')
    expect(PLATFORM_KEYS).toContain('instagram-reels')
    expect(PLATFORM_KEYS).toContain('1:1')
    expect(PLATFORM_KEYS).toContain('16:9')
    expect(PLATFORM_KEYS).toContain('9:16')
  })

  it('every key in PLATFORM_KEYS has an entry in PLATFORMS', () => {
    for (const key of PLATFORM_KEYS) {
      expect(PLATFORMS[key]).toBeDefined()
    }
  })

  it('FONTS includes Noto Sans for Turkish support', () => {
    expect(FONTS).toContain('Noto Sans')
  })
})
