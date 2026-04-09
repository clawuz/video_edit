'use client'

interface VideoPreviewProps {
  renderId: string | null
  loading: boolean
  accentColor: string
  format?: '1080x1920' | '1920x1080'
}

export function VideoPreview({ renderId, loading, accentColor, format = '1080x1920' }: VideoPreviewProps) {
  const isLandscape = format === '1920x1080'
  const mockupClass = isLandscape ? 'w-[445px] h-[250px]' : 'w-[250px] h-[445px]'
  const videoClass = isLandscape ? 'max-w-[500px]' : 'max-h-[500px]'

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-full">
        <div
          className={`${mockupClass} rounded-xl flex items-center justify-center`}
          style={{ backgroundColor: '#1a1a2e' }}
        >
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
          className={`${videoClass} rounded-xl shadow-lg`}
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
      <p className="text-xs text-gray-400">Önizleme</p>
      <div
        className={`${mockupClass} rounded-xl flex flex-col items-center justify-center gap-2 overflow-hidden`}
        style={{ backgroundColor: '#1a1a2e' }}
      >
        <div className="text-sm font-black text-white text-center px-3 leading-tight">
          Video çıktısı
        </div>
        <div className="text-sm font-bold" style={{ color: accentColor }}>
          burada görünür
        </div>
      </div>
    </div>
  )
}
