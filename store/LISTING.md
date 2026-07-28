# Chrome Web Store listing

Everything the Developer Dashboard asks for, in the order it asks. Copy from
here into the form at
<https://chrome.google.com/webstore/devconsole>.

> Publishing requires a **one-time $5 developer registration fee** on the Google
> account you publish from. Pay it before your first submission.

---

## Store listing tab

### Name (max 75)

```
Facet: Accessibility & SEO Inspector
```

_36 characters._

### Summary / short description (max 132)

```
Audit headings, ARIA landmarks, contrast, meta/SEO, hreflang, alt text, links and JSON-LD from one side panel.
```

_106 characters. Matches `description` in the manifest, which is where the store
pre-fills this from._

### Detailed description (max 16,000)

```
Facet inspects every facet of a page — accessibility, SEO and structured data — from one side panel, and takes you straight to whatever is wrong.

Instead of running four extensions and reading four different reports, you open one panel next to the page you are working on and see all of it at once: a page score, a per-check profile, and a list of findings you can click to locate on the page.

WHAT IT CHECKS

• Headings — a full document outline, plus missing or duplicate <h1>, skipped levels, and empty headings.
• ARIA landmarks — landmark regions from both implicit and explicit roles: missing or duplicate main, unlabeled navigation, banner and contentinfo.
• Color contrast — text contrast against WCAG AA or AAA thresholds, resolving real backgrounds and translucent layers, with correct large-text rules.
• Meta & SEO — title, description, viewport, charset, lang, robots and canonical, with a search-result preview, character-count meters, and an Open Graph / Twitter card preview.
• Canonical — presence, self-reference versus cross-reference, duplicates, and relative or insecure URLs.
• Hreflang — language and region annotations: invalid tags, en-UK and other bad region codes, a missing self-reference, duplicate or shared targets, and a missing x-default.
• Images — missing alt, decorative alt="", filename-like or over-long alt text, shown as a status gallery.
• Links — links with no discernible text, empty or placeholder href, ambiguous "click here" text, and target="_blank" without rel="noopener".
• Structured data — JSON-LD validity and schema.org completeness for Article, Product, Recipe, Breadcrumb, FAQ, Organization and more: the fields Google needs for rich results.

FIND IT, THEN FIX IT

Every finding with a location has a crosshair button that scrolls to the element and outlines it on the live page. Copy the whole report as Markdown to paste straight into an issue or a pull request. Press Alt+Shift+F to re-scan without leaving the keyboard.

BUILT TO ITS OWN STANDARD

An accessibility tool should pass its own checks. Facet's panel is fully keyboard navigable with arrow-key movement through the facet rail, announces completed scans through a live region, gives every control an accessible name and every focusable element a visible focus ring, respects reduced-motion preferences, and carries no text below its WCAG AA contrast threshold in either light or dark theme — verified by pointing Facet's own contrast auditor at Facet.

PRIVATE BY CONSTRUCTION

Facet has no server, no analytics and no telemetry. It reads a page only while its panel is open, and nothing it reads ever leaves your browser. The only thing it stores is your own settings.

By default it makes no network requests at all. One optional setting, "Check hreflang URLs", is off unless you turn it on; with it on, Facet asks each hreflang URL already published in the page's own markup whether it responds, sends no cookies or credentials, and keeps only the status code. It is open source: read the code at https://github.com/jordan-davila/facet

NOTES

Facet cannot scan browser-internal pages such as chrome:// or the Chrome Web Store — no extension can. If a page was open before you installed Facet, reload it once so the content script attaches. Requires Chrome 123 or newer.
```

### Category

`Developer Tools`

### Language

`English (United States)`

---

## Graphic assets

| Asset              | Size              | Required                            | Source                                                   |
| ------------------ | ----------------- | ----------------------------------- | -------------------------------------------------------- |
| Store icon         | 128×128 PNG       | Yes                                 | `icons/icon128.png`                                      |
| Screenshots        | 1280×800 PNG, 1–5 | Yes (at least 1)                    | `pnpm store:shots` → `store/screenshots/`                |
| Small promo tile   | 440×280 PNG       | Only to be considered for featuring | `pnpm store:shots` → `store/screenshots/promo-small.png` |
| Marquee promo tile | 1400×560 PNG      | Optional                            | Not generated; only needed for the marquee slot          |

Screenshots are generated from the real panel with canned data, so they never
show a real user's browsing.

---

## Privacy tab

This is where most first submissions get delayed. Fill in every field.

### Single purpose description

```
Facet has a single purpose: to audit the accessibility, SEO and structured-data quality of the web page the user is currently viewing, and present the findings in a side panel.
```

### Permission justifications

Paste each into the matching field.

**`sidePanel`**

```
Facet's entire user interface is a side panel. This permission is required to open it.
```

**`activeTab`**

```
Facet audits the page the user is currently viewing. activeTab grants access to that tab when the user opens the panel, so the audit can read the page's headings, landmarks, colors, meta tags and structured data.
```

**`scripting`**

```
Facet's audit runs inside the page, because computed styles and real layout are only available there. If a tab was already open before Facet was installed, its content script is not present, so Facet uses scripting to inject the same audit script into that tab on demand.
```

**`tabs`**

```
Facet reads the active tab's URL, title and favicon to label the panel and to tell the user which page the report describes. It also listens for tab activation and navigation so the report can refresh when the user moves to a different page.
```

**`storage`**

```
Facet saves the user's own settings: theme, WCAG conformance level, which checks are enabled, the reported-issue limit, and whether to re-scan on navigation. No page content or browsing history is stored.
```

**Host permission (`http://*/*`, `https://*/*`)**

```
Facet is a page-inspection tool, so it must be able to run on whichever page the user chooses to inspect. It cannot know in advance which sites those are, and a fixed list would make the extension useless on the sites its users actually work on. Facet reads a page only while its side panel is open and uses what it reads solely to render the on-screen report; nothing read from a page is ever transmitted.

The host permission additionally covers one optional, user-enabled feature: a "Check hreflang URLs" setting, off by default, which requests the alternate-language URLs a page publishes in its own markup to report whether they respond. Those requests carry no credentials, retain only the HTTP status code, and go directly to the sites the inspected page names.
```

**Remote code**

Select **"No, I am not using remote code."** Everything Facet executes is bundled
in the package, including its fonts.

### Data usage

Tick **nothing** in the data-collection table, then check all three
certifications:

- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

### Privacy policy URL

```
https://github.com/jordan-davila/facet/blob/main/PRIVACY.md
```

The repository must be **public** before submitting, or reviewers cannot open
this URL and the submission is rejected.

---

## Distribution tab

- **Visibility:** Public (or Unlisted if you want to share by link first — you
  can change this later)
- **Distribution:** All regions, unless you have a reason to limit it
- **Pricing:** Free

Facet takes no payment. The tip-jar link in Settings
(`https://buymeacoffee.com/hi5n`) is an ordinary outbound link, which the Web
Store permits: it is not an in-app purchase, unlocks nothing, and no feature
depends on it. Leave the pricing set to Free.

---

## Before you submit

- [ ] Repository is public, so the privacy policy URL resolves
- [ ] `pnpm release` runs clean and produces `releases/facet-<version>.zip`
- [ ] Zip loaded via **Load unpacked** on a clean profile and manually smoke-tested
- [ ] At least one 1280×800 screenshot uploaded
- [ ] `SUPPORT_URL` in `src/core/links.ts` resolves (currently `https://buymeacoffee.com/hi5n`)
- [ ] $5 developer registration fee paid

Expect **a few days to a few weeks** for the first review. Broad host permissions
are the single biggest driver of review time, which is why the justification
above is specific about what is read and where it goes.
