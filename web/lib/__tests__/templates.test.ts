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
    expect(props.features).toBeDefined()
  })

  test('buildRenderProps includes width/height/durationInFrames/fps', () => {
    const props = buildRenderProps('ProductAd', {}, '1920x1080', 15)
    expect(props.width).toBe(1920)
    expect(props.height).toBe(1080)
    expect(props.durationInFrames).toBe(450) // 15s * 30fps
    expect(props.fps).toBe(30)
  })
})
