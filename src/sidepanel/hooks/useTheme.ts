import { useEffect } from 'react'
import type { ThemePreference } from '@/core/types'

/**
 * Applies the appearance preference to the document root. The stylesheet does
 * the rest via color-scheme + light-dark(), so 'system' means removing the
 * attribute rather than resolving the media query here.
 */
export function useTheme(theme: ThemePreference): void {
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      root.removeAttribute('data-theme')
      return
    }
    root.setAttribute('data-theme', theme)
  }, [theme])
}
