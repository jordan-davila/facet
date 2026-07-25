#!/usr/bin/env node
// Package dist/ into the zip the Chrome Web Store expects.
//
// Run after `pnpm build`. Refuses to produce an archive it knows the store will
// reject, because those failures otherwise surface hours later in review.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const DIST = join(ROOT, 'dist')
const OUT_DIR = join(ROOT, 'releases')

/** The store rejects packages above this size. */
const MAX_ZIP_BYTES = 100 * 1024 * 1024

/** Files that must never ship: source maps leak the whole codebase into the package. */
const EXCLUDED = ['*.map', '.DS_Store', '__MACOSX/*']

function fail(message) {
  console.error(`\n  ✗ ${message}\n`)
  process.exit(1)
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name)
      return entry.isDirectory() ? walk(path) : Promise.resolve([path])
    })
  )
  return files.flat()
}

function checkManifest() {
  const manifestPath = join(DIST, 'manifest.json')
  if (!existsSync(manifestPath)) fail('dist/manifest.json is missing. Run `pnpm build` first.')

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const problems = []

  if (manifest.manifest_version !== 3) problems.push('manifest_version must be 3')
  if (!manifest.name || manifest.name.length > 75) problems.push('name must be 1–75 characters')
  if (!manifest.description || manifest.description.length > 132) {
    problems.push(
      `description must be 1–132 characters (it is ${manifest.description?.length ?? 0})`
    )
  }
  if (!/^\d+(\.\d+){0,3}$/.test(manifest.version ?? '')) {
    problems.push(`version "${manifest.version}" must be 1–4 dot-separated integers`)
  }
  for (const size of ['16', '48', '128']) {
    if (!manifest.icons?.[size]) problems.push(`icons.${size} is missing`)
  }

  if (problems.length > 0) {
    fail(`The Chrome Web Store would reject this manifest:\n    - ${problems.join('\n    - ')}`)
  }
  return manifest
}

async function checkSourceMaps() {
  const maps = (await walk(DIST)).filter((file) => file.endsWith('.map'))
  if (maps.length > 0) {
    console.log(`  · excluding ${maps.length} source map${maps.length === 1 ? '' : 's'}`)
  }
}

function zip(outFile) {
  rmSync(outFile, { force: true })
  const args = ['-r', '-q', '-X', outFile, '.', '-x', ...EXCLUDED]
  try {
    execFileSync('zip', args, { cwd: DIST, stdio: 'inherit' })
  } catch (error) {
    if (error.code === 'ENOENT') fail('The `zip` command is not available on this machine.')
    throw error
  }
}

const manifest = checkManifest()
await checkSourceMaps()

mkdirSync(OUT_DIR, { recursive: true })
const outFile = join(OUT_DIR, `facet-${manifest.version}.zip`)
zip(outFile)

const bytes = statSync(outFile).size
if (bytes > MAX_ZIP_BYTES) {
  fail(`Package is ${(bytes / 1024 / 1024).toFixed(1)} MB; the store limit is 100 MB.`)
}

console.log(`\n  ✓ ${relative(ROOT, outFile)}  (${(bytes / 1024).toFixed(0)} KB)`)
console.log(`    ${manifest.name} ${manifest.version}`)
console.log(`\n  Upload at https://chrome.google.com/webstore/devconsole\n`)
