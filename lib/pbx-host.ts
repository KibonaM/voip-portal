import {
  ASTERISK_DIRECT_API,
  ASTERISK_SIP_PORT,
  ASTERISK_SIP_SERVER,
} from "./env"

/** Resolved PBX targets the portal proxy and SIP UI use (from env at server start). */
export function resolvePbxConnectionInfo() {
  let apiHost = ASTERISK_SIP_SERVER
  try {
    apiHost = new URL(ASTERISK_DIRECT_API).hostname
  } catch {
    /* keep sip fallback */
  }

  return {
    /** HTTP bridge host the Next.js proxy connects to */
    host: apiHost,
    /** SIP server shown to softphones (may differ from API host) */
    sipHost: ASTERISK_SIP_SERVER,
    sipPort: ASTERISK_SIP_PORT,
    configuredApi: ASTERISK_DIRECT_API,
  }
}
