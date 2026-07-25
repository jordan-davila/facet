import type { AuditResult, Issue } from '@/core/types'
import { buildResult } from './result'
import { SCHEMA_DEFS } from './schema-defs'

export interface FieldStatus {
  name: string
  present: boolean
}

export interface JsonLdNode {
  types: string[]
  /** Required schema.org fields for this node's type(s), with presence. */
  requiredFields: FieldStatus[]
  /** Recommended schema.org fields, with presence. */
  recommendedFields: FieldStatus[]
  missingRequired: string[]
  missingRecommended: string[]
  missingAnyOf: string[]
}

export interface JsonLdBlock {
  index: number
  valid: boolean
  error?: string
  hasContext: boolean
  nodes: JsonLdNode[]
  /** Pretty-printed JSON (or the raw source when invalid), capped for display. */
  json: string
}

export interface StructuredDataData {
  blocks: JsonLdBlock[]
  typesFound: string[]
}

type JsonObject = Record<string, unknown>

const MAX_JSON_CHARS = 6000

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function fieldPresent(obj: JsonObject, key: string): boolean {
  const value = obj[key]
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (Array.isArray(value)) return value.length > 0
  return true
}

function typesOf(obj: JsonObject): string[] {
  const raw = obj['@type']
  if (typeof raw === 'string') return [raw]
  if (Array.isArray(raw)) return raw.filter((t): t is string => typeof t === 'string')
  return []
}

function cap(text: string): string {
  return text.length > MAX_JSON_CHARS ? `${text.slice(0, MAX_JSON_CHARS)}\n… (truncated)` : text
}

function prettyJson(value: unknown): string {
  try {
    return cap(JSON.stringify(value, null, 2))
  } catch {
    return ''
  }
}

/** Flatten a parsed JSON-LD payload into individual typed nodes. */
function flattenNodes(parsed: unknown): JsonObject[] {
  const nodes: JsonObject[] = []
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (!isObject(value)) return
    if (Array.isArray(value['@graph'])) {
      value['@graph'].forEach(visit)
    }
    if (typesOf(value).length > 0) nodes.push(value)
  }
  visit(parsed)
  return nodes
}

function validateNode(obj: JsonObject): JsonLdNode {
  const types = typesOf(obj)
  const required = new Map<string, boolean>()
  const recommended = new Map<string, boolean>()
  const missingAnyOf: string[] = []

  for (const type of types) {
    const def = SCHEMA_DEFS[type]
    if (!def) continue
    def.required.forEach((key) => required.set(key, fieldPresent(obj, key)))
    def.recommended.forEach((key) => {
      if (!required.has(key)) recommended.set(key, fieldPresent(obj, key))
    })
    if (def.anyOf && !def.anyOf.some((key) => fieldPresent(obj, key))) {
      missingAnyOf.push(...def.anyOf)
    }
  }

  const requiredFields = [...required].map(([name, present]) => ({ name, present }))
  const recommendedFields = [...recommended].map(([name, present]) => ({ name, present }))
  return {
    types,
    requiredFields,
    recommendedFields,
    missingRequired: requiredFields.filter((f) => !f.present).map((f) => f.name),
    missingRecommended: recommendedFields.filter((f) => !f.present).map((f) => f.name),
    missingAnyOf,
  }
}

function hasSchemaContext(parsed: unknown): boolean {
  if (!isObject(parsed)) return Array.isArray(parsed) && parsed.some(hasSchemaContext)
  const context = parsed['@context']
  return typeof context === 'string' ? context.includes('schema.org') : context != null
}

function pushNodeIssues(block: JsonLdBlock, issues: Issue[]): void {
  block.nodes.forEach((node, nodeIndex) => {
    const label = node.types.join(' / ') || 'Item'
    if (node.missingRequired.length > 0) {
      issues.push({
        id: `jsonld-${block.index}-${nodeIndex}-required`,
        severity: 'error',
        title: `${label} is missing required field(s): ${node.missingRequired.join(', ')}`,
        detail: 'Required fields are needed for this type to be eligible for rich results.',
      })
    }
    if (node.missingAnyOf.length > 0) {
      issues.push({
        id: `jsonld-${block.index}-${nodeIndex}-anyof`,
        severity: 'error',
        title: `${label} needs one of: ${node.missingAnyOf.join(', ')}`,
      })
    }
    if (node.missingRecommended.length > 0) {
      issues.push({
        id: `jsonld-${block.index}-${nodeIndex}-recommended`,
        severity: 'warning',
        title: `${label} is missing recommended field(s): ${node.missingRecommended.join(', ')}`,
      })
    }
    const known = node.types.some((t) => SCHEMA_DEFS[t])
    if (!known && node.types.length > 0) {
      issues.push({
        id: `jsonld-${block.index}-${nodeIndex}-unknown`,
        severity: 'info',
        title: `${label}: no built-in validation for this type`,
      })
    }
  })
}

export function auditJsonLd(doc: Document): AuditResult<StructuredDataData> {
  const issues: Issue[] = []
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
  const blocks: JsonLdBlock[] = []
  const typesFound = new Set<string>()

  if (scripts.length === 0) {
    issues.push({
      id: 'jsonld-none',
      severity: 'info',
      title: 'No JSON-LD structured data found',
      detail: 'Add schema.org JSON-LD to become eligible for rich results in search.',
    })
    return buildResult('structured-data', issues, { blocks, typesFound: [] })
  }

  scripts.forEach((script, index) => {
    const raw = script.textContent ?? ''
    try {
      const parsed = JSON.parse(raw)
      const nodes = flattenNodes(parsed).map(validateNode)
      nodes.forEach((n) => n.types.forEach((t) => typesFound.add(t)))
      const block: JsonLdBlock = {
        index,
        valid: true,
        hasContext: hasSchemaContext(parsed),
        nodes,
        json: prettyJson(parsed),
      }
      if (!block.hasContext) {
        issues.push({
          id: `jsonld-${index}-context`,
          severity: 'warning',
          title: `Block ${index + 1} is missing an @context of schema.org`,
        })
      }
      if (nodes.length === 0) {
        issues.push({
          id: `jsonld-${index}-notype`,
          severity: 'warning',
          title: `Block ${index + 1} has no @type`,
        })
      }
      pushNodeIssues(block, issues)
      blocks.push(block)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Parse error'
      blocks.push({
        index,
        valid: false,
        hasContext: false,
        nodes: [],
        error: message,
        json: cap(raw.trim()),
      })
      issues.push({
        id: `jsonld-${index}-invalid`,
        severity: 'error',
        title: `Block ${index + 1} contains invalid JSON`,
        detail: message,
      })
    }
  })

  if (!issues.some((i) => i.severity === 'error' || i.severity === 'warning')) {
    issues.push({
      id: 'jsonld-ok',
      severity: 'pass',
      title: `Valid structured data: ${[...typesFound].join(', ') || 'no typed items'}`,
    })
  }

  return buildResult('structured-data', issues, { blocks, typesFound: [...typesFound] })
}
