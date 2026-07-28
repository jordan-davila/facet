import { cn } from '@/lib/utils'

/**
 * Facet's own mark: the same step-cut stone the toolbar icon draws, in SVG.
 *
 * The rail used to show lucide's stock `Gem` on a sapphire tile, which meant
 * the one place the brand mark appeared was the one place it wasn't the mark —
 * and it drifted to a different colour from the icon the moment that changed.
 * The geometry below mirrors scripts/generate-icons.mjs; change them together.
 */

/** Normalised (-1..1) cut geometry, mapped into a 0–24 viewBox. */
const TABLE_HALF = 0.34
const GIRDLE_HALF = 0.52
const TABLE_Y = -0.5
const GIRDLE_Y = -0.3
const CULET_Y = 0.54

const to = (n: number) => +((n + 1) * 12).toFixed(2)

const TABLE_L = to(-TABLE_HALF)
const TABLE_R = to(TABLE_HALF)
const GIRDLE_L = to(-GIRDLE_HALF)
const GIRDLE_R = to(GIRDLE_HALF)
const TOP = to(TABLE_Y)
const WAIST = to(GIRDLE_Y)
const TIP = to(CULET_Y)
const CENTRE = to(0)

const OUTLINE = [
  `${TABLE_L},${TOP}`,
  `${TABLE_R},${TOP}`,
  `${GIRDLE_R},${WAIST}`,
  `${CENTRE},${TIP}`,
  `${GIRDLE_L},${WAIST}`,
].join(' ')

const CUTS = [
  `M${TABLE_L},${TOP} L${TABLE_L},${WAIST}`,
  `M${TABLE_R},${TOP} L${TABLE_R},${WAIST}`,
  `M${GIRDLE_L},${WAIST} L${GIRDLE_R},${WAIST}`,
  `M${TABLE_L},${WAIST} L${CENTRE},${TIP}`,
  `M${TABLE_R},${WAIST} L${CENTRE},${TIP}`,
].join(' ')

/**
 * viewBox cropped to the stone's own bounds rather than the 0–24 square.
 *
 * The icon's geometry is sized for a canvas that needs breathing room around
 * it; reusing that square here left roughly half the tile as margin and the
 * stone looked shrunken. Cropping lets the tile provide the padding instead.
 */
const PAD = 0.6
const BOX_X = +(GIRDLE_L - PAD).toFixed(2)
const BOX_Y = +(TOP - PAD).toFixed(2)
const BOX_SIZE = +(GIRDLE_R - GIRDLE_L + PAD * 2).toFixed(2)

export function FacetMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex size-9 items-center justify-center rounded-md bg-linear-to-b from-mark-top to-mark-bottom',
        className
      )}
    >
      <svg
        viewBox={`${BOX_X} ${BOX_Y} ${BOX_SIZE} ${BOX_SIZE}`}
        className="size-[22px]"
        aria-hidden
      >
        <polygon points={OUTLINE} fill="#fff" />
        <path
          d={CUTS}
          stroke="var(--mark-bottom)"
          strokeWidth="1.3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className="sr-only">Facet</span>
    </span>
  )
}
