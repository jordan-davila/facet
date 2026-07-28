# Privacy Policy for Facet

**Last updated: 25 July 2026**

Facet is a Chrome extension that inspects the accessibility and SEO of web pages
you are already viewing. This policy describes what it does and does not do with
your data.

## The short version

**Facet collects nothing.** It has no server, no analytics, no telemetry, no
crash reporting, and no advertising. Nothing it reads about a page ever leaves
your browser.

By default Facet makes **no network requests at all**. One optional setting,
described below, is the single exception, and it is off unless you turn it on.

## What Facet reads

When you open the side panel on a page, Facet runs its checks inside that page
and reads only what it needs to report on:

- The page's headings, ARIA landmark regions, links, images and `alt` text
- Computed text and background colors, to measure contrast ratios
- `<meta>` tags, the `<title>`, the `lang` attribute and the canonical link
- JSON-LD structured data embedded in the page
- The active tab's URL, title and favicon, to label the panel

All of this is read in memory, used to render the report, and discarded when the
panel closes or scans again. **None of it is transmitted anywhere.**

## The one optional network request

Settings has a **"Check hreflang URLs"** switch, **off by default**. Leave it off
and Facet never touches the network.

Turn it on and, when a page carries `hreflang` annotations, Facet asks each
annotated URL whether it responds — the same thing a search engine does, and the
only way to tell a working alternate page from a broken one.

- It requests **only the URLs already published in that page's own markup**.
- It sends **no cookies or credentials** (`credentials: 'omit'`), and no
  information about you, your browsing, or the page you are on.
- It uses `HEAD` where the server allows it, so usually no page body is
  transferred at all.
- It keeps **only the HTTP status code** — 200, 404, and so on. Response bodies
  are discarded and never stored.
- It is capped at 40 URLs per scan with an 8-second timeout each.

Those requests go directly from your browser to the sites the page names. They do
not pass through any server belonging to Facet, because there isn't one.

## What Facet stores

Facet stores only your own settings — your theme, WCAG conformance level, which
checks are turned on, the reported-issue limit, and whether to re-scan on
navigation.

These are saved with Chrome's `storage.sync` API. If you are signed in to Chrome
with sync enabled, Chrome will sync them across your devices as part of your
Google account, under Google's privacy policy rather than this one. Facet has no
access to that sync channel beyond reading and writing its own settings.

**No page content, URL, or scan result is ever stored.**

## Permissions, and why each is needed

| Permission                                           | Why Facet needs it                                                                                                                                                                                             |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sidePanel`                                          | Facet's entire interface is a side panel.                                                                                                                                                                      |
| `activeTab`                                          | Read the current tab so the panel can scan the page you are looking at.                                                                                                                                        |
| `scripting`                                          | Inject the audit script into pages that were already open before Facet was installed.                                                                                                                          |
| `tabs`                                               | Read the active tab's URL, title and favicon to label the panel, and detect navigation so the report can refresh.                                                                                              |
| `storage`                                            | Save your settings.                                                                                                                                                                                            |
| Access to all websites (`http://*/*`, `https://*/*`) | Facet must be able to run on whichever page you choose to inspect. It cannot know in advance which sites those are. It reads a page only while its side panel is open, and never sends what it reads anywhere. |

## Third parties

Facet has no third-party dependencies at runtime. It bundles its own fonts, so
it does not contact a font CDN. It does not embed analytics, tracking pixels, or
advertising SDKs. No data is sold, shared, or transferred to anyone, for any
purpose.

## Optional support link

Facet's settings may include an optional link to a third-party donation page. It
is an ordinary link: nothing is sent when the panel loads, and following it is
entirely your choice. If you do follow it, that third party's own privacy policy
applies to your visit.

## Children

Facet is a developer tool. It is not directed at children and collects no
personal information from anyone, including children.

## Changes

If this policy changes, the revised version will be published at this URL with an
updated date above.

## Contact

Questions or concerns: please open an issue at
<https://github.com/jordan-davila/facet/issues>.
