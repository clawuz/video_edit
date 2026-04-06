import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { randomUUID } from 'crypto'
import fs from 'fs'

const execAsync = promisify(exec)

const REMOTION_DIR = path.resolve(process.cwd(), process.env.REMOTION_PROJECT_DIR ?? '../')
const OUT_DIR = path.resolve(process.cwd(), process.env.RENDER_OUT_DIR ?? '../out')

export function getOutputPath(outDir: string = OUT_DIR): string {
  return path.join(outDir, `${randomUUID()}.mp4`)
}

export function buildRenderCommand(opts: {
  compositionId: string
  outputPath: string
  props: Record<string, unknown>
}): string {
  const propsJson = JSON.stringify(opts.props).replace(/'/g, "\\'")
  return `npx remotion render ${opts.compositionId} "${opts.outputPath}" --props='${propsJson}'`
}

export async function render(opts: {
  compositionId: string
  props: Record<string, unknown>
}): Promise<string> {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const outputPath = getOutputPath()
  const cmd = buildRenderCommand({ ...opts, outputPath })
  await execAsync(cmd, { cwd: REMOTION_DIR, maxBuffer: 1024 * 1024 * 100 })
  return outputPath
}
