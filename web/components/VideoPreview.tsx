'use client'

import React from 'react'
import { PLATFORMS, PlatformKey } from '../../src/compositions/platforms'

interface VideoPreviewProps {
  renderId: string | null
  loading: boolean
  accentColor: string
  platform?: PlatformKey
}

const PREVIEW_BASE = 250

export function VideoPreview({ renderId, loading, accentColor, platform = '9:16' }: VideoPreviewProps) {
  const { w, h, safeTop, safeBottom, safeLeft, safeRight } = PLATFORMS[platform] ?? PLATFORMS['9:16']

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
    ? { maxHeight: mockupH + 'px', borderRadius: '12px' }
    : { maxWidth: mockupW + 'px', borderRadius: '12px' }

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
          style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}
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
      <p className="text-xs" style={{ color: 'rgba(255,100,100,0.8)' }}>
        — safe zone
      </p>
    </div>
  )
}
