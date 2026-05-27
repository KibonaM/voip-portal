# Asterisk + Softphone Setup

This portal expects an HTTP bridge/API that talks to your Asterisk server.

## 1) Configure portal environment

Create `\.env.local` in the project root (copy from `\.env.local.example`).

By default, the portal auto-uses the hostname you opened in browser.  
Example: if you open `http://192.168.1.25:3000`, API defaults to `http://192.168.1.25:3001/api`.

Set a fixed host only if your PBX/API is on another machine:

```env
# Optional
NEXT_PUBLIC_ASTERISK_HOST=192.168.1.13
```

Optional overrides:

```env
NEXT_PUBLIC_ASTERISK_API_PORT=3001
NEXT_PUBLIC_ASTERISK_SIP_PORT=5060
```

Or set the full API URL instead of host + port:

```env
NEXT_PUBLIC_ASTERISK_API=http://192.168.1.13:3001/api
NEXT_PUBLIC_ASTERISK_SIP_SERVER=192.168.1.13
```

Next.js reads `\.env.local` when `next dev` / `next build` starts.  
After any change to env files, restart the dev server:

```bash
pnpm dev
```

### Dev server “Network” URL vs Asterisk host

`NEXT_PUBLIC_ASTERISK_HOST` does **not** choose which IP the Next.js dev server listens on.  
Next.js prints a **Network** URL using one of your machine’s IPv4 addresses — often a VirtualBox / Hyper-V adapter such as `192.168.56.x`, not necessarily `192.168.1.x`.

This project runs `next dev` with **`--hostname 0.0.0.0`**, so the app is reachable on **every** interface. From another device (or from your browser), use:

`http://<your PC’s LAN IPv4>:3000`

Find the LAN address with `ipconfig` (Windows): pick the IPv4 that shares the same subnet as your PBX (for example `192.168.1.x` when Asterisk is `192.168.1.13`).

## 2) Softphone settings (on this computer)

Use these values in your softphone account:

- SIP Server / Domain: `192.168.1.13`
- Port: `5060`
- Transport: `UDP` (or `TCP/TLS` if your PBX is configured for it)
- Username/Auth ID: your extension (for example `1001`)
- Password: extension secret configured in Asterisk

## 3) Asterisk requirements

Your Asterisk server must expose:

- SIP signaling port (`5060/udp` by default)
- RTP media ports (often `10000-20000/udp`)
- The HTTP API used by this portal at `http://192.168.1.13:3001/api`

If the portal runs in browser and calls the API directly, enable CORS on the API for your portal origin (for example `http://localhost:3000`).

## 4) Quick connectivity checks

From your portal machine:

- Open `http://192.168.1.13:3001/api/info` in browser.
- Confirm your extension appears in `http://192.168.1.13:3001/api/endpoints`.
- Register the softphone and check it changes to online in the portal.
