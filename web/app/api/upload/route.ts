export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { randomUUID } from 'crypto'

const execFileAsync = promisify(execFile)

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const PORT = process.env.PORT ?? '3001'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 })
    }

    const ext = path.extname(file.name).toLowerCase()
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.mov']
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: 'Desteklenmeyen dosya tipi' }, { status: 400 })
    }

    const filename = `${randomUUID()}${ext}`
    const bytes = await file.arrayBuffer()
    await mkdir(UPLOAD_DIR, { recursive: true })
    await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(bytes))

    const filePath = path.join(UPLOAD_DIR, filename)
    let durationSeconds: number | null = null

    if (['.mp4', '.webm', '.mov'].includes(ext)) {
      try {
        const { stdout } = await execFileAsync('ffprobe', [
          '-v', 'quiet',
          '-show_entries', 'format=duration',
          '-of', 'default=noprint_wrappers=1:nokey=1',
          filePath,
        ])
        const parsed = parseFloat(stdout.trim())
        if (!isNaN(parsed)) durationSeconds = Math.ceil(parsed)
      } catch {
        // ffprobe yoksa client-side fallback devrede kalır
      }
    }

    return NextResponse.json({
      url: `/uploads/${filename}`,
      remotionUrl: `uploads/${filename}`,
      durationSeconds,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Yükleme hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
