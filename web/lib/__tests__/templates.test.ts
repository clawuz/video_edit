import { TEMPLATES, getTemplate, buildRenderProps } from '../templates'

describe('templates', () => {
  test('TEMPLATES has 3 entries', () => {
    expect(TEMPLATES).toHaveLength(3)
  })

  test('getTemplate returns correct template by id', () => {
    const t = getTemplate('ProductAd')
    expect(t.id).toBe('ProductAd')
    expect(t.label).toBe('Ürün Reklamı')
  })

  test('getTemplate throws for unknown id', () => {
    expect(() => getTemplate('Unknown')).toThrow('Unknown template: Unknown')
  })

  test('buildRenderProps merges defaults with overrides', () => {
    const props = buildRenderProps('ProductAd', { title: 'Test Başlık' })
    expect(props.title).toBe('Test Başlık')
    expect(props.accentColor).toBe('#e67e22') // default korunur
    expect(props.body).toBeDefined()
  })

  test('uses platform dimensions for 9:16', () => {
    const result = buildRenderProps('ProductAd', {}, '9:16')
    expect(result.width).toBe(1080)
    expect(result.height).toBe(1920)
  })

  test('uses platform dimensions for 1:1', () => {
    const result = buildRenderProps('ProductAd', {}, '1:1')
    expect(result.width).toBe(1080)
    expect(result.height).toBe(1080)
  })

  test('uses platform dimensions for 16:9', () => {
    const result = buildRenderProps('ProductAd', {}, '16:9')
    expect(result.width).toBe(1920)
    expect(result.height).toBe(1080)
  })

  test('uses platform dimensions for tiktok', () => {
    const result = buildRenderProps('ProductAd', {}, 'tiktok')
    expect(result.width).toBe(1080)
    expect(result.height).toBe(1920)
  })

  test('falls back to template defaultPlatform when platform not provided', () => {
    const result = buildRenderProps('ProductAd', {})
    expect(result.width).toBe(1080)
    expect(result.height).toBe(1920)
  })

  test('buildRenderProps calculates durationInFrames from durationSeconds', () => {
    const result = buildRenderProps('ProductAd', {}, '9:16', 15)
    expect(result.durationInFrames).toBe(450) // 15s * 30fps
    expect(result.fps).toBe(30)
  })

  test('Subtitle template exists', () => {
    const t = getTemplate('Subtitle')
    expect(t.id).toBe('Subtitle')
    expect(t.defaultPlatform).toBe('9:16')
  })
})
