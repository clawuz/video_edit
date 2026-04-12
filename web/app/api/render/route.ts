export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { render } from '@/lib/renderer'
import { buildRenderProps } from '@/lib/templates'
import { PLATFORM_KEYS, PlatformKey } from '../../../../src/compositions/platforms'
import path from 'path'
import fs from 'fs'

function getRemotionRoot() {
  return path.resolve(process.cwd(), process.env.REMOTION_PROJECT_DIR ?? '../')
}

function resolveMediaPath(media: unknown): unknown {
  if (typeof media !== 'string' || !media) return media
  if (media.startsWith('data:') || media.startsWith('http')) return media

  let normalized = media.startsWith('/') ? media.slice(1) : media
  if (normalized.startsWith('public/')) normalized = normalized.slice('public/'.length)

  const srcPath = path.join(process.cwd(), 'public', normalized)
  if (!fs.existsSync(srcPath)) return media

  const remotionPublicUploads = path.join(getRemotionRoot(), 'public', 'uploads')
  fs.mkdirSync(remotionPublicUploads, { recursive: true })

  const filename = path.basename(srcPath)
  const destPath = path.join(remotionPublicUploads, filename)
  fs.copyFileSync(srcPath, destPath)

  return `uploads/${filename}`
}

function toPlatformKey(v: unknown): PlatformKey {
  return (PLATFORM_KEYS as readonly string[]).includes(v as string)
    ? (v as PlatformKey)
    : '9:16'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      templateId: string
      overrides: Record<string, unknown>
      platform?: string
      durationSeconds?: number
    }

    let { templateId, overrides, platform, durationSeconds } = body

    if (!templateId) {
      return NextResponse.json({ error: 'templateId gerekli' }, { status: 400 })
    }

    // Subtitle: süreyi önce overrides.durationSeconds'dan, yoksa subtitles son endMs'den al
    if (templateId === 'Subtitle' && !durationSeconds) {
      if (overrides?.durationSeconds) {
        durationSeconds = Number(overrides.durationSeconds)
      } else if (Array.isArray(overrides?.subtitles) && overrides.subtitles.length > 0) {
        const lastEnd = Math.max(...(overrides.subtitles as { endMs: number }[]).map(s => s.endMs))
        durationSeconds = Math.ceil(lastEnd / 1000) + 1
      }
    }

    const resolvedOverrides = {
      ...overrides,
      backgroundMedia: resolveMediaPath(overrides?.backgroundMedia),
      ctaLogoUrl: resolveMediaPath(overrides?.ctaLogoUrl),
    }

    const props = buildRenderProps(templateId, resolvedOverrides, toPlatformKey(platform), durationSeconds)
    const outputPath = await render({ compositionId: templateId, props })
    const id = path.basename(outputPath, '.mp4')

    return NextResponse.json({ id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Render hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
