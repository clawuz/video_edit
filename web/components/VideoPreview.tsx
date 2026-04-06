'use client'

interface VideoPreviewProps {
  renderId: string | null
  loading: boolean
  accentColor: string
}

export function VideoPreview({ renderId, loading, accentColor }: VideoPreviewProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-full">
        <div
          className="w-20 h-36 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: '#1a1a2e' }}
        >
          <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
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
          className="max-h-64 rounded-xl shadow-lg"
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
        className="w-20 h-36 rounded-xl flex flex-col items-center justify-center gap-1.5 overflow-hidden"
        style={{ backgroundColor: '#1a1a2e' }}
      >
        <div className="text-xs font-black text-white text-center px-2 leading-tight">
          Video çıktısı
        </div>
        <div className="text-xs font-bold" style={{ color: accentColor }}>
          burada
        </div>
        <div className="text-xs font-bold" style={{ color: accentColor }}>
          görünür
        </div>
      </div>
    </div>
  )
}
