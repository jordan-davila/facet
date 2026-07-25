import { Ban, Loader2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

function Centered({ children }: { children: React.ReactNode }) {
  return (
    // Sized in rem, not vh: the panel is not the viewport, and vh would place
    // this wrongly in any host box that isn't full height.
    <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-5 text-center">
      {children}
    </div>
  )
}

export function LoadingState() {
  return (
    <Centered>
      {/* role="status" so the wait is announced, not just drawn. */}
      <p role="status" className="flex flex-col items-center gap-3">
        <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
        <span className="text-[13px] text-muted-foreground">Scanning the page…</span>
      </p>
    </Centered>
  )
}

export function UnsupportedState({ url }: { url: string }) {
  return (
    <Centered>
      <Ban className="size-7 text-muted-foreground" aria-hidden />
      <div className="space-y-1.5">
        <h2 className="text-[13px] font-semibold">Facet can’t scan this page</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Browser-internal pages and the Chrome Web Store are off-limits to extensions. Open a
          normal web page and scan again.
        </p>
      </div>
      {url && (
        <p className="max-w-full truncate font-mono text-[11px] text-muted-foreground">{url}</p>
      )}
    </Centered>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Centered>
      <TriangleAlert className="size-7 text-warning" aria-hidden />
      <div role="alert" className="space-y-1.5">
        <h2 className="text-[13px] font-semibold">Couldn’t scan the page</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">{message}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          If the page was open before Facet was installed, reload it and try again.
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={onRetry}>
        Scan again
      </Button>
    </Centered>
  )
}
