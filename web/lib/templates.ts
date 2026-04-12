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
  const validPlt = (PLATFORM_KEYS as readonly string[]).includes(plt) ? plt as PlatformKey : '9:16' as PlatformKey
  const { w, h } = PLATFORMS[validPlt]
  const fps = 30
  const dur = durationSeconds ?? template.defaultDurationSeconds

  return {
    ...template.defaultProps,
    ...overrides,
    platform: validPlt,
    width: w,
    height: h,
    fps,
    durationInFrames: dur * fps,
  }
}
