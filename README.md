# Facet

A Manifest V3 Chrome extension that inspects **every facet of a page** from one
side panel — accessibility, SEO, and structured data — and lets you jump
straight to the offending element on the page.

Facet bundles the checks you normally reach for several extensions to run
(HeadingsMap, a contrast checker, an SEO meta viewer, a Rich Results tester)
into a single dashboard built with [shadcn/ui](https://ui.shadcn.com).

## What it checks

| Facet               | What Facet looks at                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Headings**        | A HeadingsMap-style document outline, plus missing/duplicate `<h1>`, skipped levels and empty headings.                                                        |
| **Landmarks**       | WAI-ARIA landmark regions (implicit and explicit roles): missing/duplicate `main`, unlabeled navigation, banner/contentinfo.                                   |
| **Contrast**        | Text color contrast against **WCAG AA or AAA** thresholds, resolving real backgrounds and alpha compositing, with large-text rules.                            |
| **Meta & SEO**      | Title, description, viewport, charset, `lang`, robots, canonical, plus a search-result preview, Open Graph and Twitter card preview.                           |
| **Canonical**       | Canonical link presence, self-reference vs. cross-reference, duplicates, relative/`http` URLs.                                                                 |
| **Hreflang**        | Language and region annotations: invalid tags, bad region codes (`en-UK`), a missing self-reference, duplicate or shared targets, and a missing `x-default`.   |
| **Images**          | Missing `alt`, decorative (`alt=""`), filename-like or over-long alt text — shown as a status gallery.                                                         |
| **Links**           | Links with no discernible text, empty/placeholder `href`, ambiguous ("click here") text, and `target="_blank"` without `rel="noopener"`.                       |
| **Structured Data** | JSON-LD validity and schema.org completeness for Article, Product, Recipe, Breadcrumb, FAQ, Organization, and more — the fields Google needs for rich results. |

Every finding with a location shows a **crosshair** button that scrolls to and
outlines the element on the live page. An **Overview** tab rolls the facets up
into a page score, and a **Settings** panel lets you pick AA/AAA, choose a
theme, and toggle individual checks.

Press **Alt+Shift+F** to scan the current page (remappable at
`chrome://extensions/shortcuts`), and use **Copy report** in the header to put
the whole report on the clipboard as Markdown, ready to paste into an issue.

## Tech stack

- **Manifest V3** side panel (Chrome 123+, for CSS `light-dark()`)
- **React 19** + **TypeScript** + **Tailwind CSS 4**
- **shadcn/ui** (new-york) + Radix primitives + lucide icons
- **Vite 8** + **CRXJS** build, **pnpm** package manager
- **Vitest** + jsdom for the audit engine

## Build & install

```bash
pnpm install
pnpm build          # outputs to dist/
```

Then load it into Chrome:

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked** and select the `dist/` folder.
4. Click the Facet toolbar icon on any web page to open the side panel.

For development with hot-reload:

```bash
pnpm dev            # then Load unpacked → dist/
```

To work on the UI without reloading the extension, run the design preview — the
real side panel driven by canned audit data in a plain browser tab:

```bash
pnpm dev:preview    # http://localhost:5175/dev/index.html
```

The preview frames the panel at its real width (with 320/400/500/750 presets)
and can force the states that are awkward to reach by hand:
`?state=loading | error | unsupported | clean`.

> Facet cannot scan browser-internal pages (`chrome://`, the Web Store, etc.).
> If a normal page was open **before** Facet was installed, reload it once so
> the content script attaches.

## Development

```bash
pnpm typecheck      # tsc --noEmit
pnpm test           # run the unit suite
pnpm coverage       # unit suite + coverage report
pnpm format         # prettier
pnpm icons          # regenerate the gem icons
pnpm dev:preview    # side panel with canned data, for design work
```

## Project structure

```
src/
├── audits/          # the audit engine (pure, framework-free, unit-tested)
│   ├── color.ts         # WCAG contrast maths
│   ├── contrast.ts      # color-contrast auditor
│   ├── headings.ts      # heading outline + structure
│   ├── landmarks.ts     # ARIA landmark detection
│   ├── meta.ts          # title / description / OG / Twitter
│   ├── canonical.ts     # canonical link
│   ├── images.ts        # alt-text quality
│   ├── links.ts         # link accessibility
│   ├── jsonld.ts        # JSON-LD structured data
│   ├── schema-defs.ts   # schema.org field requirements
│   └── index.ts         # runAllAudits() orchestrator
├── content/         # content script: runs audits + highlights elements
├── core/            # shared types, messages, settings, scoring, report export
├── sidepanel/       # the React + shadcn side-panel UI
│   ├── components/       # sidebar, header, views, issue list…
│   └── hooks/            # useScan, useSettings
├── components/ui/   # shadcn/ui primitives
├── background.ts    # opens the side panel on toolbar click
├── assets/fonts/    # self-hosted Archivo + IBM Plex Mono (no CDN at runtime)
└── styles/          # Tailwind 4 tokens

dev/                 # design preview harness + self-audit (never shipped)
```

## Design

The panel is treated as a measuring instrument rather than a dashboard.

- **Two voices, one rule.** Archivo (sans) is Facet speaking — labels, headings,
  prose. IBM Plex Mono is the _inspected page_ speaking — tags, roles,
  selectors, URLs, JSON, and every measured number. That split makes a string's
  origin readable at a glance, so it is treated as structure, not styling.
- **Sapphire brand, severity palette untouched.** The primary sits in blue so it
  never competes with red / amber / green for attention. A fifth color, beryl,
  marks the "Good" score band — a page scoring 75–89 still has findings, and
  painting it the same green as a clean page would quietly say otherwise.
- **The gauge is a polygon with one edge per check**, because a shape that
  counts says what is being measured where a circle says nothing. The side
  count is derived from the facet list, so it stays true as checks are added.
  The **facet profile** below it is one bar per facet, height by score.
- **Themes are declared once** with CSS `light-dark()`, and Tailwind's `dark:`
  variant is redefined to fire on the same signal, so an explicit Light choice
  on a dark-mode OS can't leave dark-only rules behind.

Both themes carry no text below its WCAG AA threshold and every control has an
accessible name — verified by pointing Facet's own contrast auditor at Facet.
Run `await facetSelfAudit()` in the preview console: it walks all ten views in
both themes and reports contrast failures and unnamed controls. Same code path,
same thresholds it applies to the pages it inspects.

## Accessibility

Facet is an accessibility tool, so the panel meets the bar it measures:

- Every icon-only control has an `aria-label`; decorative icons are `aria-hidden`.
- The facet rail is a labeled `<nav>` with roving tab order — arrow keys, Home
  and End move between facets, and only the current one is in the tab sequence.
- Completed scans are announced through a polite live region ("Scan complete.
  Page score 76 out of 100. 3 errors · 4 warnings."); failures use `role="alert"`.
- Color is never the only signal: rail pips, image-status rings and JSON-LD
  field icons all carry a text equivalent.
- A visible focus ring is guaranteed for every focusable element, and
  `prefers-reduced-motion` is respected in the panel and in the page overlay.
- The keyboard shortcut goes through Chrome's `commands` API, so it is
  remappable — which is what keeps it clear of WCAG 2.1.4.
- The facet profile chart is hidden from assistive tech on purpose: the Checks
  list below states the same scores in words and is the keyboard path to
  each facet, so exposing both would double every tab stop to reach the same
  destinations.

## How it works

The **content script** runs the audit engine (`src/audits`) directly against the
live DOM — the only place with access to `getComputedStyle`, real layout, and
structured-data scripts. The **side panel** asks the active tab to scan, then
renders the report. Element highlighting is a message back to the content
script, which draws a page-CSS-proof overlay.

The audit engine has no DOM-framework dependencies and is covered by a Vitest
suite (contrast maths, scoring, and every auditor).

## Notes & limitations

- Contrast checking resolves solid background colors and translucent layers,
  but skips text over **background images or gradients** (reported as
  "undetermined") since the effective color can't be sampled reliably.
- Link checking is structural; it does not fetch URLs to detect HTTP 404s
  (cross-origin requests aren't available from the page context).
- Structured-data validation covers the common schema.org types used for rich
  results; unrecognized types are surfaced but not validated.

## Publishing to the Chrome Web Store

The listing copy, permission justifications and a pre-submission checklist live
in [`store/LISTING.md`](store/LISTING.md). The privacy policy is
[`PRIVACY.md`](PRIVACY.md) — the repository must be public before submitting, or
reviewers cannot open the URL the listing points at.

```bash
pnpm release        # typecheck + test + build + zip into releases/
pnpm store:shots    # 1280x800 screenshots + 440x280 promo tile
```

`pnpm package` validates the built manifest against the store's own limits
(name ≤ 75 chars, description ≤ 132, version format, required icon sizes) and
refuses to produce an archive it knows would be rejected. Source maps are
excluded from the package.

Screenshots are rendered from the real panel with canned data by driving
`dev/shots.html` in headless Chrome, so they cannot drift from the product and
never show anyone's real browsing. They need a local Chrome or Chromium; set
`CHROME_PATH` if it is somewhere unusual.

Publishing requires a one-time **$5 developer registration fee** on the Google
account you publish from.

## Supporting Facet

Facet is free, takes no payment, and has no paid tier — every check works the
same whether you tip or not.

If it saved you some time, there's a tip jar:
[buymeacoffee.com/hi5n](https://buymeacoffee.com/hi5n). The link also lives in
the panel's Settings, under About.

The URL is a single constant, `SUPPORT_URL` in
[`src/core/links.ts`](src/core/links.ts). Setting it to an empty string removes
the button entirely.

## Changelog

Version history is in [CHANGELOG.md](CHANGELOG.md), including which versions are
actually published to the Chrome Web Store and which are only built.

## License

MIT © Jordan Davila
