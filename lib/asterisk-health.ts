import { ASTERISK_API, ASTERISK_DIRECT_API } from "./env"
import { apiUrl, BridgePaths } from "./bridge-paths"

const HEALTH_TIMEOUT_MS = 8000

export type AsteriskHealthResult =
  | { kind: "online"; latencyMs: number; checkedAt: number }
  | { kind: "degraded"; latencyMs: number; httpStatus: number; checkedAt: number }
  | { kind: "offline"; reason: string; checkedAt: number }

/** Host + path prefix shown in the UI (no secrets). */
export function getAsteriskApiDisplayTarget(): string {
  try {
    const u = new URL(ASTERISK_DIRECT_API)
    return `${u.host}${u.pathname}`
  } catch {
    return ASTERISK_DIRECT_API
  }
}

/**
 * Best-effort reachability check against the Asterisk HTTP bridge (same origin the portal uses).
 * Uses GET /info — matches existing dashboard/security probes.
 */
export async function checkAsteriskApiHealth(): Promise<AsteriskHealthResult> {
  const started =
    typeof performance !== "undefined" ? performance.now() : Date.now()

  const controller = new AbortController()
  const tid = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)

  try {
    const isAriBase = /\/ari\/?$/i.test(ASTERISK_DIRECT_API)
    const primary = isAriBase
      ? apiUrl(ASTERISK_API, BridgePaths.asteriskInfo)
      : apiUrl(ASTERISK_API, BridgePaths.info)
    const secondary = isAriBase
      ? apiUrl(ASTERISK_API, BridgePaths.info)
      : apiUrl(ASTERISK_API, BridgePaths.asteriskInfo)
    const healthUrls = [primary, secondary]
    let res: Response | null = null

    for (const url of healthUrls) {
      const attempt = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
        headers: { Accept: "application/json" },
      })
      // If one path exists (even unauthorized), stop probing.
      if (attempt.status !== 404) {
        res = attempt
        break
      }
      // Keep the 404 response in case all probes end up 404.
      res = attempt
    }
    clearTimeout(tid)

    const end =
      typeof performance !== "undefined" ? performance.now() : Date.now()
    const latencyMs = Math.round(end - started)
    const checkedAt = Date.now()

    if (!res) {
      return { kind: "offline", reason: "No response from PBX health probe", checkedAt }
    }

    // ARI commonly returns 401/403 without credentials; this still means PBX is reachable.
    if (res.status === 401 || res.status === 403) {
      return { kind: "online", latencyMs, checkedAt }
    }

    if (!res.ok) {
      return { kind: "degraded", latencyMs, httpStatus: res.status, checkedAt }
    }

    return { kind: "online", latencyMs, checkedAt }
  } catch (e: unknown) {
    clearTimeout(tid)
    const checkedAt = Date.now()
    const reason =
      e instanceof DOMException && e.name === "AbortError"
        ? "Request timed out"
        : e instanceof Error
          ? e.message
          : "Unreachable"
    return { kind: "offline", reason, checkedAt }
  }
}
