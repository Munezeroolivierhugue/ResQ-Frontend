import api from '../lib/apiClient'

export async function login(email, password) {
  const { data } = await api.post('/api/auth/login', { email, password })
  return data.data ?? data
}

export async function verifyMfa(challengeToken, code) {
  const { data } = await api.post('/api/auth/mfa/verify', { challengeToken, code })
  return data.data ?? data
}

export async function refreshToken(refreshTokenValue) {
  const { data } = await api.post('/api/auth/refresh', { refreshToken: refreshTokenValue })
  return data.data ?? data
}

export async function logoutApi(refreshTokenValue) {
  await api.post('/api/auth/logout', { refreshToken: refreshTokenValue })
}

export async function setupMfa(method = 'TOTP') {
  const { data } = await api.post(`/api/auth/mfa/setup?method=${method}`)
  return data.data ?? data
}

export async function confirmMfaSetup(challengeToken, code, method = 'TOTP') {
  await api.post('/api/auth/mfa/setup/confirm', { challengeToken, code, method })
}
