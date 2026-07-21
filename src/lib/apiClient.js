import axios from 'axios'
import { getAccessToken, getRefreshToken, setSession, clearSession } from '../utils/authSession'
import { getClientIp } from '../utils/clientIp'
import { useToastStore } from '../store/toastStore'

// In dev the Vite proxy forwards /api/* → backend, so we use '' (same-origin).
// In production set VITE_API_URL to the backend's full URL.
const BASE_URL = import.meta.env.VITE_API_URL ?? ''

const api = axios.create({ baseURL: BASE_URL })

// Request interceptor: attach JWT + real client IP
api.interceptors.request.use(async (config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  try {
    const ip = await getClientIp()
    if (ip && ip !== 'unknown') config.headers['X-Client-IP'] = ip
  } catch { /* non-blocking */ }
  return config
})

// Track refresh in-progress to avoid infinite loops
let _refreshing = false
let _refreshQueue = []

function processQueue(error, token = null) {
  _refreshQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token))
  _refreshQueue = []
}

// Response interceptor: handle 401 refresh, 403 toast, 5xx toast
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const status = error.response?.status

    // MFA endpoints use 401 for wrong codes (not JWT expiry) — never retry them
    const url = original?.url ?? ''
    const isMfaEndpoint = url.includes('/api/auth/mfa/')

    if (status === 401 && !original._retry && !isMfaEndpoint) {
      original._retry = true

      if (_refreshing) {
        // Queue request while refresh is in progress
        return new Promise((resolve, reject) => {
          _refreshQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      _refreshing = true
      try {
        const refresh = getRefreshToken()
        if (!refresh) throw new Error('No refresh token')
        const { data } = await axios.post(`${BASE_URL || ''}/api/auth/refresh`, { refreshToken: refresh })
        const payload = data.data ?? data
        setSession({
          access_token: payload.accessToken,
          refresh_token: payload.refreshToken,
          user: null, // keep existing user
        })
        processQueue(null, payload.accessToken)
        original.headers.Authorization = `Bearer ${payload.accessToken}`
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError)
        clearSession()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        _refreshing = false
      }
    }

    if (status === 403 && !original?.suppressToast) {
      showToast('Permission denied', 'error')
    }

    if (status >= 500) {
      showToast('Server error — please retry', 'error')
    }

    return Promise.reject(error)
  },
)

// Routes into the shared toast stack (see store/toastStore.js /
// components/layout/ToastStack.jsx) instead of hand-rolling a DOM node —
// this module runs outside React, so it reaches the store via getState()
// rather than the useToastStore() hook.
function showToast(message, type = 'info') {
  useToastStore.getState().pushToast({
    variant: type === 'error' ? 'error' : 'info',
    title: type === 'error' ? 'Error' : 'Notice',
    message,
  })
}

export default api
