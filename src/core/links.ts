/**
 * Outbound links shown in the panel. Kept in one place because these ship to
 * every user: a wrong URL here is a wrong URL in the Chrome Web Store.
 */

export const REPOSITORY_URL = 'https://github.com/jordan-davila/facet'

export const ISSUES_URL = `${REPOSITORY_URL}/issues`

export const PRIVACY_URL = `${REPOSITORY_URL}/blob/main/PRIVACY.md`

/**
 * Optional tip jar. Facet is free and takes no payment; this is a voluntary
 * link and never gates a feature.
 *
 * Set to an empty string to remove the button entirely — shipping a dead or
 * wrong donation link is worse than shipping none.
 */
export const SUPPORT_URL = 'https://buymeacoffee.com/hi5n'

/** Whether the panel has a real support link to offer. */
export function hasSupportLink(): boolean {
  return SUPPORT_URL.trim().length > 0
}
