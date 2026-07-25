import { useId } from 'react'

interface SectionProps {
  title?: string
  action?: React.ReactNode
  children: React.ReactNode
}

/**
 * A plate: hairline-ruled panel with an engraved caption. Deliberately flatter
 * than a shadcn Card — in a 380px column, shadow and generous radius eat the
 * space the content needs.
 */
export function Section({ title, action, children }: SectionProps) {
  const headingId = useId()
  return (
    <section
      aria-labelledby={title ? headingId : undefined}
      className="rounded-md border bg-card px-3 py-3"
    >
      {title && (
        <div className="mb-2.5 flex items-center justify-between gap-2 border-b pb-2">
          <h3 id={headingId} className="eyebrow">
            {title}
          </h3>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
