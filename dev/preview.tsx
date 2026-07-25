import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/sidepanel/App'
import '@/styles/globals.css'
import { type PreviewState, installChromeStub } from './chrome-stub'
import { selfAudit } from './self-audit'

// Design preview: the real side panel, fed canned data, at side-panel width.
// ?state=loading|error|unsupported|clean forces the states that are otherwise
// awkward to reach by hand.
const state = (new URLSearchParams(location.search).get('state') ?? 'ready') as PreviewState
installChromeStub(state)

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Facet auditing Facet: run `await facetSelfAudit()` in the preview console.
Object.assign(window, { facetSelfAudit: selfAudit })
