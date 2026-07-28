# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: Jordan's own team.** Web developers who audit accessibility and SEO as
part of building, not as a separate specialist job. They work with the page open
in front of them and need an answer without leaving it. Bill is the archetype:
he installed it, said it "will easily replace 2-3 different plug-ins I use," and
immediately asked for hreflang and readable alt text — the checks his actual work
runs into.

Facet is public on the Chrome Web Store and anyone may install it, but when a
priority is contested, the team's day-to-day workflow decides it.

**Secondary:** developers outside the team who find it in the store. Their needs
are served when they overlap with the team's; they do not outrank them.

## Product Purpose

Inspect every facet of a web page — accessibility, SEO, and structured data —
from one side panel, and take the user straight to whatever is wrong on the live
page.

Success is a developer keeping the panel open beside the page they are building
and fixing what it reports, instead of installing four single-purpose extensions
and reading four separate reports.

## Positioning

Consolidation plus locality. Competing tools each cover one facet (HeadingsMap,
a contrast checker, an SEO meta viewer, the Rich Results tester) and report in
their own idiom; Facet covers all of them in one panel, scores them on one
scale, and puts a crosshair on every finding that scrolls to and outlines the
element on the live page.

Two claims a neighbouring tool could not truthfully copy without doing the work:

- **It passes its own audit.** Facet's contrast auditor is pointed at Facet
  itself (`await facetSelfAudit()`), across every view in both themes, and the
  panel carries no text below its WCAG AA threshold and no unnamed control.
- **It reads nothing out.** Everything runs in the page and the panel; the only
  thing stored is the user's own settings.

## Operating Context

- Chrome side panel, open beside the page under inspection. Real width is
  320–500px; 400px is typical. The panel is never the whole screen.
- Used mid-build, with the page in a working state — not as a final pre-launch
  audit. Findings are acted on immediately, not filed.
- Reports get pasted into tickets and pull requests, which is why the whole
  report copies as Markdown.
- Cannot run on `chrome://` pages or the Chrome Web Store; no extension can.
  Pages open before install need one reload for the content script to attach.
- Feedback arrives informally, via colleagues in a Teams channel.

## Capabilities and Constraints

Nine checks: headings, ARIA landmarks, color contrast, meta/SEO, canonical,
hreflang, images, links, structured data.

- Manifest V3, Chrome 123+ (CSS `light-dark()`).
- React 19, TypeScript, Tailwind v4, shadcn/ui, Radix, Vite + CRXJS.
- The audit engine is pure and framework-free, and is the tested part of the
  codebase (135 tests). The React layer has no tests.
- `runAllAudits` is currently synchronous.
- Fonts are self-hosted; a CSP blocks any CDN at runtime.
- **Zero network requests today.** This is claimed in the privacy policy, the
  store listing, and the README. Approved to change for an hreflang reachability
  check, which must land as an opt-in setting that is off by default so the
  claim stays true for a default install, with all three documents updated.
- Settings persist to `chrome.storage.sync`.

## Brand Commitments

- **Name:** Facet. A gemological term; the product's language leans on it
  (facets, cut, profile, clarity) and the mark is a brilliant-cut stone.
- **Design direction:** "Loupe" — the panel is a measuring instrument, not a
  dashboard. Documented in DESIGN-adjacent detail in README.
- **Type system, treated as structure rather than styling:** Archivo (sans) is
  Facet speaking; IBM Plex Mono is the _inspected page_ speaking — tags, roles,
  selectors, URLs, JSON, and measured numbers. A reader can tell a string's
  origin at a glance. This rule is binding.
- **Color:** sapphire brand _in the panel_, deliberately outside the
  red/amber/green severity spectrum so it never competes with a finding. Beryl
  marks the "Good" score band because a 75–89 page still has work. Buy Me a
  Coffee's `#FFDD00` is used for the tip jar only.
- **The toolbar icon is violet**, not sapphire: a step-cut white stone on a
  violet-to-deep-violet gradient. This is a known and accepted divergence from
  the panel's brand colour — the icon competes for attention in a browser
  toolbar, where the panel is trying not to. Revisit only as a deliberate
  decision, not as a consistency cleanup.
- **The score gauge is a polygon with one edge per check**, derived from the
  facet list so the shape keeps counting correctly as checks are added.
- Open source, MIT, at <https://github.com/jordan-davila/facet>.

## Evidence on Hand

- Live listing: <https://chromewebstore.google.com/detail/plhlimcjnookfejnahfiadmjhcclkogj>
- Repository, public: <https://github.com/jordan-davila/facet>
- Real user feedback, one person (Bill), quoted above. **This is the only
  external feedback that exists.** There are no other testimonials, no install
  counts, no reviews, no benchmarks — future work must not invent them.
- `store/screenshots/` — five 1280×800 images plus a promo tile, rendered from
  the real panel by `pnpm store:shots`.
- `dev/` — a preview harness that runs the real panel against canned data, with
  forced loading/error/unsupported/clean states, and `facetSelfAudit()`.
- 135 passing tests over the audit engine.

## Product Principles

1. **The page is the subject; the panel is the instrument.** Nothing in the
   panel should compete with the page beside it for attention or color.
2. **Hold Facet to what Facet reports.** An accessibility tool that fails its
   own checks has no standing. The self-audit is the mechanism, not a slogan.
3. **A finding is only useful if you can reach it.** Every finding with a
   location gets a path to the element on the live page.
4. **Say what is true, including when it is inconvenient.** Zero network
   requests was a real constraint that shaped the product; changing it changes
   the published claims too.
5. **Free, with the door open.** No paid tier is planned and every check stays
   free, but do not foreclose one — avoid architecture that would make accounts
   or licensing impossible to add later.
6. **Accessibility and SEO are equal partners.** Neither side gets deeper
   treatment than the other; the pitch is genuinely both in one panel.

## Accessibility & Inclusion

WCAG 2.1 **AA is the floor Facet holds itself to**, verified mechanically rather
than asserted. AAA is available to users as a contrast setting but is not the
bar for Facet's own UI.

Established requirements for the panel itself:

- Every control has an accessible name; decorative icons are hidden.
- Visible focus ring on every focusable element.
- Roving arrow-key navigation through the facet rail; only the current item is
  in the tab order.
- Completed scans announced via a polite live region; failures via `role=alert`.
- Color is never the only signal — rail pips, image status, and JSON-LD field
  states all carry a text equivalent.
- `prefers-reduced-motion` respected in the panel and the page overlay.
- Redundant graphics (the facet profile chart) are hidden from assistive tech
  rather than duplicating the adjacent list's tab stops.
