import type { AuditResult } from '@/core/types'

export interface FacetViewProps {
  result: AuditResult
  onHighlight: (selector: string) => void
}
