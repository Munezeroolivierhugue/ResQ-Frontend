// Detect the client IP by asking the backend what it sees.
//
// Why not WebRTC?  Chrome 83+ anonymises WebRTC host candidates with mDNS
// (e.g. "deb1dc73-...local") — the real LAN IP is never exposed to JS.
//
// Why not ipify?  That returns the public ISP/router IP (102.x.x.x), not the
// machine's network adapter IP.
//
// This approach: a lightweight GET /api/auth/my-ip that the backend answers
// with getRemoteAddr() (+ X-Forwarded-For / CF-Connecting-IP in production).
// Result: the exact IP the server will record in the audit log — so what the
// admin sees in the trail always matches this source.

const CACHE_KEY = 'resq-client-ip-v2'
const BASE_URL  = import.meta.env.VITE_API_URL ?? ''

// Evict old entries from previous WebRTC / ipify implementations
sessionStorage.removeItem('resq-client-ip')

let _promise = null

export async function getClientIp() {
  const cached = sessionStorage.getItem(CACHE_KEY)
  if (cached) return cached

  if (_promise) return _promise

  _promise = fetch(`${BASE_URL}/api/auth/my-ip`, {
    method: 'GET',
    signal: AbortSignal.timeout(5000),
  })
    .then((r) => r.json())
    .then((body) => {
      const ip = body?.data?.ip ?? body?.ip ?? null
      if (ip) sessionStorage.setItem(CACHE_KEY, ip)
      _promise = null
      return ip
    })
    .catch(() => {
      _promise = null
      return null
    })

  return _promise
}

// Pre-warm on app load so the IP is ready before the login form is submitted
getClientIp().catch(() => {})
