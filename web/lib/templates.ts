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
      features: ['Single Origin Beans', 'Roasted Fresh Weekly', 'Shipped to Your Door'],
      cta: 'mountainbrew.co',
      accentColor: '#e67e22',
      fontFamily: 'sans-serif',
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
      fontFamily: 'sans-serif',
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
      fontFamily: 'sans-serif',
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
  format?: string,
  durationSeconds?: number
): Record<string, unknown> & TemplateRenderMeta {
  const template = getTemplate(templateId)

  const fmt = format ?? template.defaultFormat
  const [w, h] = fmt.split('x').map(Number)
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
