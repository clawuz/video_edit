import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { randomUUID } from 'crypto'
import fs from 'fs'
import os from 'os'

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
  propsFile: string
  width?: number
  height?: number
  durationInFrames?: number
}): string {
  const remotionDir = getRemotionDir()
  const publicDir = path.join(remotionDir, 'public')
  const sizeFlags = opts.width && opts.height ? ` --width=${opts.width} --height=${opts.height}` : ''
  return `npx remotion render ${opts.compositionId} "${opts.outputPath}" --props="${opts.propsFile}" --public-dir="${publicDir}"${sizeFlags} --concurrency=1`
}

export async function render(opts: {
  compositionId: string
  props: Record<string, unknown>
}): Promise<string> {
  const outDir = getOutDir()
  fs.mkdirSync(outDir, { recursive: true })
  const outputPath = getOutputPath(outDir)

  // Write props to a temp JSON file to avoid any shell escaping issues
  const propsFile = path.join(os.tmpdir(), `remotion-props-${randomUUID()}.json`)
  fs.writeFileSync(propsFile, JSON.stringify(opts.props))

  try {
    const cmd = buildRenderCommand({
      compositionId: opts.compositionId,
      outputPath,
      propsFile,
      width: opts.props.width as number | undefined,
      height: opts.props.height as number | undefined,
      durationInFrames: opts.props.durationInFrames as number | undefined,
    })
    await execAsync(cmd, {
      cwd: getRemotionDir(),
      maxBuffer: 1024 * 1024 * 100,
      timeout: 10 * 60 * 1000,
    })
  } finally {
    fs.rmSync(propsFile, { force: true })
  }

  return outputPath
}
