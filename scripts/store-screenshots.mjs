#!/usr/bin/env node
// Render Chrome Web Store screenshots from the real panel.
//
// Drives the dev/shots.html stage in headless Chrome at the store's exact pixel
// dimensions, so the images are deterministic and can never drift from the
// product — they ARE the product, rendered.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import puppeteer from 'puppeteer-core'

const ROOT = resolve(import.meta.dirname, '..')
const OUT_DIR = join(ROOT, 'store', 'screenshots')
const ORIGIN = 'http://localhost:5176'
const STAGE = `${ORIGIN}/dev/shots.html`

/** Chrome Web Store screenshot dimensions. 1280x800 is the larger of the two allowed. */
const SCREENSHOT = { width: 1280, height: 800 }

/** Small promotional tile, used only if the item is considered for featuring. */
const PROMO = { width: 440, height: 280 }

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean)

function findChrome() {
  const path = CHROME_CANDIDATES.find((candidate) => existsSync(candidate))
  if (!path) {
    console.error('\n  ✗ Could not find Chrome. Set CHROME_PATH to its executable.\n')
    process.exit(1)
  }
  return path
}

/** Start the preview server and resolve once it answers. */
async function startServer() {
  const server = spawn(
    'node_modules/.bin/vite',
    ['--config', 'dev/vite.config.ts', '--port', '5176', '--strictPort'],
    { cwd: ROOT, stdio: 'ignore' }
  )
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(STAGE)
      if (response.ok) return server
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  server.kill()
  throw new Error('Preview server did not start.')
}

const server = await startServer()
const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: true,
  // deviceScaleFactor 1: the store wants exactly 1280x800, not a 2x image.
  defaultViewport: { ...SCREENSHOT, deviceScaleFactor: 1 },
  args: ['--force-color-profile=srgb', '--hide-scrollbars'],
})

try {
  mkdirSync(OUT_DIR, { recursive: true })
  const page = await browser.newPage()
  await page.goto(STAGE, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => 'showSlide' in window)

  const names = await page.evaluate(() => window.slideNames)

  for (const [index, name] of names.entries()) {
    await page.evaluate((slide) => window.showSlide(slide), name)
    const file = join(OUT_DIR, `${String(index + 1).padStart(2, '0')}-${name}.png`)
    await page.screenshot({ path: file, type: 'png' })
    console.log(`  · ${relative(ROOT, file)}  ${SCREENSHOT.width}x${SCREENSHOT.height}`)
  }

  // Promo tile reuses the same stage in its compact form.
  await page.setViewport({ ...PROMO, deviceScaleFactor: 1 })
  await page.evaluate(() => {
    document.body.classList.add('promo')
    document.getElementById('eyebrow').textContent = 'Accessibility & SEO'
    document.getElementById('headline').textContent = 'Facet'
    document.getElementById('subhead').textContent = 'Every facet of a page, in one side panel.'
  })
  const promoFile = join(OUT_DIR, 'promo-small.png')
  await page.screenshot({ path: promoFile, type: 'png' })
  console.log(`  · ${relative(ROOT, promoFile)}  ${PROMO.width}x${PROMO.height}`)

  console.log(`\n  ✓ ${names.length + 1} images in ${relative(ROOT, OUT_DIR)}\n`)
} finally {
  await browser.close()
  server.kill()
}
