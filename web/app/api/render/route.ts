export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { render } from '@/lib/renderer'
import { buildRenderProps } from '@/lib/templates'
import path from 'path'
import fs from 'fs'

function getRemotionRoot() {
  return path.resolve(process.cwd(), process.env.REMOTION_PROJECT_DIR ?? '../')
}

// Copy uploaded file to Remotion's public/uploads/ so staticFile() can serve it during render
function resolveMediaPath(media: unknown): unknown {
  if (typeof media !== 'string' || !media) return media
  if (media.startsWith('data:') || media.startsWith('http')) return media

  // Normalize: strip leading 'public/' prefix if present (old format)
  let normalized = media.startsWith('/') ? media.slice(1) : media
  if (normalized.startsWith('public/')) normalized = normalized.slice('public/'.length)

  // Expect uploads/filename.ext
  const srcPath = path.join(process.cwd(), 'public', normalized)
  if (!fs.existsSync(srcPath)) return media

  const remotionPublicUploads = path.join(getRemotionRoot(), 'public', 'uploads')
  fs.mkdirSync(remotionPublicUploads, { recursive: true })

  const filename = path.basename(srcPath)
  const destPath = path.join(remotionPublicUploads, filename)
  fs.copyFileSync(srcPath, destPath)

  // Return path relative to Remotion public dir — staticFile('uploads/filename')
  return `uploads/${filename}`
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

    const resolvedOverrides = {
      ...overrides,
      backgroundMedia: resolveMediaPath(overrides?.backgroundMedia),
      ctaLogoUrl: resolveMediaPath(overrides?.ctaLogoUrl),
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
