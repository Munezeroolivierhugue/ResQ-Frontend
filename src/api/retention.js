import api from '../lib/apiClient'

export async function listRetentionPolicies() {
  const { data } = await api.get('/api/admin/retention-policies')
  return (data.data ?? data).map(p => ({
    policy_id: p.policyId,
    data_type: p.dataType,
    label: p.label,
    retention_days: p.retentionDays,
    legal_basis: p.legalBasis,
    last_reviewed_at: p.lastReviewedAt,
    enforced: p.enforced,
    updated_at: p.updatedAt,
  }))
}

export async function updateRetentionPolicy(dataType, { retentionDays, legalBasis }) {
  const { data } = await api.put(`/api/admin/retention-policies/${dataType}`, { retentionDays, legalBasis })
  const p = data.data ?? data
  return {
    policy_id: p.policyId,
    data_type: p.dataType,
    label: p.label,
    retention_days: p.retentionDays,
    legal_basis: p.legalBasis,
    last_reviewed_at: p.lastReviewedAt,
    enforced: p.enforced,
    updated_at: p.updatedAt,
  }
}
