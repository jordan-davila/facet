import { CircleCheck, CircleDashed, CircleX, Copy, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { FieldStatus, JsonLdBlock, JsonLdNode, StructuredDataData } from '@/audits/jsonld'
import { cn } from '@/lib/utils'
import { FacetHeader } from '../FacetHeader'
import { IssueList } from '../IssueList'
import { Section } from '../Section'
import type { FacetViewProps } from './types'

async function copyJson(json: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(json)
    toast.success('JSON copied')
  } catch {
    toast.error('Couldn’t copy — the panel needs focus to reach the clipboard.')
  }
}

function FieldRow({ field, kind }: { field: FieldStatus; kind: 'required' | 'recommended' }) {
  const Icon = field.present ? CircleCheck : kind === 'required' ? CircleX : CircleDashed
  const color = field.present
    ? 'text-success'
    : kind === 'required'
      ? 'text-destructive'
      : 'text-warning'
  const state = field.present ? 'present' : kind === 'required' ? 'missing' : 'not set'

  return (
    <li className="flex items-center gap-1.5 text-xs">
      <Icon className={cn('size-3.5 shrink-0', color)} aria-hidden />
      <span className={cn('font-mono', !field.present && 'text-muted-foreground')}>
        {field.name}
      </span>
      <span className="sr-only">— {state}</span>
    </li>
  )
}

function FieldGroup({
  title,
  fields,
  kind,
}: {
  title: string
  fields: FieldStatus[]
  kind: 'required' | 'recommended'
}) {
  if (fields.length === 0) return null
  return (
    <div>
      <p className="mb-1.5 eyebrow">{title}</p>
      <ul className="space-y-1">
        {fields.map((field) => (
          <FieldRow key={field.name} field={field} kind={kind} />
        ))}
      </ul>
    </div>
  )
}

function NodeChecklist({ node }: { node: JsonLdNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {node.types.map((type) => (
          <a
            key={type}
            href={`https://schema.org/${type}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full"
            aria-label={`${type} — open its schema.org reference in a new tab`}
          >
            <Badge variant="secondary" className="gap-1 font-mono">
              {type}
              <ExternalLink className="size-2.5 opacity-60" aria-hidden />
            </Badge>
          </a>
        ))}
      </div>
      <FieldGroup title="Required" fields={node.requiredFields} kind="required" />
      <FieldGroup title="Recommended" fields={node.recommendedFields} kind="recommended" />
      {node.missingAnyOf.length > 0 && (
        <p className="text-xs text-destructive">Needs one of: {node.missingAnyOf.join(', ')}</p>
      )}
    </div>
  )
}

function blockTypes(block: JsonLdBlock): string {
  const types = block.nodes.flatMap((n) => n.types)
  return types.join(', ') || `Block ${block.index + 1}`
}

function BlockItem({ block }: { block: JsonLdBlock }) {
  const label = blockTypes(block)
  return (
    <AccordionItem value={`block-${block.index}`}>
      <AccordionTrigger className="gap-2 py-3 hover:no-underline">
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="min-w-0 truncate font-mono text-xs">{label}</span>
          <Badge variant={block.valid ? 'success' : 'destructive'} className="shrink-0">
            {block.valid ? 'valid' : 'invalid'}
          </Badge>
        </span>
      </AccordionTrigger>
      <AccordionContent className="space-y-3">
        {block.error && (
          <p role="alert" className="text-xs text-destructive">
            {block.error}
          </p>
        )}
        {block.nodes.map((node, index) => (
          <NodeChecklist key={index} node={node} />
        ))}
        <div className="relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="absolute top-1 right-1 z-10 bg-muted text-muted-foreground"
                aria-label={`Copy the ${label} JSON-LD block`}
                onClick={() => void copyJson(block.json)}
              >
                <Copy aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Copy JSON</TooltipContent>
          </Tooltip>
          <pre
            tabIndex={0}
            className="max-h-64 overflow-auto rounded-sm bg-muted p-2 pr-9 text-[11px] leading-relaxed whitespace-pre"
          >
            {block.json}
          </pre>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

function problemBlocks(blocks: JsonLdBlock[]): string[] {
  return blocks
    .filter(
      (b) =>
        !b.valid || b.nodes.some((n) => n.missingRequired.length > 0 || n.missingAnyOf.length > 0)
    )
    .map((b) => `block-${b.index}`)
}

export function StructuredDataView({ result, onHighlight }: FacetViewProps) {
  const data = result.data as StructuredDataData
  return (
    <div className="space-y-3">
      <FacetHeader result={result} />
      <Section title="Detected types">
        {data.typesFound.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No JSON-LD structured data found.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {data.typesFound.map((type) => (
              <Badge key={type} variant="secondary" className="font-mono">
                {type}
              </Badge>
            ))}
          </div>
        )}
      </Section>

      {data.blocks.length > 0 && (
        <Section title={`Blocks (${data.blocks.length})`}>
          <Accordion type="multiple" defaultValue={problemBlocks(data.blocks)} className="-my-2">
            {data.blocks.map((block) => (
              <BlockItem key={block.index} block={block} />
            ))}
          </Accordion>
        </Section>
      )}

      <IssueList issues={result.issues} onHighlight={onHighlight} />
    </div>
  )
}
