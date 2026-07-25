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

const STATUS_LABEL: Record<ImageStatus, string> = {
  ok: 'Has alt text',
  decorative: 'Decorative (alt="")',
  missing: 'Missing alt',
  flagged: 'Alt needs review',
}

function Thumb({
  image,
  onHighlight,
}: {
  image: ImageInfo
  onHighlight: (selector: string) => void
}) {
  const [broken, setBroken] = useState(false)
  const status = STATUS_LABEL[image.status]

  return (
    <li>
      <button
        type="button"
        onClick={() => onHighlight(image.selector)}
        aria-label={`${status}${image.alt ? `: “${image.alt}”` : ''}. Show on the page.`}
        className={cn(
          'flex aspect-square w-full items-center justify-center overflow-hidden rounded-sm bg-muted ring-2 transition-transform hover:scale-[1.04]',
          STATUS_RING[image.status]
        )}
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
          <ImageOff className="size-4 text-muted-foreground" aria-hidden />
        )}
      </button>
    </li>
  )
}

/** Ring color alone can't carry meaning, so the grid states its key. */
function Legend() {
  return (
    <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 border-t pt-2.5">
      {(Object.keys(STATUS_LABEL) as ImageStatus[]).map((status) => (
        <li key={status} className="flex items-center gap-1.5">
          <span
            className={cn('size-2 shrink-0 rounded-full ring-2 ring-inset', STATUS_RING[status])}
            aria-hidden
          />
          <span className="text-[11px] text-muted-foreground">{STATUS_LABEL[status]}</span>
        </li>
      ))}
    </ul>
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
          <>
            <ul className="grid grid-cols-4 gap-1.5">
              {data.images.map((image, index) => (
                <Thumb key={index} image={image} onHighlight={onHighlight} />
              ))}
            </ul>
            <Legend />
          </>
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
