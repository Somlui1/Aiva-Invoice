import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const buildIdPath = path.join(root, '.next', 'BUILD_ID')

if (existsSync(buildIdPath)) {
  console.log('[predev] Detected production build artifacts (.next/BUILD_ID). Cleaning .next for dev mode...')
  try {
    rmSync(path.join(root, '.next'), { recursive: true, force: true })
    console.log('[predev] Cleaned .next directory successfully.')
  } catch (err) {
    console.warn('[predev] Warning: Could not remove .next directory (files may be in use):', err.message)
  }
}
