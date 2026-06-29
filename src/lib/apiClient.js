import axios from 'axios'
import { getAccessToken, getRefreshToken, setSession, clearSession } from '../utils/authSession'

// In dev the Vite proxy forwards /api/* → backend, so we use '' (same-origin).
// In production set VITE_API_URL to the backend's full URL.
const BASE_URL = import.meta.env.VITE_API_URL ?? ''

const api = axios.create({ baseURL: BASE_URL })

// Request interceptor: attach JWT
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
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

    if (status === 401 && !original._retry) {
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

    if (status === 403) {
      showToast('Permission denied', 'error')
    }

    if (status >= 500) {
      showToast('Server error — please retry', 'error')
    }

    return Promise.reject(error)
  },
)

// Minimal toast helper (reads CSS variables, no new dependencies)
function showToast(message, type = 'info') {
  const existing = document.getElementById('resq-api-toast')
  if (existing) existing.remove()

  const el = document.createElement('div')
  el.id = 'resq-api-toast'
  el.textContent = message
  el.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    background: ${type === 'error' ? 'var(--danger, #ef4444)' : 'var(--accent, #3b82f6)'};
    color: #fff; padding: 10px 16px; border-radius: 8px;
    font-size: 13px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: fadeIn 0.2s ease;
  `
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 4000)
}

export default api
