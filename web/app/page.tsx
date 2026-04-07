'use client'

import { useState } from 'react'
import { TopNav, TabId } from '@/components/TopNav'
import { TemplateGrid } from '@/components/TemplateGrid'
import { ParamForm } from '@/components/ParamForm'
import { VideoPreview } from '@/components/VideoPreview'
import { getTemplate } from '@/lib/templates'

const VALID_FORMATS = ['1080x1920', '1920x1080'] as const
type VideoFormat = typeof VALID_FORMATS[number]
function toVideoFormat(v: unknown): VideoFormat {
  return VALID_FORMATS.includes(v as VideoFormat) ? (v as VideoFormat) : '1080x1920'
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
          format: toVideoFormat(params.format),
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
              format={toVideoFormat(params.format)}
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
