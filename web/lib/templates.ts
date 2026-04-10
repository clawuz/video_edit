export interface TemplateRenderMeta {
  width: number;
  height: number;
  durationInFrames: number;
  fps: number;
}

export interface Template {
  id: string;
  label: string;
  description: string;
  gradient: string;
  defaultDurationSeconds: number;
  defaultFormat: '1080x1920' | '1920x1080';
  defaultProps: Record<string, unknown>;
}

export const TEMPLATES: Template[] = [
  {
    id: 'ProductAd',
    label: 'Ürün Reklamı',
    description: 'Animasyonlu başlık, özellikler ve CTA',
    gradient: 'from-indigo-600 to-purple-600',
    defaultDurationSeconds: 30,
    defaultFormat: '1080x1920',
    defaultProps: {
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
    defaultFormat: '1080x1920',
    defaultProps: {
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
    id: 'TalkingHead',
    label: 'Talking Head',
    description: 'Altyazılı sunum şablonu',
    gradient: 'from-emerald-500 to-teal-500',
    defaultDurationSeconds: 30,
    defaultFormat: '1080x1920',
    defaultProps: {
      subtitles: [
        { startMs: 0, endMs: 3000, text: 'Merhaba!' },
        { startMs: 3000, endMs: 6000, text: 'Bu bir örnek.' },
      ],
      lowerThird: 'Ad Soyad — Ünvan',
      logoUrl: '',
      accentColor: '#10b981',
      backgroundColor: '#1a1a2e',
      fontFamily: 'sans-serif',
      backgroundMedia: '',
      titleFontSize: 24,
      bodyFontSize: 32,
      animationType: 'fade',
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
  format?: '1080x1920' | '1920x1080',
  durationSeconds?: number
): Record<string, unknown> & TemplateRenderMeta {
  const template = getTemplate(templateId)

  const fmt = format ?? template.defaultFormat
  const parts = fmt.split('x').map(Number)
  if (parts.length !== 2 || parts.some(isNaN)) {
    throw new Error(`Invalid format string: ${fmt}`)
  }
  const [w, h] = parts
  const fps = 30
  const dur = durationSeconds ?? template.defaultDurationSeconds

  return {
    ...template.defaultProps,
    ...overrides,
    width: w,
    height: h,
    fps,
    durationInFrames: dur * fps,
  }
}
