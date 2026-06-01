import DCPageHeader from '../../components/district-commander/DCPageHeader'

export default function DCSettings() {
  return (
    <div className="p-6">
      <DCPageHeader title="Settings" subtitle="District Commander account preferences." />
      <div className="dispatcher-surface p-6 text-[13px] text-(--text-secondary)">
        Profile and security settings use the shared ResQ settings layout in a future release. District assignment:
        Nyarugenge (demo).
      </div>
    </div>
  )
}
