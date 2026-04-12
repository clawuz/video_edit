'use client'
import { useState } from 'react'
import { ColorPicker } from './ColorPicker'
import { BodyItem, EntryAnimType, ExitAnimType, SubtitleEntry } from '../../src/compositions/types'
import { PLATFORMS, PLATFORM_KEYS, FONTS } from '../../src/compositions/platforms'

const DURATIONS = [15, 30, 60]

const ENTRY_GROUPS = [
  { label: '— Yok',    options: ['none'] },
  { label: 'Temel',    options: ['fade', 'zoom', 'slide-up', 'slide-down', 'slide-left', 'slide-right'] },
  { label: 'Premium ★', options: ['pop', 'typewriter', 'blur', 'flip', 'elastic', 'rise'] },
  { label: 'Efekt ★★', options: ['wave', 'split', 'neon-glow', 'spin-3d', 'glitch'] },
] as const

const EXIT_GROUPS = [
  { label: '— Yok',    options: ['none'] },
  { label: 'Temel',    options: ['fade-out', 'zoom-out', 'slide-out-up', 'slide-out-down', 'slide-out-left', 'slide-out-right'] },
  { label: 'Premium ★', options: ['shrink', 'blur-out', 'flip-out'] },
  { label: 'Efekt ★★', options: ['wave-out', 'split-out', 'glitch-out', 'neon-flicker', 'dissolve', 'light-speed'] },
] as const

const ANIM_LABELS: Record<string, string> = {
  none: '— Yok',
  fade: 'Fade', zoom: 'Zoom',
  'slide-up': 'Slide ↑', 'slide-down': 'Slide ↓', 'slide-left': 'Slide ←', 'slide-right': 'Slide →',
  pop: 'Pop ★', typewriter: 'Typewriter ★', blur: 'Blur In ★', flip: 'Flip ★', elastic: 'Elastic ★', rise: 'Rise ★',
  wave: 'Wave ★★', split: 'Split ★★', 'neon-glow': 'Neon Glow ★★', 'spin-3d': '3D Spin ★★', glitch: 'Glitch ★★',
  'fade-out': 'Fade Out', 'zoom-out': 'Zoom Out',
  'slide-out-up': 'Slide Out ↑', 'slide-out-down': 'Slide Out ↓', 'slide-out-left': 'Slide Out ←', 'slide-out-right': 'Slide Out →',
  shrink: 'Shrink ★', 'blur-out': 'Blur Out ★', 'flip-out': 'Flip Out ★',
  'wave-out': 'Wave Out ★★', 'split-out': 'Split Out ★★', 'glitch-out': 'Glitch Out ★★',
  'neon-flicker': 'Neon Flicker ★★', dissolve: 'Dissolve ★★', 'light-speed': 'Light Speed ★★',
}

function AnimSelect({ value, groups, onChange }: { value: string; groups: typeof ENTRY_GROUPS | typeof EXIT_GROUPS; onChange: (v: string) => void }) {
  return (
    <select
      className="w-full bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {groups.map(g => (
        <optgroup key={g.label} label={g.label}>
          {g.options.map(o => <option key={o} value={o}>{ANIM_LABELS[o] ?? o}</option>)}
        </optgroup>
      ))}
    </select>
  )
}

function Toggle({ checked, onChange, testId }: { checked: boolean; onChange: (v: boolean) => void; testId?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      data-testid={testId}
      onClick={() => onChange(!checked)}
      className="relative rounded-full flex-shrink-0 transition-colors"
      style={{ width: 32, height: 18, backgroundColor: checked ? '#6366f1' : '#d1d5db' }}
    >
      <span
        className="absolute bg-white rounded-full shadow transition-all"
        style={{ width: 14, height: 14, top: 2, left: checked ? 16 : 2, transition: 'left 0.15s' }}
      />
    </button>
  )
}

function AccordionSection({
  title, enabled, onToggle, toggleTestId, children,
}: {
  title: string; enabled: boolean; onToggle: (v: boolean) => void; toggleTestId?: string; children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className={`border rounded-lg overflow-hidden mb-2 ${enabled ? 'border-gray-200' : 'border-gray-100'}`}>
      <div
        className={`flex items-center gap-2 px-3 py-2 cursor-pointer select-none ${enabled ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-50'}`}
        onClick={() => enabled && setOpen(o => !o)}
      >
        <Toggle checked={enabled} onChange={onToggle} testId={toggleTestId} />
        <span className={`text-xs font-bold flex-1 ${enabled ? 'text-gray-800' : 'text-gray-300 line-through'}`}>{title}</span>
        {enabled && <span className="text-gray-400 text-xs">{open ? '▾' : '▸'}</span>}
      </div>
      {enabled && open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  )
}

function TimingRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-[10px] text-gray-400 mb-1 uppercase font-semibold tracking-wide">{label}</label>
      <input
        type="number" min={0} step={0.5}
        className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs text-indigo-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-400"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  )
}

function hasSlotCollision(body: BodyItem[], slot: number, currentIndex: number): boolean {
  const sameSlot = body.filter((item, i) => i !== currentIndex && item.slot === slot)
  const current = body[currentIndex]
  if (!current) return false
  return sameSlot.some(other => {
    const aEnd = current.startSec + current.durationSec
    const bEnd = other.startSec + other.durationSec
    return current.startSec < bEnd && aEnd > other.startSec
  })
}

const SLOT_COLORS = ['', 'bg-yellow-100 text-yellow-800', 'bg-green-100 text-green-800', 'bg-blue-100 text-blue-800', 'bg-pink-100 text-pink-800', 'bg-purple-100 text-purple-800', 'bg-orange-100 text-orange-800', 'bg-teal-100 text-teal-800', 'bg-red-100 text-red-800', 'bg-indigo-100 text-indigo-800', 'bg-gray-100 text-gray-700']

function BodySection({ body, update }: { body: BodyItem[]; update: (k: string, v: unknown) => void }) {
  const updateItem = (i: number, patch: Partial<BodyItem>) => {
    const next = body.map((item, idx) => idx === i ? { ...item, ...patch } : item)
    update('body', next)
  }
  const addItem = () => {
    if (body.length >= 10) return
    const newItem: BodyItem = { text: '', slot: Math.min(body.length + 1, 10), startSec: 0, durationSec: 5, entryAnim: 'fade', exitAnim: 'fade-out' }
    update('body', [...body, newItem])
  }
  const removeItem = (i: number) => update('body', body.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-2">
      {body.map((item, i) => {
        const collision = hasSlotCollision(body, item.slot, i)
        return (
          <div key={i} className={`border rounded-lg p-2.5 space-y-2 ${collision ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center gap-2">
              <select
                className={`text-[10px] font-bold px-2 py-1 rounded-full border cursor-pointer ${SLOT_COLORS[item.slot] || 'bg-gray-100 text-gray-700'}`}
                value={item.slot}
                onChange={e => updateItem(i, { slot: Number(e.target.value) })}
              >
                {Array.from({ length: 10 }, (_, j) => j + 1).map(n => (
                  <option key={n} value={n}>Slot {n}</option>
                ))}
              </select>
              <input
                className="flex-1 bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                placeholder="Metin..."
                value={item.text}
                onChange={e => updateItem(i, { text: e.target.value })}
              />
              <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500 text-xs px-1">✕</button>
            </div>
            {collision && (
              <div className="text-[10px] text-yellow-700 font-semibold">⚠ Slot {item.slot} zaman çakışıyor</div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <TimingRow label="Giriş (sn)" value={item.startSec} onChange={v => updateItem(i, { startSec: v })} />
              <TimingRow label="Süre (sn)" value={item.durationSec} onChange={v => updateItem(i, { durationSec: v })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1 uppercase font-semibold tracking-wide">Giriş anim.</label>
                <AnimSelect value={item.entryAnim} groups={ENTRY_GROUPS} onChange={v => updateItem(i, { entryAnim: v as EntryAnimType })} />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1 uppercase font-semibold tracking-wide">Çıkış anim.</label>
                <AnimSelect value={item.exitAnim} groups={EXIT_GROUPS} onChange={v => updateItem(i, { exitAnim: v as ExitAnimType })} />
              </div>
            </div>
          </div>
        )
      })}
      <button
        onClick={addItem}
        disabled={body.length >= 10}
        className="w-full border-2 border-dashed border-indigo-200 rounded-lg py-2 text-xs text-indigo-400 hover:border-indigo-400 hover:text-indigo-600 transition-colors disabled:opacity-40"
      >
        + Yeni öğe ekle ({body.length}/10)
      </button>
    </div>
  )
}

function CtaSection({ values, update }: { values: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  const ctaMode = String(values.ctaMode ?? 'text')

  return (
    <AccordionSection title="CTA" enabled={Boolean(values.showCta ?? true)} onToggle={v => update('showCta', v)} toggleTestId="toggle-cta">
      <div>
        <label className="block text-[10px] text-gray-400 mb-1.5 uppercase font-semibold tracking-wide">Mod</label>
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {(['text', 'logo'] as const).map(m => (
            <button
              key={m}
              onClick={() => update('ctaMode', m)}
              className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${ctaMode === m ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {m === 'text' ? 'Metin' : 'Logo'}
            </button>
          ))}
        </div>
      </div>

      {ctaMode === 'text' ? (
        <>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1 uppercase font-semibold tracking-wide">CTA Metni</label>
            <input
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={String(values.cta ?? '')}
              onChange={e => update('cta', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-2 uppercase font-semibold tracking-wide">Arka Plan Rengi</label>
            <ColorPicker
              value={String(values.ctaBgColor ?? '#e67e22')}
              opacity={Number(values.ctaOpacity ?? 100)}
              onChange={({ color, opacity }) => { update('ctaBgColor', color); update('ctaOpacity', opacity) }}
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1.5 uppercase font-semibold tracking-wide">Logo Görseli</label>
            {values.ctaLogoUrl ? (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-600 flex-1 truncate">{String(values.ctaLogoUrl).split('/').pop()}</span>
                <button onClick={() => update('ctaLogoUrl', '')} className="text-xs text-gray-400 hover:text-red-500">✕ Kaldır</button>
              </div>
            ) : (
              <label className="block w-full border-2 border-dashed border-indigo-200 rounded-lg py-4 text-center cursor-pointer hover:border-indigo-400 transition-colors">
                <div className="text-xl mb-1">🖼</div>
                <div className="text-xs text-gray-400"><span className="text-indigo-500 font-semibold">Logo seç</span> (PNG, JPG, SVG, WebP)</div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const fd = new FormData()
                    fd.append('file', file)
                    const res = await fetch('/api/upload', { method: 'POST', body: fd })
                    const data = await res.json()
                    if (data.remotionUrl) update('ctaLogoUrl', data.remotionUrl)
                  }}
                />
              </label>
            )}
          </div>
          <TimingRow label="Logo Yüksekliği (px)" value={Number(values.ctaLogoHeight ?? 80)} onChange={v => update('ctaLogoHeight', v)} />
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <TimingRow label="Giriş (sn)" value={Number(values.ctaStartSec ?? 20)} onChange={v => update('ctaStartSec', v)} />
        <TimingRow label="Süre (sn)" value={Number(values.ctaDurationSec ?? 8)} onChange={v => update('ctaDurationSec', v)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-gray-400 mb-1 uppercase font-semibold tracking-wide">Giriş anim.</label>
          <AnimSelect value={String(values.ctaEntryAnim ?? 'slide-up')} groups={ENTRY_GROUPS} onChange={v => update('ctaEntryAnim', v)} />
        </div>
        <div>
          <label className="block text-[10px] text-gray-400 mb-1 uppercase font-semibold tracking-wide">Çıkış anim.</label>
          <AnimSelect value={String(values.ctaExitAnim ?? 'fade-out')} groups={EXIT_GROUPS} onChange={v => update('ctaExitAnim', v)} />
        </div>
      </div>
    </AccordionSection>
  )
}

function ProductAdForm({ values, update }: { values: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  const body = (values.body as BodyItem[]) ?? []

  return (
    <>
      <AccordionSection title="Başlık" enabled={Boolean(values.showTitle ?? true)} onToggle={v => update('showTitle', v)} toggleTestId="toggle-title">
        <input
          placeholder="Başlık metni"
          className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
          value={String(values.title ?? '')}
          onChange={e => update('title', e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <TimingRow label="Giriş (sn)" value={Number(values.titleStartSec ?? 0)} onChange={v => update('titleStartSec', v)} />
          <TimingRow label="Süre (sn)" value={Number(values.titleDurationSec ?? 10)} onChange={v => update('titleDurationSec', v)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-gray-400 mb-1 uppercase font-semibold tracking-wide">Giriş anim.</label>
            <AnimSelect value={String(values.titleEntryAnim ?? 'fade')} groups={ENTRY_GROUPS} onChange={v => update('titleEntryAnim', v)} />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1 uppercase font-semibold tracking-wide">Çıkış anim.</label>
            <AnimSelect value={String(values.titleExitAnim ?? 'fade-out')} groups={EXIT_GROUPS} onChange={v => update('titleExitAnim', v)} />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title="Body" enabled={Boolean(values.showBody ?? true)} onToggle={v => update('showBody', v)} toggleTestId="toggle-body">
        <BodySection body={body} update={update} />
      </AccordionSection>

      <CtaSection values={values} update={update} />
    </>
  )
}

function StatsForm({ values, update }: { values: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  return (
    <>
      {(values.stats as { value: string; label: string }[] ?? []).map((stat, i) => (
        <div key={i} className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Değer {i + 1}</label>
            <input className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" value={stat.value}
              onChange={e => {
                const updated = [...(values.stats as { value: string; label: string }[])]
                updated[i] = { ...updated[i], value: e.target.value }
                update('stats', updated)
              }} />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Açıklama {i + 1}</label>
            <input className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" value={stat.label}
              onChange={e => {
                const updated = [...(values.stats as { value: string; label: string }[])]
                updated[i] = { ...updated[i], label: e.target.value }
                update('stats', updated)
              }} />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 font-medium">Count-up animasyonu</label>
        <input type="checkbox" checked={Boolean(values.countUp)} onChange={e => update('countUp', e.target.checked)} className="rounded" />
      </div>
    </>
  )
}

function SubtitleForm({ values, update }: { values: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  return <div className="text-xs text-gray-400 py-2">Altyazı formu Task 13'te eklenecek.</div>
}

function CommonFields({ values, update }: { values: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-3 pt-1">
      <div>
        <label className="block text-xs text-gray-500 mb-2 font-medium">Vurgu Rengi</label>
        <ColorPicker
          value={String(values.accentColor ?? '#e67e22')}
          opacity={Number(values.accentOpacity ?? 100)}
          onChange={({ color, opacity }) => { update('accentColor', color); update('accentOpacity', opacity) }}
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-2 font-medium">Arka Plan Rengi</label>
        <ColorPicker
          value={String(values.backgroundColor ?? '#1a1a2e')}
          opacity={100}
          onChange={({ color }) => update('backgroundColor', color)}
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1 font-medium">Arka Plan Görseli / Videosu</label>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-600 hover:border-gray-400 transition-colors">
            📁 Dosya Seç
            <input
              type="file"
              accept="image/*,video/mp4,video/webm"
              className="hidden"
              onChange={async e => {
                const file = e.target.files?.[0]
                if (!file) return
                const fd = new FormData()
                fd.append('file', file)
                const res = await fetch('/api/upload', { method: 'POST', body: fd })
                const data = await res.json()
                if (data.remotionUrl) update('backgroundMedia', data.remotionUrl)
              }}
            />
          </label>
          {values.backgroundMedia != null && values.backgroundMedia !== '' && (
            <>
              <span className="text-xs text-gray-400 truncate max-w-[120px]">{String(values.backgroundMedia).split('/').pop()}</span>
              <button onClick={() => update('backgroundMedia', '')} className="text-xs text-gray-400 hover:text-red-500">✕</button>
            </>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Font</label>
          <select className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" value={String(values.fontFamily ?? 'sans-serif')} onChange={e => update('fontFamily', e.target.value)}>
            {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Platform</label>
          <select className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" value={String(values.platform ?? '9:16')} onChange={e => update('platform', e.target.value)}>
            {PLATFORM_KEYS.map(k => <option key={k} value={k}>{PLATFORMS[k].label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Süre</label>
          <select className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" value={String(values.durationSeconds ?? 30)} onChange={e => update('durationSeconds', Number(e.target.value))}>
            {DURATIONS.map(d => <option key={d} value={d}>{d} saniye</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Başlık Boyutu</label>
          <select className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" value={String(values.titleFontSize ?? 72)} onChange={e => update('titleFontSize', Number(e.target.value))}>
            {[36, 48, 60, 72, 96, 120].map(s => <option key={s} value={s}>{s}px</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Metin Boyutu</label>
          <select className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" value={String(values.bodyFontSize ?? 36)} onChange={e => update('bodyFontSize', Number(e.target.value))}>
            {[18, 24, 32, 36, 48].map(s => <option key={s} value={s}>{s}px</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

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
    <div className="space-y-3">
      {templateId === 'ProductAd' && <ProductAdForm values={values} update={update} />}
      {templateId === 'Stats' && <StatsForm values={values} update={update} />}
      {templateId === 'Subtitle' && <SubtitleForm values={values} update={update} />}

      <CommonFields values={values} update={update} />

      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-bold disabled:opacity-50 hover:bg-gray-700 transition-colors mt-2"
      >
        {loading ? 'Render ediliyor...' : '▶ Render Et'}
      </button>
    </div>
  )
}
