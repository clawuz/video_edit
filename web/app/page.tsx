'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [renderProgress, setRenderProgress] = useState(0)
  const renderTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!loading) {
      if (renderTimerRef.current) clearInterval(renderTimerRef.current)
      return
    }
    setRenderProgress(0)
    const durationSec = Number((params as any).durationSeconds ?? 30)
    // Remotion CPU render tahmini: ~3x realtime
    const estimatedMs = durationSec * 3000
    const startTime = Date.now()
    renderTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      setRenderProgress(Math.round(Math.min((elapsed / estimatedMs) * 95, 95)))
    }, 500)
    return () => { if (renderTimerRef.current) clearInterval(renderTimerRef.current) }
  }, [loading])

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
      console.log('[page] render params.durationSeconds:', params.durationSeconds)
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
      setRenderProgress(100)
      setRenderId(data.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <TopNav activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'create' && (
        <div className="flex flex-1 overflow-hidden">
          {/* Sol panel */}
          <div className="w-[52%] p-5 border-r border-gray-100 overflow-y-auto">
            <div className="text-sm font-bold text-gray-800 mb-4">Şablon Seç</div>
            <TemplateGrid selected={selectedTemplate} onSelect={handleTemplateSelect} />
            <ParamForm
              templateId={selectedTemplate}
              values={params}
              onChange={setParams}
              onSubmit={handleRender}
              loading={loading}
            />
            {loading && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Render ediliyor...</span>
                  <span>%{renderProgress}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-gray-800 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${renderProgress}%` }}
                  />
                </div>
              </div>
            )}
            {error && (
              <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}
          </div>

          {/* Sağ panel */}
          <div className="flex-1 bg-gray-50 flex items-center justify-center">
            <VideoPreview
              renderId={renderId}
              loading={loading}
              accentColor={String(params.accentColor ?? '#e67e22')}
              platform={toPlatformKey(params.platform)}
            />
          </div>
        </div>
      )}

      {activeTab === 'subtitle' && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Altyazı Ekle — Plan 2'de uygulanacak
        </div>
      )}

      {activeTab === 'history' && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Geçmiş — Plan 3'te uygulanacak
        </div>
      )}
    </div>
  )
}
