import { buildRenderCommand, getOutputPath } from '../renderer'

describe('renderer', () => {
  test('buildRenderCommand üretilen komutu doğru oluşturur', () => {
    const cmd = buildRenderCommand({
      compositionId: 'ProductAd',
      outputPath: '/tmp/test.mp4',
      props: { title: 'Test', accentColor: '#fff' },
    })
    expect(cmd).toContain('npx remotion render ProductAd')
    expect(cmd).toContain('/tmp/test.mp4')
    expect(cmd).toContain('--props=')
    expect(cmd).toContain('Test')
  })

  test('getOutputPath uuid içeren mp4 yolu döner', () => {
    const p = getOutputPath('/tmp/out')
    expect(p).toMatch(/\/tmp\/out\/.+\.mp4$/)
    // Her çağrıda farklı UUID
    expect(p).not.toBe(getOutputPath('/tmp/out'))
  })
})
