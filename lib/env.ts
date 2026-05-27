/**
 * Asterisk / API URLs for the portal.
 *
 * Values come from `.env.local` at the moment `next dev` or `next build` starts.
 * After changing `.env.local`, restart the dev server so `NEXT_PUBLIC_*` picks up edits.
 */

function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, "")
}

function getRuntimeHostname() {
  if (typeof window === "undefined") return undefined
  const hostname = window.location.hostname?.trim()
  return hostname ? hostname : undefined
}

const apiPort = process.env.NEXT_PUBLIC_ASTERISK_API_PORT ?? "3001"
const sipPort = process.env.NEXT_PUBLIC_ASTERISK_SIP_PORT ?? "5060"

const explicitApi = process.env.NEXT_PUBLIC_ASTERISK_API?.trim()
const configuredHost = process.env.NEXT_PUBLIC_ASTERISK_HOST?.trim()
const explicitSipServer = process.env.NEXT_PUBLIC_ASTERISK_SIP_SERVER?.trim()
const runtimeHost = getRuntimeHostname()
const resolvedHost = configuredHost || runtimeHost || "localhost"

export const ASTERISK_DIRECT_API = stripTrailingSlash(
  explicitApi
    ? explicitApi
    : `http://${resolvedHost}:${apiPort}/api`
)

/**
 * Client fetches go through same-origin proxy to avoid browser CORS/network
 * edge cases. Server-side code should use ASTERISK_DIRECT_API.
 */
export const ASTERISK_API =
  typeof window === "undefined" ? ASTERISK_DIRECT_API : "/api/pbx"

export const ASTERISK_SIP_SERVER = explicitSipServer || resolvedHost
export const ASTERISK_SIP_PORT = sipPort
