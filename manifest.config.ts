import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'
// Relative, not aliased: this config is evaluated before Vite's alias exists.
import { REPOSITORY_URL } from './src/core/links'

const ICONS = {
  '16': 'icons/icon16.png',
  '32': 'icons/icon32.png',
  '48': 'icons/icon48.png',
  '128': 'icons/icon128.png',
}

/** The Chrome Web Store rejects anything longer, and only at upload time. */
const MAX_DESCRIPTION = 132

/**
 * Store-facing summary. Deliberately not package.json's description: this one
 * is written for store search (US spelling, the terms people actually type)
 * and must fit the store's limit, which package.json has no reason to respect.
 */
const DESCRIPTION =
  'Accessibility and SEO audit in one side panel: contrast, headings, ARIA, alt text, meta, hreflang and structured data.'

if (DESCRIPTION.length > MAX_DESCRIPTION) {
  throw new Error(
    `Extension description is ${DESCRIPTION.length} characters; the Chrome Web Store allows ${MAX_DESCRIPTION}.`
  )
}

export default defineManifest({
  manifest_version: 3,
  name: 'Facet: Accessibility & SEO Inspector',
  version: pkg.version,
  description: DESCRIPTION,
  homepage_url: REPOSITORY_URL,
  minimum_chrome_version: '123',
  permissions: ['sidePanel', 'scripting', 'activeTab', 'tabs', 'storage'],
  host_permissions: ['http://*/*', 'https://*/*'],
  background: { service_worker: 'src/background.ts', type: 'module' },
  action: {
    default_title: 'Open Facet',
    default_icon: ICONS,
  },
  side_panel: { default_path: 'src/sidepanel/index.html' },
  // Remappable at chrome://extensions/shortcuts, which is what keeps this
  // clear of WCAG 2.1.4 (character key shortcuts).
  commands: {
    rescan: {
      suggested_key: { default: 'Alt+Shift+F', mac: 'Alt+Shift+F' },
      description: 'Scan the current page with Facet',
    },
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
      all_frames: false,
    },
  ],
  icons: ICONS,
})
