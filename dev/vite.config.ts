import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const repoRoot = resolve(import.meta.dirname, '..')

/**
 * Standalone preview server — no crx plugin, so the panel runs in a plain tab.
 * Root stays at the repo so Tailwind's source detection sees src/.
 */
export default defineConfig({
  root: repoRoot,
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': resolve(repoRoot, 'src') } },
  server: { port: 5175, strictPort: true, open: '/dev/index.html' },
})
