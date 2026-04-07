export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { render } from '@/lib/renderer'
import { buildRenderProps } from '@/lib/templates'
import path from 'path'
import fs from 'fs'
import { lookup } from 'mime-types'

// Convert a local /uploads/filename path to base64 data URL so Remotion can embed it
function resolveBackgroundMedia(media: unknown): unknown {
  if (typeof media !== 'string' || !media) return media
  // Already a data URL or http URL — pass through
  if (media.startsWith('data:') || media.startsWith('http')) return media
  // uploads/filename.ext — resolve to absolute path and base64
  const relativePath = media.startsWith('/') ? media : `/${media}`
  const absPath = path.join(process.cwd(), 'public', relativePath)
  if (!fs.existsSync(absPath)) return media
  const mimeType = lookup(absPath) || 'application/octet-stream'
  const data = fs.readFileSync(absPath).toString('base64')
  return `data:${mimeType};base64,${data}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      templateId: string
      overrides: Record<string, unknown>
      format?: '1080x1920' | '1920x1080'
      durationSeconds?: number
    }

    const { templateId, overrides, format, durationSeconds } = body

    if (!templateId) {
      return NextResponse.json({ error: 'templateId gerekli' }, { status: 400 })
    }

    // Resolve backgroundMedia to base64 data URL before render
    const resolvedOverrides = {
      ...overrides,
      backgroundMedia: resolveBackgroundMedia(overrides?.backgroundMedia),
    }

    const props = buildRenderProps(templateId, resolvedOverrides, format, durationSeconds)
    const outputPath = await render({ compositionId: templateId, props })
    const id = path.basename(outputPath, '.mp4')

    return NextResponse.json({ id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Render hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
