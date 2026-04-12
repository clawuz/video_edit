export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { stat } from 'fs/promises'
import { Readable } from 'stream'

function getOutDir() {
  return path.resolve(process.cwd(), process.env.RENDER_OUT_DIR ?? '../out')
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  // Güvenlik: path traversal engelle
  if (!/^[a-f0-9-]+$/.test(id)) {
    return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })
  }

  const filePath = path.join(getOutDir(), `${id}.mp4`)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
  }

  const fileStats = await stat(filePath)
  const fileStream = fs.createReadStream(filePath)
  const readableStream = Readable.toWeb(fileStream) as ReadableStream

  return new NextResponse(readableStream, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="${id}.mp4"`,
      'Content-Length': fileStats.size.toString(),
    },
  })
}
