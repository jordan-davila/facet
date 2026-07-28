import {
  Braces,
  Contrast,
  Heading,
  Image,
  Landmark,
  Languages,
  LayoutDashboard,
  Link,
  Link2,
  type LucideIcon,
  Settings,
  Tags,
} from 'lucide-react'
import { FACET_META, FACET_ORDER } from '@/core/constants'
import type { FacetId } from '@/core/types'

export type NavId = FacetId | 'overview' | 'settings'

export interface NavItem {
  id: NavId
  label: string
  Icon: LucideIcon
  /** Pinned to the foot of the rail rather than flowing with the facets. */
  atEnd?: boolean
}

/** Narrow a nav id to a facet, so callers never have to cast. */
export function isFacetId(id: NavId): id is FacetId {
  return id !== 'overview' && id !== 'settings'
}

const FACET_ICONS: Record<FacetId, LucideIcon> = {
  headings: Heading,
  landmarks: Landmark,
  contrast: Contrast,
  meta: Tags,
  canonical: Link2,
  hreflang: Languages,
  images: Image,
  links: Link,
  'structured-data': Braces,
}

export function facetIcon(facet: FacetId): LucideIcon {
  return FACET_ICONS[facet]
}

/** Primary nav entries: overview, then one per facet. Settings sits apart. */
export const PRIMARY_NAV: NavItem[] = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  ...FACET_ORDER.map((facet) => ({
    id: facet,
    label: FACET_META[facet].label,
    Icon: FACET_ICONS[facet],
  })),
]

export const SETTINGS_NAV: NavItem = {
  id: 'settings',
  label: 'Settings',
  Icon: Settings,
  atEnd: true,
}
