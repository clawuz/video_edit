'use client'

const FONTS = ['sans-serif', 'Inter', 'Poppins', 'Roboto']
const ACCENT_PRESETS = ['#e67e22', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6']
const DURATIONS = [15, 30, 60]
const FORMATS = ['1080x1920', '1920x1080']

interface ParamFormProps {
  templateId: string
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
  onSubmit: () => void
  loading: boolean
}

export function ParamForm({ templateId, values, onChange, onSubmit, loading }: ParamFormProps) {
  const update = (key: string, value: unknown) => onChange({ ...values, [key]: value })

  return (
    <div className="space-y-4">
      {/* ProductAd alanları */}
      {templateId === 'ProductAd' && (
        <>
          <div>
            <label htmlFor="title" className="block text-xs text-gray-500 mb-1 font-medium">Başlık</label>
            <input
              id="title"
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              value={String(values.title ?? '')}
              onChange={(e) => update('title', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="features" className="block text-xs text-gray-500 mb-1 font-medium">Özellikler (her satır ayrı, max 4)</label>
            <textarea
              id="features"
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:ring-1 focus:ring-gray-900"
              value={(values.features as string[] ?? []).join('\n')}
              onChange={(e) => update('features', e.target.value.split('\n').slice(0, 4))}
            />
          </div>
          <div>
            <label htmlFor="cta" className="block text-xs text-gray-500 mb-1 font-medium">CTA Metni</label>
            <input
              id="cta"
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              value={String(values.cta ?? '')}
              onChange={(e) => update('cta', e.target.value)}
            />
          </div>
        </>
      )}

      {/* Stats alanları */}
      {templateId === 'Stats' && (
        <>
          {(values.stats as { value: string; label: string }[] ?? []).map((stat, i) => (
            <div key={i} className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Değer {i + 1}</label>
                <input
                  className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
                  value={stat.value}
                  onChange={(e) => {
                    const updated = [...(values.stats as { value: string; label: string }[])]
                    updated[i] = { ...updated[i], value: e.target.value }
                    update('stats', updated)
                  }}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Açıklama {i + 1}</label>
                <input
                  className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
                  value={stat.label}
                  onChange={(e) => {
                    const updated = [...(values.stats as { value: string; label: string }[])]
                    updated[i] = { ...updated[i], label: e.target.value }
                    update('stats', updated)
                  }}
                />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium">Count-up animasyonu</label>
            <input
              type="checkbox"
              checked={Boolean(values.countUp)}
              onChange={(e) => update('countUp', e.target.checked)}
              className="rounded"
            />
          </div>
        </>
      )}

      {/* TalkingHead alanları */}
      {templateId === 'TalkingHead' && (
        <>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Lower Third Metni</label>
            <input
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
              value={String(values.lowerThird ?? '')}
              onChange={(e) => update('lowerThird', e.target.value)}
            />
          </div>
        </>
      )}

      {/* Ortak alanlar */}
      <div>
        <label className="block text-xs text-gray-500 mb-1 font-medium">Vurgu Rengi</label>
        <div className="flex gap-2 items-center">
          {ACCENT_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => update('accentColor', c)}
              className="w-5 h-5 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                boxShadow: values.accentColor === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined,
              }}
            />
          ))}
          <input
            type="color"
            value={String(values.accentColor ?? '#e67e22')}
            onChange={(e) => update('accentColor', e.target.value)}
            className="w-5 h-5 rounded cursor-pointer border-0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="fontFamily" className="block text-xs text-gray-500 mb-1 font-medium">Font</label>
          <select
            id="fontFamily"
            className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
            value={String(values.fontFamily ?? 'sans-serif')}
            onChange={(e) => update('fontFamily', e.target.value)}
          >
            {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="format" className="block text-xs text-gray-500 mb-1 font-medium">Format</label>
          <select
            id="format"
            className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
            value={String(values.format ?? '1080x1920')}
            onChange={(e) => update('format', e.target.value)}
          >
            {FORMATS.map((f) => <option key={f} value={f}>{f === '1080x1920' ? '1080×1920 (Dikey)' : '1920×1080 (Yatay)'}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="duration" className="block text-xs text-gray-500 mb-1 font-medium">Süre</label>
          <select
            id="duration"
            className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
            value={String(values.durationSeconds ?? 30)}
            onChange={(e) => update('durationSeconds', Number(e.target.value))}
          >
            {DURATIONS.map((d) => <option key={d} value={d}>{d} saniye</option>)}
          </select>
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors mt-2"
      >
        {loading ? 'Render ediliyor...' : '▶ Videoyu Oluştur'}
      </button>
    </div>
  )
}
