import { Coffee, Gem } from 'lucide-react'
import { useRef } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SUPPORT_URL, hasSupportLink } from '@/core/links'
import type { AuditReport } from '@/core/types'
import { cn } from '@/lib/utils'
import { type NavId, type NavItem, PRIMARY_NAV, SETTINGS_NAV, isFacetId } from '../lib/nav'
import { findingsSummary } from '../lib/score'

interface SidebarProps {
  active: NavId
  onSelect: (id: NavId) => void
  report: AuditReport | null
}

/** A facet missing from a finished report is one the user turned off. */
function isTurnedOff(report: AuditReport | null, id: NavId): boolean {
  if (!report || !isFacetId(id)) return false
  return !report.results.some((r) => r.facet === id)
}

interface Marker {
  className: string
  /** Spoken suffix, so the dot is never the only carrier of the state. */
  description: string
}

/** Red pip when a facet has errors, amber when only warnings, otherwise none. */
function facetMarker(report: AuditReport | null, id: NavId): Marker | null {
  if (!report || !isFacetId(id)) return null
  const result = report.results.find((r) => r.facet === id)
  if (!result) return null
  if (result.errors === 0 && result.warnings === 0) return null
  return {
    className: result.errors > 0 ? 'bg-destructive' : 'bg-warning',
    description: findingsSummary(result.errors, result.warnings),
  }
}

interface NavButtonProps {
  item: NavItem
  active: boolean
  marker: Marker | null
  turnedOff?: boolean
  tabIndex: number
  onSelect: (id: NavId) => void
  onKeyDown: (event: React.KeyboardEvent) => void
  register: (el: HTMLButtonElement | null) => void
}

function NavButton({
  item,
  active,
  marker,
  turnedOff = false,
  tabIndex,
  onSelect,
  onKeyDown,
  register,
}: NavButtonProps) {
  const { Icon } = item
  const label = turnedOff
    ? `${item.label} — turned off`
    : marker
      ? `${item.label} — ${marker.description}`
      : item.label

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          ref={register}
          type="button"
          aria-label={label}
          aria-current={active ? 'page' : undefined}
          tabIndex={tabIndex}
          onClick={() => onSelect(item.id)}
          onKeyDown={onKeyDown}
          className={cn(
            'relative flex size-10 items-center justify-center rounded-md transition-colors',
            turnedOff && 'opacity-40',
            active
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          <Icon className="size-[18px]" aria-hidden />
          {marker && (
            <span
              className={cn(
                'absolute top-1.5 right-1.5 size-1.5 rounded-full ring-2 ring-background',
                marker.className
              )}
              aria-hidden
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

const NAV_ITEMS: NavItem[] = [...PRIMARY_NAV, SETTINGS_NAV]

/** Settings is always the last rail item, so its roving index is fixed. */
const SETTINGS_INDEX = NAV_ITEMS.length - 1

/**
 * The tip jar, in Buy Me a Coffee's own yellow. A link, not a nav button: it
 * leaves the panel rather than switching views, so it sits outside the rail's
 * arrow-key roving order and takes its own place in the tab sequence.
 */
function SupportLink() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Buy me a coffee (opens in a new tab)"
          className="flex size-10 items-center justify-center rounded-md bg-support text-support-foreground ring-1 ring-support-border transition-opacity ring-inset hover:opacity-85"
        >
          <Coffee className="size-[18px]" aria-hidden />
        </a>
      </TooltipTrigger>
      <TooltipContent side="right">Buy me a coffee</TooltipContent>
    </Tooltip>
  )
}

export function Sidebar({ active, onSelect, report }: SidebarProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  /** Arrow keys move between rail items; only the active one is in the tab order. */
  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    const last = NAV_ITEMS.length - 1
    const next = {
      ArrowDown: index === last ? 0 : index + 1,
      ArrowRight: index === last ? 0 : index + 1,
      ArrowUp: index === 0 ? last : index - 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    buttons.current[next]?.focus()
  }

  const activeIndex = Math.max(
    0,
    NAV_ITEMS.findIndex((item) => item.id === active)
  )

  return (
    <nav
      aria-label="Facets"
      className="flex w-14 shrink-0 flex-col items-center gap-1 border-r bg-card py-3"
    >
      <span className="mb-2 flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Gem className="size-5" aria-hidden />
        <span className="sr-only">Facet</span>
      </span>
      {PRIMARY_NAV.map((item, index) => (
        <NavButton
          key={item.id}
          item={item}
          active={active === item.id}
          marker={facetMarker(report, item.id)}
          turnedOff={isTurnedOff(report, item.id)}
          tabIndex={index === activeIndex ? 0 : -1}
          onSelect={onSelect}
          onKeyDown={(event) => handleKeyDown(event, index)}
          register={(el) => {
            buttons.current[index] = el
          }}
        />
      ))}

      {/* Pinned to the foot of the rail: leaving Facet, not moving within it.
          Settings comes first in DOM order so a keyboard user moving from the
          rail into the panel never has to pass through a donation link. */}
      {/* column-reverse: Settings comes first in the DOM so it precedes the
          donation link in the tab order, while the tip jar still sits above it
          visually. Source order is the tab order; only the paint is flipped. */}
      <div className="mt-auto flex flex-col-reverse items-center gap-1">
        <NavButton
          item={SETTINGS_NAV}
          active={active === SETTINGS_NAV.id}
          marker={null}
          tabIndex={activeIndex === SETTINGS_INDEX ? 0 : -1}
          onSelect={onSelect}
          onKeyDown={(event) => handleKeyDown(event, SETTINGS_INDEX)}
          register={(el) => {
            buttons.current[SETTINGS_INDEX] = el
          }}
        />
        {hasSupportLink() && <SupportLink />}
      </div>
    </nav>
  )
}
