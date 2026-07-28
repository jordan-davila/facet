# Changelog

All notable changes to Facet are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
Facet uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Only versions published to the Chrome Web Store carry a date. Versions built but
never uploaded are marked _unreleased_, because a version number nobody can
install is not a release.

> **The store is currently on 1.0.0.** Everything from 1.0.1 onward is built,
> tested and tagged, but has not been submitted. Users have none of it — most
> relevantly the hreflang region fix in 1.3.1 and the accessible-name fix in
> 1.1.1.

## [1.3.2] — _unreleased_

### Changed

- Rewrote the store listing: a short description written for store search, and a
  detailed description covering all nine checks, the score delta, and the
  optional network request.
- Refreshed the store screenshots. They had still shown 1.0.0 — the old icon, no
  hreflang, and the previous Overview layout.
- Store screenshots are now Overview, Contrast, Meta, Images and Hreflang. The
  store allows five; Headings and Structured Data were dropped as the two that
  sell the tool least.

## [1.3.1] — _unreleased_

### Fixed

- **Lowercase hreflang region subtags were reported as errors.** `en-ca` and
  `en-us` are valid — BCP-47 tags are case-insensitive and Google says so
  explicitly for hreflang — but the pattern required an uppercase region, so
  Facet flagged correct markup as broken on real sites. Present in 1.1.0
  through 1.3.0. If you audited hreflang in that window, re-check those pages.
- The SEO length meter's label overran its box, so "DESCRIPTION" collided with
  the bar, and the bar itself stretched into the character count.

## [1.3.0] — _unreleased_

### Added

- **Hreflang reachability**, off by default. When enabled, Facet requests each
  annotated URL and reports 4xx/5xx as errors, redirects as warnings, and a
  request that never completed as a warning — a failure from inside an
  extension is as likely to be a bot filter as a broken page.
  This is the only feature that makes a network request. It sends no cookies or
  credentials and keeps only the status code.
- **Score delta.** After re-scanning the same page, the Overview shows how the
  score moved and announces it. The gauge had animated over 700ms since it was
  built with nothing to animate.

### Changed

- Overview collapsed from four summary devices to two. Every check now fits on
  one screen without scrolling.
- `--warning` and `--success` darkened; both cleared 4.5:1 against the page
  background but not against muted surfaces.

### Added (development)

- `tests/design-tokens.test.ts` reads the stylesheet and asserts every severity
  color clears 4.5:1 on background, card and muted, and carries its own
  foreground as a fill. The comment in `globals.css` had asserted this contract
  from the start while two pairs quietly failed it.

## [1.2.3] — _unreleased_

### Fixed

- The 16px icon was a different drawing from every other size. Small sizes had
  swapped in a plain silhouette on the theory that cut lines turn to mush; the
  real cause was the stone occupying half the canvas. Every size now draws the
  same mark, with an optical upscale at 16.
- The rail's mark reused the icon's viewBox, which is sized to give the icon
  breathing room, leaving half the tile as margin and the stone looking shrunken.

## [1.2.2] — _unreleased_

### Changed

- The rail logo is now Facet's actual mark rendered in SVG, not lucide's stock
  `Gem` on a sapphire tile. The one place the brand mark appeared was the one
  place it wasn't the mark.

## [1.2.1] — _unreleased_

### Changed

- New toolbar icon: a white step-cut stone on a violet gradient. The icon is
  deliberately not the panel's sapphire — it competes for attention in a browser
  toolbar, where the panel is trying not to.

## [1.2.0] — _unreleased_

### Fixed

- **"All clear" was shown on facets that had findings.** The badge counted only
  errors and warnings, so a green badge sat directly above an info-level
  finding. Info-only facets now read "1 note".
- **The crosshair failed silently.** If the selector no longer matched, clicking
  did nothing and said nothing. It now reports that the element is gone. The
  control was also promoted from a 12px muted glyph to a real button.
- Overlapping scans were dropped rather than superseded, so changing a setting
  mid-scan stranded the panel on results from the settings you had just moved
  away from.
- The "Max reported issues" field clamped on every keystroke, turning "1" into
  the minimum before the second digit arrived.
- Turning a check off left a live rail icon leading to a dead end with no way to
  turn it back on.
- "Reset to defaults" wiped every setting on one unconfirmed click. It now
  offers Undo.
- The tip jar sat between the rail and the panel's controls in the tab order.
- Engraved captions moved from 10px to 11px, below which small functional
  labels stop being legible.

## [1.1.1] — _unreleased_

### Fixed

- **Ten Settings switches had no accessible name.** Radix renders Switch and
  Select as `<button>`, and per HTML-AAM a button is named by its own content —
  `<label for>` names inputs, not buttons. Clicking the label toggled the switch,
  so it looked correctly wired, but a screen reader announced "switch, on" with
  no indication of which check. The self-audit had scored `label[for]` as
  sufficient and reported clean; it no longer does.

## [1.1.0] — _unreleased_

### Added

- **Hreflang** check: invalid language tags, region codes that do not exist
  (`en-UK` should be `en-GB`), a missing self-reference, duplicate or shared
  targets, and a missing `x-default`.
- **Image alt text is quoted verbatim** with its character count. The thumbnail
  grid could only say an image *had* alt text; judging whether it is any good
  means reading it.

### Fixed

- The icon's rounded-square mask cut transparent notches out of all four
  straight edges, so the mark rendered as a cross. This is why the original icon
  looked wrong.

### Changed

- The score gauge derives its side count from the facet list. It was an octagon
  justified as "eight sides for eight checks", which adding a ninth made untrue.

## [1.0.2] — _unreleased_

### Added

- Buy Me a Coffee link in the rail and in Settings, in the platform's own brand
  yellow, with a border that gives the tile a perceivable edge on a light rail.

## [1.0.1] — _unreleased_

### Changed

- The support link moved from a footnote under the version number into its own
  Support section with a real button.

## [1.0.0] — 2026-07-27

First release on the Chrome Web Store.

### Added

- Eight checks in one Manifest V3 side panel: headings, ARIA landmarks, color
  contrast, meta/SEO, canonical, images, links and JSON-LD structured data.
- A crosshair on every finding with a location, which scrolls to the element and
  outlines it on the live page.
- Copy the whole report as Markdown, for pasting into an issue or pull request.
- `Alt+Shift+F` to re-scan, remappable at `chrome://extensions/shortcuts`.
- Light, dark and system themes.
- No server, no analytics, no telemetry, and no network requests.

[1.3.2]: https://github.com/jordan-davila/facet/releases/tag/v1.3.2
[1.3.1]: https://github.com/jordan-davila/facet/releases/tag/v1.3.1
[1.3.0]: https://github.com/jordan-davila/facet/releases/tag/v1.3.0
[1.2.3]: https://github.com/jordan-davila/facet/releases/tag/v1.2.3
[1.2.2]: https://github.com/jordan-davila/facet/releases/tag/v1.2.2
[1.2.1]: https://github.com/jordan-davila/facet/releases/tag/v1.2.1
[1.2.0]: https://github.com/jordan-davila/facet/releases/tag/v1.2.0
[1.1.1]: https://github.com/jordan-davila/facet/releases/tag/v1.1.1
[1.1.0]: https://github.com/jordan-davila/facet/releases/tag/v1.1.0
[1.0.2]: https://github.com/jordan-davila/facet/releases/tag/v1.0.2
[1.0.1]: https://github.com/jordan-davila/facet/releases/tag/v1.0.1
[1.0.0]: https://github.com/jordan-davila/facet/releases/tag/v1.0.0
