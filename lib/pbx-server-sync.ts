import { ASTERISK_DIRECT_API } from "@/lib/env"
import { apiUrl, BridgePaths } from "@/lib/bridge-paths"
import { buildExtensionPostBody } from "@/lib/extension-create-payload"

async function parseBody(res: Response): Promise<unknown> {
  const t = await res.text()
  if (!t.trim()) return null
  try {
    return JSON.parse(t) as unknown
  } catch {
    return { raw: t.slice(0, 200) }
  }
}

export async function pbxPostExtension(
  extension: string,
  password: string
): Promise<boolean> {
  try {
    const res = await fetch(apiUrl(ASTERISK_DIRECT_API, BridgePaths.extensions), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildExtensionPostBody(extension, password)),
      cache: "no-store",
    })
    return res.ok
  } catch {
    return false
  }
}

export async function pbxPostUser(body: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(apiUrl(ASTERISK_DIRECT_API, BridgePaths.users), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    return res.ok
  } catch {
    return false
  }
}

export async function pbxPatchUser(
  id: string,
  patch: Record<string, unknown>
): Promise<boolean> {
  try {
    const res = await fetch(apiUrl(ASTERISK_DIRECT_API, BridgePaths.users, id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
      cache: "no-store",
    })
    return res.ok
  } catch {
    return false
  }
}

export async function pbxDeleteUser(id: string): Promise<boolean> {
  try {
    const res = await fetch(apiUrl(ASTERISK_DIRECT_API, BridgePaths.users, id), {
      method: "DELETE",
      cache: "no-store",
    })
    return res.ok
  } catch {
    return false
  }
}

export async function pbxDeleteExtension(extension: string): Promise<boolean> {
  try {
    const res = await fetch(
      apiUrl(ASTERISK_DIRECT_API, BridgePaths.extensions, extension),
      {
        method: "DELETE",
        cache: "no-store",
      }
    )
    return res.ok
  } catch {
    return false
  }
}

/** PBX user rows for next-extension suggestion (no auth). */
export async function pbxFetchUsersJson(): Promise<unknown[] | null> {
  try {
    const res = await fetch(apiUrl(ASTERISK_DIRECT_API, BridgePaths.users), {
      cache: "no-store",
    })
    const data = await parseBody(res)
    if (!res.ok || !Array.isArray(data)) return null
    return data as unknown[]
  } catch {
    return null
  }
}
