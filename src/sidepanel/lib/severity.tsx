import { CircleCheck, CircleX, Info, type LucideIcon, TriangleAlert } from 'lucide-react'
import type { Issue, Severity } from '@/core/types'

type BadgeVariant = 'destructive' | 'warning' | 'info' | 'success'

interface SeverityMeta {
  label: string
  Icon: LucideIcon
  badge: BadgeVariant
  /** Text color utility for the icon. */
  text: string
  /** Subtle left-accent border utility for issue rows. */
  accent: string
}

export const SEVERITY_META: Record<Severity, SeverityMeta> = {
  error: {
    label: 'Error',
    Icon: CircleX,
    badge: 'destructive',
    text: 'text-destructive',
    accent: 'border-l-destructive',
  },
  warning: {
    label: 'Warning',
    Icon: TriangleAlert,
    badge: 'warning',
    text: 'text-warning',
    accent: 'border-l-warning',
  },
  info: {
    label: 'Info',
    Icon: Info,
    badge: 'info',
    text: 'text-info',
    accent: 'border-l-info',
  },
  pass: {
    label: 'Pass',
    Icon: CircleCheck,
    badge: 'success',
    text: 'text-success',
    accent: 'border-l-success',
  },
}

const SEVERITY_RANK: Record<Severity, number> = { error: 0, warning: 1, info: 2, pass: 3 }

/** Order issues most-severe first, preserving discovery order within a level. */
export function sortIssues(issues: Issue[]): Issue[] {
  return [...issues].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
}
