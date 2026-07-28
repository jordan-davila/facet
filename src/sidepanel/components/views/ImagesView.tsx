import { ImageOff } from 'lucide-react'
import { useState } from 'react'
import type { ImageInfo, ImageStatus, ImagesData } from '@/audits/images'
import { cn } from '@/lib/utils'
import { FacetHeader } from '../FacetHeader'
import { IssueList } from '../IssueList'
import { Section } from '../Section'
import type { FacetViewProps } from './types'

const STATUS_RING: Record<ImageStatus, string> = {
  ok: 'ring-success',
  decorative: 'ring-border',
  missing: 'ring-destructive',
  flagged: 'ring-warning',
}

const STATUS_TEXT: Record<ImageStatus, string> = {
  ok: 'text-success',
  decorative: 'text-muted-foreground',
  missing: 'text-destructive',
  flagged: 'text-warning',
}

const STATUS_LABEL: Record<ImageStatus, string> = {
  ok: 'Has alt text',
  decorative: 'Decorative (alt="")',
  missing: 'Missing alt',
  flagged: 'Alt needs review',
}

/** What to print when there is no alt text worth quoting. */
const STATUS_PLACEHOLDER: Record<ImageStatus, string> = {
  ok: 'named by aria-label',
  decorative: 'intentionally empty',
  missing: 'no alt attribute',
  flagged: 'alt needs review',
}

function Thumb({ image }: { image: ImageInfo }) {
  const [broken, setBroken] = useState(false)
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-muted ring-2',
        STATUS_RING[image.status]
      )}
      aria-hidden
    >
      {image.src && !broken ? (
        <img
          src={image.src}
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          className="size-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <ImageOff className="size-4 text-muted-foreground" />
      )}
    </span>
  )
}

/**
 * A row per image, showing the alt text verbatim.
 *
 * A thumbnail grid can only tell you an image *has* alt text; judging whether
 * it is any good means reading it, so the words are the row's main content and
 * the picture is the supporting detail.
 */
function ImageRow({
  image,
  onHighlight,
}: {
  image: ImageInfo
  onHighlight: (selector: string) => void
}) {
  const hasAlt = Boolean(image.alt)
  const status = STATUS_LABEL[image.status]

  return (
    <li>
      <button
        type="button"
        onClick={() => onHighlight(image.selector)}
        aria-label={`${status}. ${
          hasAlt ? `Alt text: “${image.alt}”` : STATUS_PLACEHOLDER[image.status]
        }${image.note ? `. ${image.note}` : ''}. Show on the page.`}
        className="flex w-full items-start gap-2.5 rounded-sm p-1 text-left transition-colors hover:bg-accent/60"
      >
        <Thumb image={image} />
        <span className="min-w-0 flex-1 pt-0.5">
          {/* The alt text belongs to the page, so it speaks in mono. The
              placeholder is Facet talking, and stays in sans. */}
          {hasAlt ? (
            <span className="line-clamp-2 font-mono text-[11px] leading-snug">{image.alt}</span>
          ) : (
            <span className={cn('text-xs italic', STATUS_TEXT[image.status])}>
              {STATUS_PLACEHOLDER[image.status]}
            </span>
          )}
          {image.note && (
            <span className={cn('mt-0.5 block text-[11px]', STATUS_TEXT[image.status])}>
              {image.note}
            </span>
          )}
        </span>
        {hasAlt && (
          <span className="shrink-0 pt-1.5 eyebrow tabular-nums" aria-hidden>
            {image.alt?.length}
          </span>
        )}
      </button>
    </li>
  )
}

export function ImagesView({ result, onHighlight }: FacetViewProps) {
  const data = result.data as ImagesData
  return (
    <div className="space-y-3">
      <FacetHeader result={result} />
      <Section title={`Images (${data.total})`}>
        {data.images.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No images on this page.</p>
        ) : (
          <ul className="-mx-1 flex flex-col divide-y">
            {data.images.map((image, index) => (
              <ImageRow key={index} image={image} onHighlight={onHighlight} />
            ))}
          </ul>
        )}
      </Section>
      <IssueList
        issues={result.issues}
        onHighlight={onHighlight}
        emptyLabel="Every image has appropriate alt text."
      />
    </div>
  )
}
