export interface Metric {
  label: string
  value: string | number
}

/**
 * A row of measured values. Numbers use the faceplate treatment because in
 * this panel a number is a reading, not a sentence.
 */
export function Metrics({ items }: { items: Metric[] }) {
  return (
    <dl className="flex flex-wrap justify-between gap-x-3 gap-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <dd className="text-lg leading-none font-bold faceplate">{item.value}</dd>
          <dt className="eyebrow">{item.label}</dt>
        </div>
      ))}
    </dl>
  )
}
