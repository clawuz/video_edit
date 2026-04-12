import { splitToSubtitles } from '../lib/subtitle-split'
import type { WordSegment } from '../../src/compositions/types'

const words: WordSegment[] = [
  { word: 'Merhaba',  startMs: 0,    endMs: 500  },
  { word: 'dünya.',   startMs: 500,  endMs: 1000 },
  { word: 'İyi',      startMs: 1000, endMs: 1400 },
  { word: 'günler.',  startMs: 1400, endMs: 2000 },
  { word: 'Nasılsın', startMs: 2000, endMs: 2600 },
]

describe('splitToSubtitles — word mode', () => {
  it('each word becomes its own entry', () => {
    const result = splitToSubtitles(words, 'word', 5)
    expect(result).toHaveLength(5)
    expect(result[0]).toEqual({ startMs: 0, endMs: 500, text: 'Merhaba' })
    expect(result[4]).toEqual({ startMs: 2000, endMs: 2600, text: 'Nasılsın' })
  })
})

describe('splitToSubtitles — sentence mode', () => {
  it('splits on punctuation (.!?…)', () => {
    const result = splitToSubtitles(words, 'sentence', 5)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ startMs: 0, endMs: 1000, text: 'Merhaba dünya.' })
    expect(result[1]).toEqual({ startMs: 1000, endMs: 2000, text: 'İyi günler.' })
    expect(result[2]).toEqual({ startMs: 2000, endMs: 2600, text: 'Nasılsın' })
  })

  it('handles ! and ? as sentence endings', () => {
    const segs: WordSegment[] = [
      { word: 'Hello!', startMs: 0, endMs: 500 },
      { word: 'World?', startMs: 500, endMs: 1000 },
    ]
    const result = splitToSubtitles(segs, 'sentence', 5)
    expect(result).toHaveLength(2)
  })
})

describe('splitToSubtitles — chunk mode', () => {
  it('groups by chunkSize', () => {
    const result = splitToSubtitles(words, 'chunk', 2)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ startMs: 0, endMs: 1000, text: 'Merhaba dünya.' })
    expect(result[1]).toEqual({ startMs: 1000, endMs: 2000, text: 'İyi günler.' })
    expect(result[2]).toEqual({ startMs: 2000, endMs: 2600, text: 'Nasılsın' })
  })

  it('handles chunkSize larger than total words', () => {
    const result = splitToSubtitles(words, 'chunk', 100)
    expect(result).toHaveLength(1)
    expect(result[0].startMs).toBe(0)
    expect(result[0].endMs).toBe(2600)
  })
})

describe('splitToSubtitles — edge cases', () => {
  it('returns empty array for empty input', () => {
    expect(splitToSubtitles([], 'sentence', 5)).toEqual([])
    expect(splitToSubtitles([], 'word', 5)).toEqual([])
    expect(splitToSubtitles([], 'chunk', 5)).toEqual([])
  })
})
