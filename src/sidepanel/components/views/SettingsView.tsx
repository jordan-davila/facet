import { Coffee, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { FACET_META, FACET_ORDER } from '@/core/constants'
import { ISSUES_URL, PRIVACY_URL, REPOSITORY_URL, SUPPORT_URL, hasSupportLink } from '@/core/links'
import type { Settings, ThemePreference, WcagLevel } from '@/core/types'
import { Section } from '../Section'

interface SettingsViewProps {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  reset: () => void
}

const CONTRAST_ISSUE_LIMITS = { min: 10, max: 1000 }

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.max(min, Math.min(max, value))
}

/**
 * A bounded number field that lets you finish typing. Clamping on every
 * keystroke turns "1" into the minimum before the second digit arrives, so the
 * draft is held locally and only committed when it is a usable number.
 */
function BoundedNumberInput({
  id,
  value,
  min,
  max,
  onCommit,
}: {
  id: string
  value: number
  min: number
  max: number
  onCommit: (value: number) => void
}) {
  const [draft, setDraft] = useState(String(value))

  // Follow the stored value when it changes elsewhere, e.g. Reset to defaults.
  useEffect(() => setDraft(String(value)), [value])

  function commit(raw: string) {
    const next = clamp(Number(raw), min, max)
    setDraft(String(next))
    if (next !== value) onCommit(next)
  }

  return (
    <Input
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      aria-describedby={`${id}-hint`}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value)
        // Commit only once the draft is already in range; anything else waits
        // for blur so the field never rewrites what is being typed.
        const parsed = Number(e.target.value)
        if (e.target.value !== '' && parsed >= min && parsed <= max) onCommit(parsed)
      }}
      onBlur={(e) => commit(e.target.value)}
      className="w-24"
    />
  )
}

/** A small outbound link that says, in words, that it leaves the panel. */
function ExternalLinkItem({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-sm text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
    >
      {children}
      <ExternalLink className="size-2.5" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  )
}

/**
 * A label + hint pair that stays wired to its control.
 *
 * The label carries an id because Radix renders Switch and Select as
 * `<button>`, and a `<label for>` does not name a button: per HTML-AAM a
 * button is named by its own content, so an empty switch ends up with no
 * accessible name at all even though clicking the label still toggles it.
 * Controls here point back with aria-labelledby instead.
 */
function Field({
  htmlFor,
  label,
  hint,
  children,
}: {
  htmlFor: string
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <Label id={`${htmlFor}-label`} htmlFor={htmlFor}>
          {label}
        </Label>
        {hint && (
          <p id={`${htmlFor}-hint`} className="mt-0.5 text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}

export function SettingsView({ settings, update, reset }: SettingsViewProps) {
  const version = chrome.runtime.getManifest().version

  /**
   * Reset wipes every toggle, the conformance level, the issue cap and the
   * theme. Undo is friendlier than a confirm dialog here: the action is cheap
   * to reverse and a modal for a settings reset is heavier than the risk.
   */
  function resetWithUndo() {
    const previous = settings
    reset()
    toast('Settings reset to defaults', {
      action: { label: 'Undo', onClick: () => update(previous) },
    })
  }

  return (
    <div className="space-y-3">
      <h2 className="text-[15px] font-semibold">Settings</h2>

      <Section title="Appearance">
        <Field htmlFor="theme" label="Theme" hint="System follows your OS setting.">
          <Select
            value={settings.theme}
            onValueChange={(value) => update({ theme: value as ThemePreference })}
          >
            <SelectTrigger
              id="theme"
              size="sm"
              className="w-32"
              aria-labelledby="theme-label"
              aria-describedby="theme-hint"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <Section title="Contrast">
        <div className="space-y-3">
          <Field htmlFor="wcag-level" label="Conformance level">
            <Select
              value={settings.wcagLevel}
              onValueChange={(value) => update({ wcagLevel: value as WcagLevel })}
            >
              <SelectTrigger
                id="wcag-level"
                size="sm"
                className="w-32"
                aria-labelledby="wcag-level-label"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AA">WCAG AA</SelectItem>
                <SelectItem value="AAA">WCAG AAA</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field
            htmlFor="contrast-max"
            label="Max reported issues"
            hint={`Between ${CONTRAST_ISSUE_LIMITS.min} and ${CONTRAST_ISSUE_LIMITS.max}.`}
          >
            <BoundedNumberInput
              id="contrast-max"
              value={settings.contrastMaxIssues}
              min={CONTRAST_ISSUE_LIMITS.min}
              max={CONTRAST_ISSUE_LIMITS.max}
              onCommit={(contrastMaxIssues) => update({ contrastMaxIssues })}
            />
          </Field>
        </div>
      </Section>

      <Section title="Scanning">
        <Field
          htmlFor="auto-scan"
          label="Re-scan on navigation"
          hint="Refresh automatically when the tab changes."
        >
          <Switch
            id="auto-scan"
            aria-labelledby="auto-scan-label"
            aria-describedby="auto-scan-hint"
            checked={settings.autoScan}
            onCheckedChange={(value) => update({ autoScan: value })}
          />
        </Field>
      </Section>

      <Section title="Checks">
        <ul className="divide-y">
          {FACET_ORDER.map((facet) => (
            <li key={facet} className="py-2 first:pt-0 last:pb-0">
              <Field
                htmlFor={`facet-${facet}`}
                label={FACET_META[facet].label}
                hint={FACET_META[facet].blurb}
              >
                <Switch
                  id={`facet-${facet}`}
                  aria-labelledby={`facet-${facet}-label`}
                  aria-describedby={`facet-${facet}-hint`}
                  checked={settings.enabled[facet]}
                  onCheckedChange={(value) =>
                    update({ enabled: { ...settings.enabled, [facet]: value } })
                  }
                />
              </Field>
            </li>
          ))}
        </ul>
      </Section>

      {hasSupportLink() && (
        <Section title="Support">
          <div className="space-y-2.5">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Facet is free, and every check stays free. If it saved you some time, you can put
              something in the tip jar.
            </p>
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-md bg-support px-3 py-2.5 text-[13px] font-semibold text-support-foreground ring-1 ring-support-border transition-opacity ring-inset hover:opacity-85"
            >
              <Coffee className="size-4" aria-hidden />
              Buy me a coffee
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
        </Section>
      )}

      <Section title="About">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] text-muted-foreground">Facet v{version}</span>
            <Button variant="ghost" size="xs" onClick={resetWithUndo}>
              Reset to defaults
            </Button>
          </div>
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2.5">
            <li>
              <ExternalLinkItem href={ISSUES_URL}>Report an issue</ExternalLinkItem>
            </li>
            <li>
              <ExternalLinkItem href={PRIVACY_URL}>Privacy</ExternalLinkItem>
            </li>
            <li>
              <ExternalLinkItem href={REPOSITORY_URL}>Source</ExternalLinkItem>
            </li>
          </ul>
        </div>
      </Section>
    </div>
  )
}
