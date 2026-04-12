# Subtitle & Safe Area System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Platform-aware safe area sistemi tüm şablonlara eklenir; TalkingHead kaldırılarak yerini Whisper Local (faster-whisper) tabanlı, SRT import/export destekli Subtitle şablonu alır.

**Architecture:** Merkezi `platforms.ts` sabiti tüm şablonlara platform → width/height/safeArea bilgisi sağlar. Subtitle composition safe area'ya göre altyazı konumlandırır. Python FastAPI servisi (port 8765) Whisper Large v3 çalıştırır; Node.js bunu proxy eder. SRT parse/export saf utility fonksiyonları olarak ayrı dosyada tutulur.

**Tech Stack:** Remotion 4, Next.js 14, faster-whisper (Python), FastAPI, Zod, Jest, TypeScript

---

## File Map

### Yeni Dosyalar
| Dosya | Sorumluluk |
|-------|-----------|
| `src/compositions/platforms.ts` | PLATFORMS sabiti, PLATFORM_KEYS, PlatformKey tipi, FONTS listesi |
| `src/compositions/Subtitle.tsx` | Subtitle Remotion composition |
| `web/lib/srt.ts` | parseSrt, exportSrt saf utility fonksiyonları |
| `web/lib/subtitle-split.ts` | splitToSubtitles (sentence/word/chunk) saf utility |
| `web/app/api/transcribe/route.ts` | Whisper proxy endpoint |
| `web/app/api/srt-parse/route.ts` | SRT import endpoint |
| `web/app/api/srt-export/route.ts` | SRT export endpoint |
| `whisper_service/server.py` | FastAPI Whisper servisi (port 8765) |
| `whisper_service/requirements.txt` | Python bağımlılıkları |
| `web/__tests__/platforms.test.ts` | platforms.ts unit testleri |
| `web/__tests__/templates.test.ts` | templates.ts buildRenderProps testleri |
| `web/__tests__/srt.test.ts` | srt.ts unit testleri |
| `web/__tests__/subtitle-split.test.ts` | subtitle-split.ts unit testleri |

### Güncellenen Dosyalar
| Dosya | Değişiklik |
|-------|-----------|
| `src/compositions/types.ts` | SubtitleEntry, WordSegment, SubtitleSplitMode eklenir |
| `src/Root.tsx` | TalkingHead → Subtitle; calculateMetadata'da platform→width/height |
| `web/lib/templates.ts` | defaultFormat → defaultPlatform; buildRenderProps platform alır; Subtitle template eklenir |
| `web/app/api/render/route.ts` | format → platform |
| `web/app/page.tsx` | format → platform |
| `web/components/ParamForm.tsx` | platform dropdown (ilk sıra); FONTS import; subtitle UI |
| `web/components/VideoPreview.tsx` | format → platform; safe area overlay |

### Silinen Dosyalar
| Dosya | Neden |
|-------|-------|
| `src/compositions/TalkingHead.tsx` | Subtitle ile değiştirilir |

---

## Task 1: platforms.ts + types.ts additions

**Files:**
- Create: `src/compositions/platforms.ts`
- Modify: `src/compositions/types.ts`
- Create: `web/__tests__/platforms.test.ts`

- [ ] **Step 1: Testi yaz**

```ts
// web/__tests__/platforms.test.ts
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
```

- [ ] **Step 2: Testi çalıştır — fail beklenir**

```bash
cd web && npx jest platforms --no-coverage
```
Beklenen: `Cannot find module '../../src/compositions/platforms'`

- [ ] **Step 3: `src/compositions/platforms.ts` oluştur**

```ts
// src/compositions/platforms.ts

export const PLATFORM_KEYS = [
  'instagram-reels',
  'instagram-story',
  'tiktok',
  'youtube-shorts',
  'facebook-reels',
  'linkedin',
  '1:1',
  '16:9',
  '9:16',
  'universal',
] as const

export type PlatformKey = typeof PLATFORM_KEYS[number]

export interface PlatformConfig {
  label: string
  w: number
  h: number
  safeTop: number
  safeBottom: number
  safeLeft: number
  safeRight: number
}

export const PLATFORMS: Record<PlatformKey, PlatformConfig> = {
  'instagram-reels': { label: 'Instagram Reels', w: 1080, h: 1920, safeTop: 250, safeBottom: 250, safeLeft: 35,  safeRight: 35  },
  'instagram-story': { label: 'Instagram Story', w: 1080, h: 1920, safeTop: 250, safeBottom: 300, safeLeft: 35,  safeRight: 35  },
  'tiktok':          { label: 'TikTok',           w: 1080, h: 1920, safeTop: 160, safeBottom: 480, safeLeft: 120, safeRight: 120 },
  'youtube-shorts':  { label: 'YouTube Shorts',   w: 1080, h: 1920, safeTop: 380, safeBottom: 380, safeLeft: 60,  safeRight: 120 },
  'facebook-reels':  { label: 'Facebook Reels',   w: 1080, h: 1920, safeTop: 250, safeBottom: 300, safeLeft: 35,  safeRight: 35  },
  'linkedin':        { label: 'LinkedIn',          w: 1080, h: 1920, safeTop: 100, safeBottom: 200, safeLeft: 40,  safeRight: 40  },
  '1:1':             { label: '1:1 Kare',          w: 1080, h: 1080, safeTop: 80,  safeBottom: 80,  safeLeft: 80,  safeRight: 80  },
  '16:9':            { label: '16:9 Yatay',        w: 1920, h: 1080, safeTop: 60,  safeBottom: 60,  safeLeft: 100, safeRight: 100 },
  '9:16':            { label: '9:16 Genel',        w: 1080, h: 1920, safeTop: 260, safeBottom: 260, safeLeft: 90,  safeRight: 90  },
  'universal':       { label: 'Evrensel',          w: 1080, h: 1920, safeTop: 260, safeBottom: 260, safeLeft: 90,  safeRight: 90  },
}

export const FONTS = [
  'sans-serif',
  'Inter',
  'Poppins',
  'Roboto',
  'Montserrat',
  'Oswald',
  'Noto Sans',
]
```

- [ ] **Step 4: `src/compositions/types.ts` güncelle — SubtitleEntry, WordSegment, SubtitleSplitMode ekle**

Dosyanın sonuna ekle:

```ts
export interface SubtitleEntry {
  startMs: number
  endMs: number
  text: string
}

export interface WordSegment {
  word: string
  startMs: number
  endMs: number
}

export type SubtitleSplitMode = 'sentence' | 'word' | 'chunk'
```

- [ ] **Step 5: Testi çalıştır — pass beklenir**

```bash
cd web && npx jest platforms --no-coverage
```
Beklenen: `PASS web/__tests__/platforms.test.ts`

- [ ] **Step 6: Commit**

```bash
git add src/compositions/platforms.ts src/compositions/types.ts web/__tests__/platforms.test.ts
git commit -m "feat: add platforms.ts with safe areas, FONTS; SubtitleEntry/WordSegment types"
```

---

## Task 2: srt.ts utility + testler

**Files:**
- Create: `web/lib/srt.ts`
- Create: `web/__tests__/srt.test.ts`

- [ ] **Step 1: Testi yaz**

```ts
// web/__tests__/srt.test.ts
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
```

- [ ] **Step 2: Testi çalıştır — fail beklenir**

```bash
cd web && npx jest srt --no-coverage
```
Beklenen: `Cannot find module '../lib/srt'`

- [ ] **Step 3: `web/lib/srt.ts` oluştur**

```ts
// web/lib/srt.ts
import type { SubtitleEntry } from '../../src/compositions/types'

function srtTimeToMs(t: string): number {
  const [hms, ms] = t.split(',')
  const [h, m, s] = hms.split(':').map(Number)
  return h * 3_600_000 + m * 60_000 + s * 1_000 + Number(ms)
}

function msToSrtTime(ms: number): string {
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1_000)
  const millis = ms % 1_000
  return `${pad2(h)}:${pad2(m)}:${pad2(s)},${pad3(millis)}`
}

function pad2(n: number): string { return String(n).padStart(2, '0') }
function pad3(n: number): string { return String(n).padStart(3, '0') }

export function parseSrt(srt: string): SubtitleEntry[] {
  const blocks = srt.trim().split(/\n\s*\n/)
  return blocks.flatMap(block => {
    const lines = block.trim().split('\n')
    if (lines.length < 3) return []
    const match = lines[1].match(
      /(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/
    )
    if (!match) return []
    const text = lines.slice(2).join('\n').trim()
    return [{ startMs: srtTimeToMs(match[1]), endMs: srtTimeToMs(match[2]), text }]
  })
}

export function exportSrt(subtitles: SubtitleEntry[]): string {
  return subtitles
    .map((s, i) =>
      `${i + 1}\n${msToSrtTime(s.startMs)} --> ${msToSrtTime(s.endMs)}\n${s.text}\n`
    )
    .join('\n')
}
```

- [ ] **Step 4: Testi çalıştır — pass beklenir**

```bash
cd web && npx jest srt --no-coverage
```
Beklenen: `PASS web/__tests__/srt.test.ts`

- [ ] **Step 5: Commit**

```bash
git add web/lib/srt.ts web/__tests__/srt.test.ts
git commit -m "feat: add srt.ts utility (parseSrt, exportSrt) with tests"
```

---

## Task 3: subtitle-split.ts utility + testler

**Files:**
- Create: `web/lib/subtitle-split.ts`
- Create: `web/__tests__/subtitle-split.test.ts`

- [ ] **Step 1: Testi yaz**

```ts
// web/__tests__/subtitle-split.test.ts
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
```

- [ ] **Step 2: Testi çalıştır — fail beklenir**

```bash
cd web && npx jest subtitle-split --no-coverage
```
Beklenen: `Cannot find module '../lib/subtitle-split'`

- [ ] **Step 3: `web/lib/subtitle-split.ts` oluştur**

```ts
// web/lib/subtitle-split.ts
import type { WordSegment, SubtitleEntry, SubtitleSplitMode } from '../../src/compositions/types'

const SENTENCE_END = /[.!?…]$/

export function splitToSubtitles(
  segments: WordSegment[],
  mode: SubtitleSplitMode,
  chunkSize: number
): SubtitleEntry[] {
  if (segments.length === 0) return []

  if (mode === 'word') {
    return segments.map(w => ({ startMs: w.startMs, endMs: w.endMs, text: w.word }))
  }

  if (mode === 'chunk') {
    const result: SubtitleEntry[] = []
    for (let i = 0; i < segments.length; i += chunkSize) {
      const chunk = segments.slice(i, i + chunkSize)
      result.push({
        startMs: chunk[0].startMs,
        endMs: chunk[chunk.length - 1].endMs,
        text: chunk.map(w => w.word).join(' '),
      })
    }
    return result
  }

  // sentence mode
  const result: SubtitleEntry[] = []
  let current: WordSegment[] = []

  for (const seg of segments) {
    current.push(seg)
    if (SENTENCE_END.test(seg.word)) {
      result.push({
        startMs: current[0].startMs,
        endMs: current[current.length - 1].endMs,
        text: current.map(w => w.word).join(' '),
      })
      current = []
    }
  }

  if (current.length > 0) {
    result.push({
      startMs: current[0].startMs,
      endMs: current[current.length - 1].endMs,
      text: current.map(w => w.word).join(' '),
    })
  }

  return result
}
```

- [ ] **Step 4: Testi çalıştır — pass beklenir**

```bash
cd web && npx jest subtitle-split --no-coverage
```
Beklenen: `PASS web/__tests__/subtitle-split.test.ts`

- [ ] **Step 5: Commit**

```bash
git add web/lib/subtitle-split.ts web/__tests__/subtitle-split.test.ts
git commit -m "feat: add subtitle-split.ts utility (sentence/word/chunk modes) with tests"
```

---

## Task 4: templates.ts — format → platform migrasyonu

**Files:**
- Modify: `web/lib/templates.ts`
- Create: `web/__tests__/templates.test.ts`

- [ ] **Step 1: Testi yaz**

```ts
// web/__tests__/templates.test.ts
import { buildRenderProps } from '../lib/templates'

describe('buildRenderProps', () => {
  it('uses platform dimensions for 9:16', () => {
    const result = buildRenderProps('ProductAd', {}, '9:16')
    expect(result.width).toBe(1080)
    expect(result.height).toBe(1920)
  })

  it('uses platform dimensions for 1:1', () => {
    const result = buildRenderProps('ProductAd', {}, '1:1')
    expect(result.width).toBe(1080)
    expect(result.height).toBe(1080)
  })

  it('uses platform dimensions for 16:9', () => {
    const result = buildRenderProps('ProductAd', {}, '16:9')
    expect(result.width).toBe(1920)
    expect(result.height).toBe(1080)
  })

  it('uses platform dimensions for tiktok', () => {
    const result = buildRenderProps('ProductAd', {}, 'tiktok')
    expect(result.width).toBe(1080)
    expect(result.height).toBe(1920)
  })

  it('falls back to template defaultPlatform when platform not provided', () => {
    const result = buildRenderProps('ProductAd', {})
    expect(result.width).toBe(1080)
    expect(result.height).toBe(1920)
  })

  it('merges overrides with defaultProps', () => {
    const result = buildRenderProps('ProductAd', { title: 'Test Title' }, '9:16')
    expect(result.title).toBe('Test Title')
  })

  it('calculates durationInFrames from durationSeconds', () => {
    const result = buildRenderProps('ProductAd', {}, '9:16', 20)
    expect(result.durationInFrames).toBe(20 * 30)
    expect(result.fps).toBe(30)
  })
})
```

- [ ] **Step 2: Testi çalıştır — fail beklenir**

```bash
cd web && npx jest templates --no-coverage
```
Beklenen: `platform is not a function` veya `defaultFormat is not a property` hatası

- [ ] **Step 3: `web/lib/templates.ts` güncelle**

`web/lib/templates.ts` dosyasını aşağıdaki içerikle tamamen değiştir:

```ts
import { PLATFORMS, PLATFORM_KEYS, PlatformKey } from '../../src/compositions/platforms'

export interface TemplateRenderMeta {
  width: number
  height: number
  durationInFrames: number
  fps: number
}

export interface Template {
  id: string
  label: string
  description: string
  gradient: string
  defaultDurationSeconds: number
  defaultPlatform: PlatformKey
  defaultProps: Record<string, unknown>
}

export const TEMPLATES: Template[] = [
  {
    id: 'ProductAd',
    label: 'Ürün Reklamı',
    description: 'Animasyonlu başlık, özellikler ve CTA',
    gradient: 'from-indigo-600 to-purple-600',
    defaultDurationSeconds: 30,
    defaultPlatform: '9:16',
    defaultProps: {
      platform: '9:16',
      title: 'Your morning deserves better',
      showTitle: true,
      titleStartSec: 0,
      titleDurationSec: 10,
      titleEntryAnim: 'fade',
      titleExitAnim: 'fade-out',
      body: [
        { text: 'Single Origin Beans', slot: 1, startSec: 5, durationSec: 8, entryAnim: 'slide-up', exitAnim: 'fade-out' },
        { text: 'Roasted Fresh Weekly', slot: 2, startSec: 8, durationSec: 8, entryAnim: 'slide-up', exitAnim: 'fade-out' },
        { text: 'Shipped to Your Door', slot: 3, startSec: 11, durationSec: 8, entryAnim: 'slide-up', exitAnim: 'fade-out' },
      ],
      showBody: true,
      cta: 'mountainbrew.co',
      showCta: true,
      ctaMode: 'text',
      ctaStartSec: 20,
      ctaDurationSec: 8,
      ctaEntryAnim: 'slide-up',
      ctaExitAnim: 'fade-out',
      ctaBgColor: '#e67e22',
      ctaOpacity: 100,
      ctaLogoUrl: '',
      ctaLogoHeight: 80,
      accentColor: '#e67e22',
      accentOpacity: 100,
      backgroundColor: '#1a1a2e',
      fontFamily: 'sans-serif',
      backgroundMedia: '',
      titleFontSize: 72,
      bodyFontSize: 36,
    },
  },
  {
    id: 'Stats',
    label: 'İstatistik',
    description: 'Count-up animasyonlu sayısal veriler',
    gradient: 'from-blue-500 to-cyan-500',
    defaultDurationSeconds: 20,
    defaultPlatform: '9:16',
    defaultProps: {
      platform: '9:16',
      stats: [
        { value: '47%', label: 'Dönüşüm artışı' },
        { value: '2.3x', label: 'Reklam getirisi' },
        { value: '150+', label: 'Müşteri' },
        { value: '$1.2M', label: 'Gelir' },
      ],
      countUp: true,
      accentColor: '#3b82f6',
      backgroundColor: '#0f0f0f',
      fontFamily: 'sans-serif',
      backgroundMedia: '',
      bodyFontSize: 36,
      animationType: 'fade',
    },
  },
  {
    id: 'Subtitle',
    label: 'Altyazı',
    description: 'Whisper altyazı, SRT import/export, platform safe area',
    gradient: 'from-emerald-500 to-teal-500',
    defaultDurationSeconds: 30,
    defaultPlatform: '9:16',
    defaultProps: {
      platform: '9:16',
      backgroundMedia: '',
      subtitles: [
        { startMs: 0, endMs: 3000, text: 'Merhaba!' },
        { startMs: 3000, endMs: 6000, text: 'Bu bir örnek altyazı.' },
      ],
      splitMode: 'sentence',
      chunkSize: 5,
      subtitlePosition: 'bottom',
      subtitleFontSize: 52,
      subtitleFontFamily: 'Poppins',
      subtitleColor: '#ffffff',
      subtitleBgColor: 'rgba(0,0,0,0.65)',
      subtitleBold: true,
      subtitleOutline: false,
      subtitleOutlineColor: '#000000',
      showLowerThird: false,
      lowerThirdText: '',
      lowerThirdColor: '#10b981',
      logoUrl: '',
      accentColor: '#10b981',
      backgroundColor: '#000000',
    },
  },
]

export function getTemplate(id: string): Template {
  const t = TEMPLATES.find((t) => t.id === id)
  if (!t) throw new Error(`Unknown template: ${id}`)
  return t
}

export function buildRenderProps(
  templateId: string,
  overrides: Record<string, unknown>,
  platform?: PlatformKey,
  durationSeconds?: number
): Record<string, unknown> & TemplateRenderMeta {
  const template = getTemplate(templateId)

  const plt = platform ?? (overrides.platform as PlatformKey) ?? template.defaultPlatform
  const { w, h } = PLATFORMS[plt] ?? PLATFORMS['9:16']
  const fps = 30
  const dur = durationSeconds ?? template.defaultDurationSeconds

  return {
    ...template.defaultProps,
    ...overrides,
    platform: plt,
    width: w,
    height: h,
    fps,
    durationInFrames: dur * fps,
  }
}
```

- [ ] **Step 4: Testi çalıştır — pass beklenir**

```bash
cd web && npx jest templates --no-coverage
```
Beklenen: `PASS web/__tests__/templates.test.ts`

- [ ] **Step 5: Commit**

```bash
git add web/lib/templates.ts web/__tests__/templates.test.ts
git commit -m "feat: migrate templates.ts from format to platform; add Subtitle template"
```

---

## Task 5: render/route.ts + page.tsx — format → platform

**Files:**
- Modify: `web/app/api/render/route.ts`
- Modify: `web/app/page.tsx`

- [ ] **Step 1: `web/app/api/render/route.ts` güncelle**

`format` referanslarını `platform` ile değiştir. Dosyanın tam içeriği:

```ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { render } from '@/lib/renderer'
import { buildRenderProps } from '@/lib/templates'
import { PLATFORM_KEYS, PlatformKey } from '../../../src/compositions/platforms'
import path from 'path'
import fs from 'fs'

function getRemotionRoot() {
  return path.resolve(process.cwd(), process.env.REMOTION_PROJECT_DIR ?? '../')
}

function resolveMediaPath(media: unknown): unknown {
  if (typeof media !== 'string' || !media) return media
  if (media.startsWith('data:') || media.startsWith('http')) return media

  let normalized = media.startsWith('/') ? media.slice(1) : media
  if (normalized.startsWith('public/')) normalized = normalized.slice('public/'.length)

  const srcPath = path.join(process.cwd(), 'public', normalized)
  if (!fs.existsSync(srcPath)) return media

  const remotionPublicUploads = path.join(getRemotionRoot(), 'public', 'uploads')
  fs.mkdirSync(remotionPublicUploads, { recursive: true })

  const filename = path.basename(srcPath)
  const destPath = path.join(remotionPublicUploads, filename)
  fs.copyFileSync(srcPath, destPath)

  return `uploads/${filename}`
}

function toPlatformKey(v: unknown): PlatformKey {
  return (PLATFORM_KEYS as readonly string[]).includes(v as string)
    ? (v as PlatformKey)
    : '9:16'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      templateId: string
      overrides: Record<string, unknown>
      platform?: string
      durationSeconds?: number
    }

    const { templateId, overrides, platform, durationSeconds } = body

    if (!templateId) {
      return NextResponse.json({ error: 'templateId gerekli' }, { status: 400 })
    }

    const resolvedOverrides = {
      ...overrides,
      backgroundMedia: resolveMediaPath(overrides?.backgroundMedia),
      ctaLogoUrl: resolveMediaPath(overrides?.ctaLogoUrl),
    }

    const props = buildRenderProps(templateId, resolvedOverrides, toPlatformKey(platform), durationSeconds)
    const outputPath = await render({ compositionId: templateId, props })
    const id = path.basename(outputPath, '.mp4')

    return NextResponse.json({ id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Render hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: `web/app/page.tsx` güncelle**

`format` ile ilgili satırları `platform` ile değiştir. Değişen satırlar:

```ts
// Satır 10-14: sil ve şununla değiştir:
import { PLATFORM_KEYS, PlatformKey } from '../../src/compositions/platforms'
function toPlatformKey(v: unknown): PlatformKey {
  return (PLATFORM_KEYS as readonly string[]).includes(v as string) ? (v as PlatformKey) : '9:16'
}

// handleRender içinde satır 44: değiştir
format: toVideoFormat(params.format),
// → şuna:
platform: toPlatformKey(params.platform),

// satır 88: değiştir
format={toVideoFormat(params.format)}
// → şuna:
platform={toPlatformKey(params.platform)}
```

Tam güncellenen `page.tsx`:

```ts
'use client'

import { useState } from 'react'
import { TopNav, TabId } from '@/components/TopNav'
import { TemplateGrid } from '@/components/TemplateGrid'
import { ParamForm } from '@/components/ParamForm'
import { VideoPreview } from '@/components/VideoPreview'
import { getTemplate } from '@/lib/templates'
import { PLATFORM_KEYS, PlatformKey } from '../../src/compositions/platforms'

function toPlatformKey(v: unknown): PlatformKey {
  return (PLATFORM_KEYS as readonly string[]).includes(v as string) ? (v as PlatformKey) : '9:16'
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('create')
  const [selectedTemplate, setSelectedTemplate] = useState('ProductAd')
  const [params, setParams] = useState<Record<string, unknown>>(
    getTemplate('ProductAd').defaultProps
  )
  const [loading, setLoading] = useState(false)
  const [renderId, setRenderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplate(id)
    setParams(getTemplate(id).defaultProps)
    setRenderId(null)
    setError(null)
  }

  const handleRender = async () => {
    setLoading(true)
    setError(null)
    setRenderId(null)
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          overrides: params,
          platform: toPlatformKey(params.platform),
          durationSeconds: Number(params.durationSeconds ?? 30),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Render hatası')
      setRenderId(data.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata')
    } finally {
      setLoading(false)
    }
  }

  if (activeTab === 'library') {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-400">Kütüphane yakında...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <TemplateGrid selectedId={selectedTemplate} onSelect={handleTemplateSelect} />
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 overflow-y-auto max-h-[80vh]">
            <ParamForm
              templateId={selectedTemplate}
              values={params}
              onChange={setParams}
              onSubmit={handleRender}
              loading={loading}
            />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-center min-h-[400px]">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <VideoPreview
              renderId={renderId}
              loading={loading}
              accentColor={String(params.accentColor ?? '#6366f1')}
              platform={toPlatformKey(params.platform)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript derleme kontrol**

```bash
cd web && npx tsc --noEmit
```
Beklenen: 0 hata

- [ ] **Step 4: Commit**

```bash
git add web/app/api/render/route.ts web/app/page.tsx
git commit -m "feat: migrate render route and page from format to platform"
```

---

## Task 6: ParamForm.tsx — platform dropdown + FONTS import

**Files:**
- Modify: `web/components/ParamForm.tsx`

- [ ] **Step 1: FONTS sabitini ve format satırlarını güncelle**

`ParamForm.tsx` içindeki değişiklikler:

Dosyanın başına import ekle:
```ts
import { PLATFORMS, PLATFORM_KEYS, FONTS } from '../../src/compositions/platforms'
```

Dosyanın başındaki iki satırı sil/güncelle:
```ts
// SİL:
const FONTS = ['sans-serif', 'Inter', 'Poppins', 'Roboto']
const FORMATS = ['1080x1920', '1920x1080']
```

`CommonFields` bileşenindeki format dropdown'ını platform dropdown'ı ile değiştir:

```tsx
// ESKİ (satır ~411-413):
<div>
  <label className="block text-xs text-gray-500 mb-1 font-medium">Format</label>
  <select className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" value={String(values.format ?? '1080x1920')} onChange={e => update('format', e.target.value)}>
    {FORMATS.map(f => <option key={f} value={f}>{f === '1080x1920' ? '1080×1920 (Dikey)' : '1920×1080 (Yatay)'}</option>)}
  </select>
</div>

// YENİ:
<div>
  <label className="block text-xs text-gray-500 mb-1 font-medium">Platform</label>
  <select className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" value={String(values.platform ?? '9:16')} onChange={e => update('platform', e.target.value)}>
    {PLATFORM_KEYS.map(k => <option key={k} value={k}>{PLATFORMS[k].label}</option>)}
  </select>
</div>
```

`TalkingHeadForm` referansını sil (şablonun tüm bölümü), `SubtitleForm` Task 13'te eklenecek.

`ParamForm` bileşenindeki TalkingHead conditional'ını güncelle:
```tsx
// ESKİ:
{templateId === 'TalkingHead' && <TalkingHeadForm values={values} update={update} />}

// YENİ:
{templateId === 'Subtitle' && <SubtitleForm values={values} update={update} />}
```

`SubtitleForm` şimdilik bir yer tutucu olarak ekle — Task 13'te doldurulacak:
```tsx
function SubtitleForm({ values, update }: FormSectionProps) {
  return <div className="text-xs text-gray-400 py-2">Altyazı formu Task 13'te eklenecek.</div>
}
```

- [ ] **Step 2: TypeScript derleme kontrol**

```bash
cd web && npx tsc --noEmit
```
Beklenen: 0 hata

- [ ] **Step 3: Commit**

```bash
git add web/components/ParamForm.tsx
git commit -m "feat: replace format dropdown with platform in ParamForm; import FONTS from platforms"
```

---

## Task 7: VideoPreview.tsx — platform prop + safe area overlay

**Files:**
- Modify: `web/components/VideoPreview.tsx`

- [ ] **Step 1: VideoPreview.tsx'i tamamen yeniden yaz**

```tsx
'use client'

import { PLATFORMS, PlatformKey } from '../../src/compositions/platforms'

interface VideoPreviewProps {
  renderId: string | null
  loading: boolean
  accentColor: string
  platform?: PlatformKey
}

const PREVIEW_BASE = 250

export function VideoPreview({ renderId, loading, accentColor, platform = '9:16' }: VideoPreviewProps) {
  const { w, h, safeTop, safeBottom, safeLeft, safeRight } = PLATFORMS[platform]

  const isPortrait = h >= w
  const mockupW = isPortrait ? PREVIEW_BASE : Math.round(PREVIEW_BASE * w / h)
  const mockupH = isPortrait ? Math.round(PREVIEW_BASE * h / w) : PREVIEW_BASE

  const scaleX = mockupW / w
  const scaleY = mockupH / h

  const safeOverlay: React.CSSProperties = {
    position: 'absolute',
    top:    safeTop    * scaleY,
    left:   safeLeft   * scaleX,
    right:  safeRight  * scaleX,
    bottom: safeBottom * scaleY,
    border: '1px dashed rgba(255, 100, 100, 0.7)',
    borderRadius: 2,
    pointerEvents: 'none',
    zIndex: 10,
  }

  const mockupStyle: React.CSSProperties = {
    width: mockupW,
    height: mockupH,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  }

  const videoMaxStyle: React.CSSProperties = isPortrait
    ? { maxHeight: mockupH, borderRadius: 12 }
    : { maxWidth: mockupW, borderRadius: 12 }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-full">
        <div style={mockupStyle} className="flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
        </div>
        <p className="text-xs text-gray-400">Render ediliyor...</p>
      </div>
    )
  }

  if (renderId) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 h-full">
        <video
          src={`/api/download/${renderId}`}
          controls
          style={{ ...videoMaxStyle, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
        />
        <a
          href={`/api/download/${renderId}`}
          download={`video-${renderId}.mp4`}
          className="bg-white border-2 border-gray-200 text-gray-700 text-xs px-4 py-2 rounded-lg font-semibold hover:border-gray-400 transition-colors"
        >
          ⬇ MP4 İndir
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 h-full">
      <p className="text-xs text-gray-400">Önizleme — Safe Area</p>
      <div style={mockupStyle}>
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-2"
          style={{ position: 'absolute', inset: 0 }}
        >
          <div className="text-sm font-black text-white text-center px-3 leading-tight">
            Video çıktısı
          </div>
          <div className="text-sm font-bold" style={{ color: accentColor }}>
            burada görünür
          </div>
        </div>
        {/* Safe area overlay */}
        <div style={safeOverlay} />
      </div>
      <p className="text-xs text-gray-400" style={{ color: 'rgba(255,100,100,0.8)' }}>
        — safe zone
      </p>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript derleme kontrol**

```bash
cd web && npx tsc --noEmit
```
Beklenen: 0 hata

- [ ] **Step 3: Commit**

```bash
git add web/components/VideoPreview.tsx
git commit -m "feat: VideoPreview platform-aware with safe area overlay"
```

---

## Task 8: Subtitle.tsx composition

**Files:**
- Create: `src/compositions/Subtitle.tsx`

- [ ] **Step 1: `src/compositions/Subtitle.tsx` oluştur**

```tsx
import React from 'react'
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Img,
  Video,
  staticFile,
} from 'remotion'
import { z } from 'zod'
import { PLATFORM_KEYS, PLATFORMS } from './platforms'

const subtitleEntrySchema = z.object({
  startMs: z.number(),
  endMs: z.number(),
  text: z.string(),
})

export const subtitleSchema = z.object({
  platform: z.enum(PLATFORM_KEYS as [string, ...string[]]).default('9:16'),
  backgroundMedia: z.string().default(''),
  subtitles: z.array(subtitleEntrySchema).default([]),
  splitMode: z.enum(['sentence', 'word', 'chunk']).default('sentence'),
  chunkSize: z.number().min(1).max(20).default(5),
  subtitlePosition: z.enum(['bottom', 'top', 'middle']).default('bottom'),
  subtitleFontSize: z.number().min(24).max(120).default(52),
  subtitleFontFamily: z.string().default('Poppins'),
  subtitleColor: z.string().default('#ffffff'),
  subtitleBgColor: z.string().default('rgba(0,0,0,0.65)'),
  subtitleBold: z.boolean().default(true),
  subtitleOutline: z.boolean().default(false),
  subtitleOutlineColor: z.string().default('#000000'),
  showLowerThird: z.boolean().default(false),
  lowerThirdText: z.string().default(''),
  lowerThirdColor: z.string().default('#10b981'),
  logoUrl: z.string().default(''),
  accentColor: z.string().default('#10b981'),
  backgroundColor: z.string().default('#000000'),
})

export type SubtitleProps = z.infer<typeof subtitleSchema>

function mediaUrl(src: string): string {
  return /^(https?:|data:)/.test(src) ? src : staticFile(src)
}

export const Subtitle: React.FC<SubtitleProps> = (props) => {
  const frame = useCurrentFrame()
  const { fps, height } = useVideoConfig()
  const currentMs = (frame / fps) * 1000

  const platform = PLATFORMS[props.platform as keyof typeof PLATFORMS] ?? PLATFORMS['9:16']

  const activeSubtitle = props.subtitles.find(
    s => currentMs >= s.startMs && currentMs < s.endMs
  )

  const getPositionStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      left: platform.safeLeft,
      right: platform.safeRight,
      textAlign: 'center',
      zIndex: 10,
    }
    if (props.subtitlePosition === 'top') {
      return { ...base, top: platform.safeTop + 20 }
    }
    if (props.subtitlePosition === 'middle') {
      const safeH = height - platform.safeTop - platform.safeBottom
      return { ...base, top: platform.safeTop + safeH / 2 - props.subtitleFontSize }
    }
    // bottom (default)
    return { ...base, bottom: platform.safeBottom + 20 }
  }

  const textStyle: React.CSSProperties = {
    fontSize: props.subtitleFontSize,
    fontFamily: props.subtitleFontFamily,
    color: props.subtitleColor,
    fontWeight: props.subtitleBold ? 700 : 400,
    lineHeight: 1.3,
    padding: activeSubtitle ? '12px 24px' : 0,
    borderRadius: 8,
    backgroundColor: activeSubtitle ? props.subtitleBgColor : 'transparent',
    WebkitTextStroke: props.subtitleOutline ? `2px ${props.subtitleOutlineColor}` : undefined,
    display: 'inline-block',
    maxWidth: '100%',
    wordBreak: 'break-word',
  }

  return (
    <AbsoluteFill
      style={{ backgroundColor: props.backgroundColor, fontFamily: props.subtitleFontFamily }}
    >
      {/* Background media */}
      {props.backgroundMedia && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          {/\.(mp4|webm|mov)$/i.test(props.backgroundMedia) ? (
            <Video
              src={mediaUrl(props.backgroundMedia)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Img
              src={mediaUrl(props.backgroundMedia)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>
      )}

      {/* Logo */}
      {props.logoUrl && (
        <div
          style={{
            position: 'absolute',
            top: platform.safeTop + 16,
            right: platform.safeRight + 16,
            zIndex: 2,
          }}
        >
          <Img src={props.logoUrl} style={{ height: 48, objectFit: 'contain' }} />
        </div>
      )}

      {/* Lower third */}
      {props.showLowerThird && props.lowerThirdText && (
        <div
          style={{
            position: 'absolute',
            bottom: platform.safeBottom + props.subtitleFontSize * 1.8 + 40,
            left: 0,
            right: 0,
            padding: `12px ${platform.safeLeft + 16}px`,
            backgroundColor: props.lowerThirdColor,
            zIndex: 3,
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>
            {props.lowerThirdText}
          </div>
        </div>
      )}

      {/* Subtitle */}
      <div style={getPositionStyle()}>
        <span style={textStyle}>{activeSubtitle?.text ?? ''}</span>
      </div>
    </AbsoluteFill>
  )
}
```

- [ ] **Step 2: TypeScript derleme kontrol (root)**

```bash
npx tsc --noEmit
```
Beklenen: 0 hata

- [ ] **Step 3: Commit**

```bash
git add src/compositions/Subtitle.tsx
git commit -m "feat: add Subtitle composition with platform safe area positioning"
```

---

## Task 9: Root.tsx güncelle + TalkingHead sil

**Files:**
- Modify: `src/Root.tsx`
- Delete: `src/compositions/TalkingHead.tsx`

- [ ] **Step 1: `src/Root.tsx` güncelle**

TalkingHead import'unu kaldır, Subtitle import'unu ekle. `calculateMetadata`'da platform'dan width/height türet.

```tsx
import React from 'react'
import { Composition } from 'remotion'
import { HelloWorld } from './compositions/HelloWorld'
import { ProductAd, ProductAdProps } from './compositions/ProductAd'
import { Stats, StatsProps } from './compositions/Stats'
import { Subtitle, SubtitleProps } from './compositions/Subtitle'
import { PLATFORMS } from './compositions/platforms'

const productAdDefaults: ProductAdProps = {
  // (mevcut değerler aynen kalır, sadece platform eklenir)
  platform: '9:16',
  title: 'Your morning deserves better',
  showTitle: true,
  titleStartSec: 0,
  titleDurationSec: 10,
  titleEntryAnim: 'fade',
  titleExitAnim: 'fade-out',
  body: [
    { text: 'Single Origin Beans', slot: 1, startSec: 5, durationSec: 8, entryAnim: 'slide-up', exitAnim: 'fade-out' },
    { text: 'Roasted Fresh Weekly', slot: 2, startSec: 8, durationSec: 8, entryAnim: 'slide-up', exitAnim: 'fade-out' },
    { text: 'Shipped to Your Door', slot: 3, startSec: 11, durationSec: 8, entryAnim: 'slide-up', exitAnim: 'fade-out' },
  ],
  showBody: true,
  cta: 'mountainbrew.co',
  showCta: true,
  ctaMode: 'text',
  ctaStartSec: 20,
  ctaDurationSec: 8,
  ctaEntryAnim: 'slide-up',
  ctaExitAnim: 'fade-out',
  ctaBgColor: '#e67e22',
  ctaOpacity: 100,
  ctaLogoUrl: '',
  ctaLogoHeight: 80,
  accentColor: '#e67e22',
  accentOpacity: 100,
  backgroundColor: '#1a1a2e',
  fontFamily: 'sans-serif',
  backgroundMedia: '',
  titleFontSize: 72,
  bodyFontSize: 36,
} as unknown as ProductAdProps

const statsDefaults: StatsProps = {
  platform: '9:16',
  stats: [
    { value: '47%', label: 'Increase in Engagement' },
    { value: '2.3x', label: 'Return on Investment' },
    { value: '150+', label: 'Happy Clients' },
    { value: '$1.2M', label: 'Revenue Generated' },
  ],
  countUp: true,
  accentColor: '#3b82f6',
  backgroundColor: '#0f0f0f',
  fontFamily: 'sans-serif',
  backgroundMedia: '',
  bodyFontSize: 36,
  animationType: 'fade' as const,
} as unknown as StatsProps

const subtitleDefaults: SubtitleProps = {
  platform: '9:16',
  backgroundMedia: '',
  subtitles: [
    { startMs: 0, endMs: 3000, text: 'Merhaba!' },
    { startMs: 3000, endMs: 6000, text: 'Bu bir örnek altyazı.' },
  ],
  splitMode: 'sentence',
  chunkSize: 5,
  subtitlePosition: 'bottom',
  subtitleFontSize: 52,
  subtitleFontFamily: 'Poppins',
  subtitleColor: '#ffffff',
  subtitleBgColor: 'rgba(0,0,0,0.65)',
  subtitleBold: true,
  subtitleOutline: false,
  subtitleOutlineColor: '#000000',
  showLowerThird: false,
  lowerThirdText: '',
  lowerThirdColor: '#10b981',
  logoUrl: '',
  accentColor: '#10b981',
  backgroundColor: '#000000',
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ProductAd"
        component={ProductAd}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={productAdDefaults}
        calculateMetadata={({ props }) => {
          const p = PLATFORMS[(props as any).platform ?? '9:16'] ?? PLATFORMS['9:16']
          return { width: p.w, height: p.h, props }
        }}
      />
      <Composition
        id="Stats"
        component={Stats}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={statsDefaults}
        calculateMetadata={({ props }) => {
          const p = PLATFORMS[(props as any).platform ?? '9:16'] ?? PLATFORMS['9:16']
          return { width: p.w, height: p.h, props }
        }}
      />
      <Composition
        id="Subtitle"
        component={Subtitle}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={subtitleDefaults}
        calculateMetadata={({ props }) => {
          const p = PLATFORMS[(props as any).platform ?? '9:16'] ?? PLATFORMS['9:16']
          return { width: p.w, height: p.h, props }
        }}
      />
    </>
  )
}
```

- [ ] **Step 2: TalkingHead.tsx sil**

```bash
rm src/compositions/TalkingHead.tsx
```

- [ ] **Step 3: TypeScript derleme kontrol**

```bash
npx tsc --noEmit
```
Beklenen: 0 hata

- [ ] **Step 4: Remotion Studio kontrol**

```bash
npm run start
```
Remotion Studio'da `ProductAd`, `Stats`, `Subtitle` composition'ları görünmeli. `TalkingHead` olmamalı.

- [ ] **Step 5: Commit**

```bash
git add src/Root.tsx
git rm src/compositions/TalkingHead.tsx
git commit -m "feat: add Subtitle to Root.tsx; remove TalkingHead; platform-based dimensions in calculateMetadata"
```

---

## Task 10: Whisper servisi (Python)

**Files:**
- Create: `whisper_service/requirements.txt`
- Create: `whisper_service/server.py`

- [ ] **Step 1: `whisper_service/requirements.txt` oluştur**

```
faster-whisper==1.1.1
fastapi==0.115.12
uvicorn[standard]==0.34.2
python-multipart==0.0.20
```

- [ ] **Step 2: `whisper_service/server.py` oluştur**

```python
# whisper_service/server.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Literal
import os

from faster_whisper import WhisperModel

app = FastAPI()

# Model cache — ilk istekte yüklenir
_models: dict = {}

def get_model(language: str) -> WhisperModel:
    """TR için fine-tuned model, diğerleri için large-v3."""
    model_key = "tr" if language == "tr" else "en"
    if model_key not in _models:
        if language == "tr":
            # Türkçe fine-tuned model (HuggingFace'den ilk çalıştırmada indirilir)
            model_id = "selimc/whisper-large-v3-turbo-turkish"
        else:
            model_id = "large-v3"
        # CPU kullanımı; GPU varsa device="cuda" yap
        _models[model_key] = WhisperModel(model_id, device="cpu", compute_type="int8")
    return _models[model_key]


class TranscribeRequest(BaseModel):
    media_path: str
    language: Literal["tr", "en"] = "tr"
    split_mode: Literal["sentence", "word", "chunk"] = "sentence"
    chunk_size: int = 5


class WordSegment(BaseModel):
    word: str
    startMs: int
    endMs: int


class SubtitleEntry(BaseModel):
    startMs: int
    endMs: int
    text: str


class TranscribeResponse(BaseModel):
    segments: list[WordSegment]
    subtitles: list[SubtitleEntry]


SENTENCE_END = {".", "!", "?", "…"}


def split_to_subtitles(
    words: list[WordSegment], mode: str, chunk_size: int
) -> list[SubtitleEntry]:
    if not words:
        return []

    if mode == "word":
        return [SubtitleEntry(startMs=w.startMs, endMs=w.endMs, text=w.word) for w in words]

    if mode == "chunk":
        result = []
        for i in range(0, len(words), chunk_size):
            chunk = words[i : i + chunk_size]
            result.append(SubtitleEntry(
                startMs=chunk[0].startMs,
                endMs=chunk[-1].endMs,
                text=" ".join(w.word for w in chunk),
            ))
        return result

    # sentence mode
    result = []
    current: list[WordSegment] = []
    for w in words:
        current.append(w)
        if w.word and w.word[-1] in SENTENCE_END:
            result.append(SubtitleEntry(
                startMs=current[0].startMs,
                endMs=current[-1].endMs,
                text=" ".join(c.word for c in current),
            ))
            current = []
    if current:
        result.append(SubtitleEntry(
            startMs=current[0].startMs,
            endMs=current[-1].endMs,
            text=" ".join(c.word for c in current),
        ))
    return result


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/transcribe", response_model=TranscribeResponse)
def transcribe(req: TranscribeRequest):
    if not os.path.exists(req.media_path):
        raise HTTPException(status_code=400, detail=f"Dosya bulunamadı: {req.media_path}")

    model = get_model(req.language)

    segments_iter, _ = model.transcribe(
        req.media_path,
        language=req.language,
        word_timestamps=True,
    )

    word_segments: list[WordSegment] = []
    for seg in segments_iter:
        if seg.words:
            for w in seg.words:
                word_segments.append(WordSegment(
                    word=w.word.strip(),
                    startMs=int(w.start * 1000),
                    endMs=int(w.end * 1000),
                ))

    subtitles = split_to_subtitles(word_segments, req.split_mode, req.chunk_size)

    return TranscribeResponse(segments=word_segments, subtitles=subtitles)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8765)
```

- [ ] **Step 3: Python ortamı kur ve servisi test et**

```bash
cd whisper_service
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

Ayrı terminal'de health check:
```bash
curl http://localhost:8765/health
```
Beklenen: `{"status":"ok"}`

- [ ] **Step 4: Commit**

```bash
git add whisper_service/
git commit -m "feat: add Whisper FastAPI service (port 8765) with TR fine-tuned model support"
```

---

## Task 11: /api/transcribe route

**Files:**
- Create: `web/app/api/transcribe/route.ts`

- [ ] **Step 1: `web/app/api/transcribe/route.ts` oluştur**

```ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { splitToSubtitles } from '@/lib/subtitle-split'
import type { SubtitleSplitMode } from '../../../src/compositions/types'
import path from 'path'
import fs from 'fs'
import os from 'os'

const WHISPER_URL = process.env.WHISPER_SERVICE_URL ?? 'http://localhost:8765'

function resolveLocalPath(mediaUrl: string): string | null {
  // uploads/filename.ext → web/public/uploads/filename.ext
  if (mediaUrl.startsWith('uploads/') || mediaUrl.startsWith('/uploads/')) {
    const filename = path.basename(mediaUrl)
    return path.join(process.cwd(), 'public', 'uploads', filename)
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      mediaUrl: string
      language?: 'tr' | 'en'
      splitMode?: SubtitleSplitMode
      chunkSize?: number
    }

    const { mediaUrl, language = 'tr', splitMode = 'sentence', chunkSize = 5 } = body

    if (!mediaUrl) {
      return NextResponse.json({ error: 'mediaUrl gerekli' }, { status: 400 })
    }

    // Resolve local path
    const localPath = resolveLocalPath(mediaUrl)
    if (!localPath || !fs.existsSync(localPath)) {
      return NextResponse.json({ error: 'Medya dosyası bulunamadı' }, { status: 400 })
    }

    // Call Whisper service
    let whisperRes: Response
    try {
      whisperRes = await fetch(`${WHISPER_URL}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_path: localPath,
          language,
          split_mode: splitMode,
          chunk_size: chunkSize,
        }),
      })
    } catch {
      return NextResponse.json(
        { error: 'Whisper servisi çalışmıyor. whisper_service/server.py başlatın.' },
        { status: 503 }
      )
    }

    if (!whisperRes.ok) {
      const detail = await whisperRes.text()
      return NextResponse.json({ error: `Whisper hatası: ${detail}` }, { status: 500 })
    }

    const data = await whisperRes.json()
    return NextResponse.json({ subtitles: data.subtitles, segments: data.segments })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transkripsiyon hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: TypeScript derleme kontrol**

```bash
cd web && npx tsc --noEmit
```
Beklenen: 0 hata

- [ ] **Step 3: Commit**

```bash
git add web/app/api/transcribe/route.ts
git commit -m "feat: add /api/transcribe route (Whisper proxy)"
```

---

## Task 12: /api/srt-parse + /api/srt-export routes

**Files:**
- Create: `web/app/api/srt-parse/route.ts`
- Create: `web/app/api/srt-export/route.ts`

- [ ] **Step 1: `web/app/api/srt-parse/route.ts` oluştur**

```ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { parseSrt } from '@/lib/srt'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'SRT dosyası gerekli' }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.srt')) {
      return NextResponse.json({ error: 'Sadece .srt dosyaları kabul edilir' }, { status: 400 })
    }

    const text = await file.text()
    const subtitles = parseSrt(text)

    if (subtitles.length === 0) {
      return NextResponse.json({ error: 'SRT dosyası boş veya geçersiz format' }, { status: 400 })
    }

    return NextResponse.json({ subtitles })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'SRT parse hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: `web/app/api/srt-export/route.ts` oluştur**

```ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { exportSrt } from '@/lib/srt'
import type { SubtitleEntry } from '../../../src/compositions/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { subtitles: SubtitleEntry[] }

    if (!Array.isArray(body.subtitles) || body.subtitles.length === 0) {
      return NextResponse.json({ error: 'Altyazı listesi boş' }, { status: 400 })
    }

    const srtContent = exportSrt(body.subtitles)

    return new NextResponse(srtContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="subtitles.srt"',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'SRT export hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 3: TypeScript derleme kontrol**

```bash
cd web && npx tsc --noEmit
```
Beklenen: 0 hata

- [ ] **Step 4: Commit**

```bash
git add web/app/api/srt-parse/route.ts web/app/api/srt-export/route.ts
git commit -m "feat: add /api/srt-parse and /api/srt-export routes"
```

---

## Task 13: ParamForm — Subtitle UI bölümü

**Files:**
- Modify: `web/components/ParamForm.tsx`

- [ ] **Step 1: `SubtitleForm` bileşenini ekle**

`ParamForm.tsx` içindeki geçici `SubtitleForm` yer tutucusunu aşağıdaki gerçek implementasyonla değiştir:

```tsx
function SubtitleForm({ values, update }: FormSectionProps) {
  const subtitles: SubtitleEntry[] = Array.isArray(values.subtitles)
    ? (values.subtitles as SubtitleEntry[])
    : []

  const [whisperStatus, setWhisperStatus] = useState<
    'idle' | 'loading' | 'done' | 'error'
  >('idle')
  const [whisperMessage, setWhisperMessage] = useState('')

  async function handleWhisper() {
    const mediaUrl = String(values.backgroundMedia ?? '')
    if (!mediaUrl) {
      setWhisperStatus('error')
      setWhisperMessage('Önce arkaplan medyası yükleyin')
      return
    }
    setWhisperStatus('loading')
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaUrl,
          language: values.subtitleLang ?? 'tr',
          splitMode: values.splitMode ?? 'sentence',
          chunkSize: Number(values.chunkSize ?? 5),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      update('subtitles', data.subtitles)
      setWhisperStatus('done')
      setWhisperMessage(`${data.subtitles.length} altyazı oluşturuldu`)
    } catch (err) {
      setWhisperStatus('error')
      setWhisperMessage(err instanceof Error ? err.message : 'Hata')
    }
  }

  async function handleSrtImport(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/srt-parse', { method: 'POST', body: formData })
    const data = await res.json()
    if (res.ok) update('subtitles', data.subtitles)
  }

  async function handleSrtExport() {
    const res = await fetch('/api/srt-export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtitles }),
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subtitles.srt'
    a.click()
    URL.revokeObjectURL(url)
  }

  function updateSubtitle(idx: number, field: keyof SubtitleEntry, val: unknown) {
    const updated = subtitles.map((s, i) =>
      i === idx ? { ...s, [field]: field === 'text' ? val : Number(val) } : s
    )
    update('subtitles', updated)
  }

  function addSubtitle() {
    const lastEnd = subtitles.length > 0 ? subtitles[subtitles.length - 1].endMs : 0
    update('subtitles', [...subtitles, { startMs: lastEnd, endMs: lastEnd + 3000, text: '' }])
  }

  function removeSubtitle(idx: number) {
    update('subtitles', subtitles.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-3">
      {/* Whisper + SRT */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        <div className="flex gap-2 items-center">
          <label className="text-xs text-gray-500 font-medium">Dil:</label>
          <label className="flex items-center gap-1 text-xs cursor-pointer">
            <input type="radio" name="subtitleLang" value="tr"
              checked={(values.subtitleLang ?? 'tr') === 'tr'}
              onChange={() => update('subtitleLang', 'tr')} />
            Türkçe
          </label>
          <label className="flex items-center gap-1 text-xs cursor-pointer">
            <input type="radio" name="subtitleLang" value="en"
              checked={values.subtitleLang === 'en'}
              onChange={() => update('subtitleLang', 'en')} />
            İngilizce
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleWhisper}
            disabled={whisperStatus === 'loading'}
            className="flex-1 text-xs bg-indigo-600 text-white rounded-md py-1.5 px-3 font-medium disabled:opacity-50 hover:bg-indigo-700 transition-colors"
          >
            {whisperStatus === 'loading' ? '⏳ Analiz ediliyor...' : '🎤 Whisper ile Oluştur'}
          </button>
          <label className="flex-1 text-xs bg-gray-200 text-gray-700 rounded-md py-1.5 px-3 font-medium cursor-pointer text-center hover:bg-gray-300 transition-colors">
            📂 SRT Yükle
            <input type="file" accept=".srt" className="hidden"
              onChange={e => e.target.files?.[0] && handleSrtImport(e.target.files[0])} />
          </label>
        </div>

        {whisperStatus === 'done' && (
          <p className="text-xs text-emerald-600 font-medium">✓ {whisperMessage}</p>
        )}
        {whisperStatus === 'error' && (
          <p className="text-xs text-red-500">⚠ {whisperMessage}</p>
        )}
      </div>

      {/* Bölümleme */}
      <div className="grid grid-cols-3 gap-2">
        {(['sentence', 'word', 'chunk'] as const).map(mode => (
          <label key={mode} className="flex items-center gap-1 text-xs cursor-pointer">
            <input type="radio" name="splitMode" value={mode}
              checked={(values.splitMode ?? 'sentence') === mode}
              onChange={() => update('splitMode', mode)} />
            {mode === 'sentence' ? 'Cümle' : mode === 'word' ? 'Kelime' : 'Chunk'}
          </label>
        ))}
      </div>

      {values.splitMode === 'chunk' && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Chunk boyutu (kelime)</label>
          <input type="number" min={1} max={20}
            value={Number(values.chunkSize ?? 5)}
            onChange={e => update('chunkSize', Number(e.target.value))}
            className="w-20 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-xs" />
        </div>
      )}

      {/* Altyazı listesi */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {subtitles.map((s, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-2 bg-white">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex gap-1 items-center">
                <input type="number" step={100}
                  value={s.startMs}
                  onChange={e => updateSubtitle(i, 'startMs', e.target.value)}
                  className="w-20 bg-gray-50 border border-gray-200 rounded px-1.5 py-1 text-xs" />
                <span className="text-xs text-gray-400">→</span>
                <input type="number" step={100}
                  value={s.endMs}
                  onChange={e => updateSubtitle(i, 'endMs', e.target.value)}
                  className="w-20 bg-gray-50 border border-gray-200 rounded px-1.5 py-1 text-xs" />
              </div>
              <button onClick={() => removeSubtitle(i)}
                className="ml-auto text-xs text-gray-400 hover:text-red-500">✕</button>
            </div>
            <input type="text"
              value={s.text}
              onChange={e => updateSubtitle(i, 'text', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs" />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={addSubtitle}
          className="flex-1 text-xs border border-dashed border-gray-300 rounded-md py-1.5 text-gray-500 hover:border-gray-400 transition-colors">
          + Altyazı Ekle
        </button>
        {subtitles.length > 0 && (
          <button onClick={handleSrtExport}
            className="text-xs bg-gray-100 text-gray-700 rounded-md py-1.5 px-3 hover:bg-gray-200 transition-colors">
            ⬇ SRT İndir
          </button>
        )}
      </div>

      {/* Görünüm */}
      <div className="border-t border-gray-100 pt-3 space-y-3">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Görünüm</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Font</label>
            <select className="w-full bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-xs"
              value={String(values.subtitleFontFamily ?? 'Poppins')}
              onChange={e => update('subtitleFontFamily', e.target.value)}>
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Font Boyutu</label>
            <input type="number" min={24} max={120}
              value={Number(values.subtitleFontSize ?? 52)}
              onChange={e => update('subtitleFontSize', Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-xs" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Metin Rengi</label>
          <ColorPicker
            value={String(values.subtitleColor ?? '#ffffff')}
            onChange={v => update('subtitleColor', v)} />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Arka Plan Rengi</label>
          <ColorPicker
            value={String(values.subtitleBgColor ?? 'rgba(0,0,0,0.65)')}
            onChange={v => update('subtitleBgColor', v)} />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Konum</label>
          <div className="flex gap-3">
            {(['bottom', 'middle', 'top'] as const).map(pos => (
              <label key={pos} className="flex items-center gap-1 text-xs cursor-pointer">
                <input type="radio" name="subtitlePosition" value={pos}
                  checked={(values.subtitlePosition ?? 'bottom') === pos}
                  onChange={() => update('subtitlePosition', pos)} />
                {pos === 'bottom' ? 'Alt' : pos === 'middle' ? 'Orta' : 'Üst'}
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input type="checkbox"
              checked={Boolean(values.subtitleBold ?? true)}
              onChange={e => update('subtitleBold', e.target.checked)} />
            Kalın
          </label>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input type="checkbox"
              checked={Boolean(values.subtitleOutline)}
              onChange={e => update('subtitleOutline', e.target.checked)} />
            Outline
          </label>
          {values.subtitleOutline && (
            <ColorPicker
              value={String(values.subtitleOutlineColor ?? '#000000')}
              onChange={v => update('subtitleOutlineColor', v)} />
          )}
        </div>
      </div>

      {/* Lower Third */}
      <AccordionSection
        title="Lower Third"
        enabled={Boolean(values.showLowerThird)}
        onToggle={v => update('showLowerThird', v)}
      >
        <div className="space-y-2">
          <input type="text"
            value={String(values.lowerThirdText ?? '')}
            onChange={e => update('lowerThirdText', e.target.value)}
            placeholder="Ad Soyad — Ünvan"
            className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" />
          <div>
            <label className="block text-xs text-gray-500 mb-1">Renk</label>
            <ColorPicker
              value={String(values.lowerThirdColor ?? '#10b981')}
              onChange={v => update('lowerThirdColor', v)} />
          </div>
        </div>
      </AccordionSection>
    </div>
  )
}
```

Dosyanın başına `SubtitleEntry` import'unu ekle:
```ts
import type { SubtitleEntry } from '../../src/compositions/types'
```

- [ ] **Step 2: TypeScript derleme kontrol**

```bash
cd web && npx tsc --noEmit
```
Beklenen: 0 hata

- [ ] **Step 3: Tüm testleri çalıştır**

```bash
cd web && npx jest --no-coverage
```
Beklenen: `PASS` platforms, templates, srt, subtitle-split testleri

- [ ] **Step 4: Commit**

```bash
git add web/components/ParamForm.tsx
git commit -m "feat: add SubtitleForm UI with Whisper button, SRT import/export, font/color/position controls"
```

---

## Self-Review

### Spec Coverage

| Spec bölümü | Task |
|-------------|------|
| PLATFORMS sabiti, tüm platformlar | Task 1 |
| format → platform migrasyonu | Task 4, 5, 6, 7 |
| Safe area overlay (VideoPreview) | Task 7 |
| SubtitleEntry, WordSegment tipleri | Task 1 |
| Subtitle composition (schema + render) | Task 8 |
| Root.tsx TalkingHead → Subtitle | Task 9 |
| Whisper local servisi (TR fine-tuned) | Task 10 |
| /api/transcribe | Task 11 |
| SRT parse utility + test | Task 2 |
| SRT export utility + test | Task 2 |
| /api/srt-parse | Task 12 |
| /api/srt-export | Task 12 |
| sentence/word/chunk bölümleme | Task 3 |
| ParamForm subtitle UI | Task 13 |
| Whisper buton durumları | Task 13 |
| Platform dropdown ilk sıraya | Task 6 |
| FONTS merkeze taşınma | Task 1, 6 |
| 1:1 format desteği | Task 1 (PLATFORMS içinde) |

### Type Consistency

- `SubtitleEntry` → `src/compositions/types.ts`'de tanımlı, `web/lib/srt.ts` ve API route'lar import ediyor ✓
- `WordSegment` → aynı dosyada tanımlı, `subtitle-split.ts` import ediyor ✓
- `PlatformKey` → `platforms.ts`'de tanımlı, `templates.ts`, `render/route.ts`, `page.tsx`, `VideoPreview.tsx` import ediyor ✓
- `splitToSubtitles` imzası Task 3 ve Task 11'de tutarlı ✓
- `parseSrt` / `exportSrt` imzaları Task 2 ve Task 12'de tutarlı ✓
