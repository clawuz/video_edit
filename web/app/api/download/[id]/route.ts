export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const OUT_DIR = path.resolve(process.cwd(), process.env.RENDER_OUT_DIR ?? '../out')

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  // Güvenlik: path traversal engelle
  if (!/^[a-f0-9-]+$/.test(id)) {
    return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })
  }

  const filePath = path.join(OUT_DIR, `${id}.mp4`)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
  }

  const fileBuffer = fs.readFileSync(filePath)
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="${id}.mp4"`,
      'Content-Length': fileBuffer.length.toString(),
    },
  })
}
