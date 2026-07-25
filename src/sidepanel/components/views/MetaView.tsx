import type { MetaData } from '@/audits/meta'
import { SEO_LIMITS } from '@/core/constants'
import { cn } from '@/lib/utils'
import { FacetHeader } from '../FacetHeader'
import { IssueList } from '../IssueList'
import { Section } from '../Section'
import type { FacetViewProps } from './types'

/** Character count against its recommended window, as a readable gauge. */
function LengthMeter({
  label,
  value,
  min,
  max,
}: {
  label: string
  value: string | null
  min: number
  max: number
}) {
  const length = value?.length ?? 0
  const withinRange = length >= min && length <= max
  const verdict =
    length === 0 ? 'missing' : withinRange ? 'good length' : length < min ? 'short' : 'long'

  return (
    <div className="flex items-center gap-2">
      <span className="w-[72px] shrink-0 eyebrow">{label}</span>
      <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
        <span
          className={cn(
            'block h-full rounded-full transition-[width] duration-500',
            withinRange ? 'bg-success' : length === 0 ? 'bg-muted' : 'bg-warning'
          )}
          style={{ width: `${Math.min(100, (length / max) * 100)}%` }}
        />
      </span>
      <span
        className={cn(
          'shrink-0 font-mono text-[11px]',
          withinRange ? 'text-muted-foreground' : 'text-warning'
        )}
      >
        {length}/{max}
        <span className="sr-only"> characters — {verdict}</span>
      </span>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="shrink-0 text-[13px] text-muted-foreground">{label}</dt>
      {/* Values here are the page's own strings, so they speak in mono. */}
      <dd
        className={cn(
          'min-w-0 truncate text-right font-mono text-xs',
          !value && 'text-muted-foreground italic'
        )}
      >
        {value || 'missing'}
      </dd>
    </div>
  )
}

export function MetaView({ result, onHighlight }: FacetViewProps) {
  const data = result.data as MetaData
  const og = new Map(data.openGraph.map((t) => [t.key, t.value]))
  const ogTitle = og.get('og:title') || data.title
  const ogDescription = og.get('og:description') || data.description

  return (
    <div className="space-y-3">
      <FacetHeader result={result} />

      <Section title="Search result preview">
        <div className="space-y-0.5">
          <p className="truncate font-mono text-[11px] text-muted-foreground">
            {data.canonical || og.get('og:url') || '—'}
          </p>
          {/* Google's own link color: the preview is only useful if it looks
              like the thing it is previewing. */}
          <p className="truncate text-base text-[#1a0dab] dark:text-[#8ab4f8]">
            {data.title || 'Untitled page'}
          </p>
          <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
            {data.description || 'No meta description provided.'}
          </p>
        </div>
        <div className="mt-3 space-y-2 border-t pt-3">
          <LengthMeter
            label="Title"
            value={data.title}
            min={SEO_LIMITS.titleMin}
            max={SEO_LIMITS.titleMax}
          />
          <LengthMeter
            label="Description"
            value={data.description}
            min={SEO_LIMITS.descriptionMin}
            max={SEO_LIMITS.descriptionMax}
          />
        </div>
      </Section>

      <Section title="Social card">
        {data.ogImage ? (
          <img
            src={data.ogImage}
            alt=""
            referrerPolicy="no-referrer"
            className="mb-2 aspect-[1.91/1] w-full rounded-sm border object-cover"
          />
        ) : (
          <p className="mb-2 flex aspect-[1.91/1] w-full items-center justify-center rounded-sm border border-dashed text-xs text-muted-foreground">
            No og:image
          </p>
        )}
        <p className="truncate text-[13px] font-semibold">{ogTitle || 'No title'}</p>
        <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
          {ogDescription || 'No description'}
        </p>
      </Section>

      <Section title="Essentials">
        <dl className="divide-y">
          <Row label="Language" value={data.lang} />
          <Row label="Viewport" value={data.viewport} />
          <Row label="Charset" value={data.charset} />
          <Row label="Robots" value={data.robots} />
          <Row
            label="Open Graph"
            value={data.openGraph.length ? `${data.openGraph.length} tags` : null}
          />
          <Row label="Twitter" value={data.twitter.length ? `${data.twitter.length} tags` : null} />
        </dl>
      </Section>

      <IssueList
        issues={result.issues}
        onHighlight={onHighlight}
        emptyLabel="Meta tags look good."
      />
    </div>
  )
}
