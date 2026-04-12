import { parseSrt, exportSrt } from '../lib/srt'

describe('parseSrt', () => {
  it('parses a single entry', () => {
    const input = '1\n00:00:00,000 --> 00:00:02,500\nMerhaba dünya.\n'
    const result = parseSrt(input)
    expect(result).toEqual([{ startMs: 0, endMs: 2500, text: 'Merhaba dünya.' }])
  })

  it('parses multiple entries', () => {
    const input = '1\n00:00:00,000 --> 00:00:02,000\nFirst line.\n\n2\n00:00:02,000 --> 00:00:05,300\nSecond line.\n'
    const result = parseSrt(input)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ startMs: 0, endMs: 2000, text: 'First line.' })
    expect(result[1]).toEqual({ startMs: 2000, endMs: 5300, text: 'Second line.' })
  })

  it('parses hours correctly', () => {
    const input = '1\n01:02:03,456 --> 01:02:05,000\nTest.\n'
    const result = parseSrt(input)
    expect(result[0].startMs).toBe(1 * 3600000 + 2 * 60000 + 3 * 1000 + 456)
    expect(result[0].endMs).toBe(1 * 3600000 + 2 * 60000 + 5 * 1000)
  })

  it('skips malformed blocks', () => {
    const input = 'bad block\n\n1\n00:00:01,000 --> 00:00:02,000\nGood.\n'
    const result = parseSrt(input)
    expect(result).toHaveLength(1)
    expect(result[0].text).toBe('Good.')
  })

  it('handles multi-line subtitle text', () => {
    const input = '1\n00:00:00,000 --> 00:00:03,000\nLine one\nLine two\n'
    const result = parseSrt(input)
    expect(result[0].text).toBe('Line one\nLine two')
  })
})

describe('exportSrt', () => {
  it('exports single entry', () => {
    const result = exportSrt([{ startMs: 0, endMs: 2500, text: 'Merhaba dünya.' }])
    expect(result).toBe('1\n00:00:00,000 --> 00:00:02,500\nMerhaba dünya.\n\n')
  })

  it('exports multiple entries with sequence numbers', () => {
    const subtitles = [
      { startMs: 0, endMs: 2000, text: 'First.' },
      { startMs: 2000, endMs: 5300, text: 'Second.' },
    ]
    const result = exportSrt(subtitles)
    expect(result).toContain('1\n00:00:00,000 --> 00:00:02,000\nFirst.\n')
    expect(result).toContain('2\n00:00:02,000 --> 00:00:05,300\nSecond.\n')
  })

  it('round-trips: parseSrt(exportSrt(x)) === x', () => {
    const original = [
      { startMs: 0, endMs: 1000, text: 'Hello.' },
      { startMs: 1000, endMs: 3500, text: 'World.' },
    ]
    expect(parseSrt(exportSrt(original))).toEqual(original)
  })

  it('pads hours with leading zero', () => {
    const result = exportSrt([{ startMs: 3600000, endMs: 7200000, text: 'Test.' }])
    expect(result).toContain('01:00:00,000 --> 02:00:00,000')
  })
})
