/** Parse an HTML string into a Document for auditor tests. */
export function parse(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}

/** Wrap body markup in a minimal, valid HTML document. */
export function parseBody(
  inner: string,
  head = '<title>A reasonably sized page title</title>'
): Document {
  return parse(`<!doctype html><html lang="en"><head>${head}</head><body>${inner}</body></html>`)
}
