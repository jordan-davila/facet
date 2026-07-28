import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/sidepanel/App'
import '@/styles/globals.css'
import { installChromeStub } from './chrome-stub'

/**
 * Store-screenshot stage. Renders the real panel — same components, same
 * styles — beside a caption, so the images can never drift from the product.
 */

interface Slide {
  /** Rail item to open, matched against its aria-label. */
  view: string
  eyebrow: string
  headline: string
  subhead: string
  theme?: 'light' | 'dark'
}

const SLIDES: Record<string, Slide> = {
  overview: {
    view: 'Overview',
    eyebrow: 'One panel',
    headline: 'Every facet of a page, in one panel',
    subhead:
      'A page score, a per-check profile, and every audit at a glance — instead of four extensions and four reports.',
  },
  contrast: {
    view: 'Contrast',
    eyebrow: 'WCAG AA / AAA',
    headline: 'Contrast measured against real backgrounds',
    subhead:
      'Resolves translucent layers and computed colors, applies the correct large-text rule, and tells you what each failing sample needs.',
  },
  headings: {
    view: 'Headings',
    eyebrow: 'Structure',
    headline: 'The outline a screen reader actually hears',
    subhead:
      'Skipped levels, empty headings and duplicate h1s, with a crosshair on every finding to locate it on the live page.',
  },
  meta: {
    view: 'Meta',
    eyebrow: 'SEO',
    headline: 'See the result before Google does',
    subhead:
      'Search-result and social-card previews, character-count meters for title and description, and every essential meta tag in one place.',
    theme: 'light',
  },
  structured: {
    view: 'Structured',
    eyebrow: 'Rich results',
    headline: 'JSON-LD, checked field by field',
    subhead:
      'schema.org validity and completeness for the types Google needs, with the required and recommended fields marked off.',
  },
}

function applySlide(slide: Slide): void {
  document.getElementById('eyebrow')!.textContent = slide.eyebrow
  document.getElementById('headline')!.textContent = slide.headline
  document.getElementById('subhead')!.textContent = slide.subhead
  const theme = slide.theme ?? 'dark'
  document.documentElement.setAttribute('data-theme', theme)
  // The frame's own fill and fade must match the panel it holds.
  document.body.classList.toggle('light-frame', theme === 'light')
}

/** Generous: a frame captured mid-transition shows half-faded text. */
const SETTLE_MS = 700

/**
 * Wait for the render, the fonts, and every running transition. Theme changes
 * cross-fade colors, so capturing too early photographs the fade.
 */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, SETTLE_MS))
  await document.fonts.ready
  // Raced against a deadline: looping animations never finish.
  await Promise.race([
    Promise.allSettled(document.getAnimations().map((animation) => animation.finished)),
    new Promise((resolve) => setTimeout(resolve, SETTLE_MS)),
  ])
}

async function openView(view: string): Promise<void> {
  const button = [...document.querySelectorAll<HTMLButtonElement>('nav button')].find((b) =>
    b.getAttribute('aria-label')?.startsWith(view)
  )
  button?.click()
}

async function showSlide(name: string): Promise<void> {
  const slide = SLIDES[name]
  if (!slide) throw new Error(`Unknown slide: ${name}`)
  applySlide(slide)
  await openView(slide.view)
  await settle()
}

installChromeStub('ready')

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

Object.assign(window, { showSlide, slideNames: Object.keys(SLIDES) })
