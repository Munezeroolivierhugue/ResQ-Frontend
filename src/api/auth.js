import api from '../lib/apiClient'

export async function login(email, password) {
  const { data } = await api.post('/api/auth/login', { email, password })
  return data.data ?? data
}

export async function verifyMfa(challengeToken, code, trustDevice = false, deviceLabel = null) {
  const { data } = await api.post('/api/auth/mfa/verify', {
    challengeToken,
    code,
    trustDevice,
    ...(deviceLabel ? { deviceLabel } : {}),
  })
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

export async function resendMfaCode(challengeToken) {
  const { data } = await api.post('/api/auth/mfa/resend', { challengeToken })
  return data.data ?? data
}

export async function getInviteInfo(token) {
  const { data } = await api.get(`/api/auth/invite-info?token=${encodeURIComponent(token)}`)
  return data.data ?? data
}

export async function acceptInvite(token, password) {
  await api.post('/api/auth/accept-invite', { token, password })
}
