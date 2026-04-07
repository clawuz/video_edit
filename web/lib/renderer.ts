import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { randomUUID } from 'crypto'
import fs from 'fs'

const execAsync = promisify(exec)

function getRemotionDir() {
  return path.resolve(process.cwd(), process.env.REMOTION_PROJECT_DIR ?? '../')
}

function getOutDir() {
  return path.resolve(process.cwd(), process.env.RENDER_OUT_DIR ?? '../out')
}

export function getOutputPath(outDir?: string): string {
  return path.join(outDir ?? getOutDir(), `${randomUUID()}.mp4`)
}

export function buildRenderCommand(opts: {
  compositionId: string
  outputPath: string
  props: Record<string, unknown>
}): string {
  const width = opts.props.width as number | undefined
  const height = opts.props.height as number | undefined
  const propsJson = JSON.stringify(opts.props).replace(/"/g, '\\"')
  const sizeFlags = width && height ? ` --width=${width} --height=${height}` : ''
  // Point Remotion's public dir to web/public so staticFile('uploads/...') works
  const publicDir = path.resolve(process.cwd(), 'public')
  return `npx remotion render ${opts.compositionId} "${opts.outputPath}" --props="${propsJson}"${sizeFlags} --concurrency=1 --public-dir="${publicDir}"`
}

export async function render(opts: {
  compositionId: string
  props: Record<string, unknown>
}): Promise<string> {
  const outDir = getOutDir()
  fs.mkdirSync(outDir, { recursive: true })
  const outputPath = getOutputPath(outDir)
  const cmd = buildRenderCommand({ ...opts, outputPath })
  await execAsync(cmd, {
    cwd: getRemotionDir(),
    maxBuffer: 1024 * 1024 * 100,
    timeout: 10 * 60 * 1000,
  })
  return outputPath
}
