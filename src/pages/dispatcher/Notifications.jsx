import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Bell } from 'lucide-react'
import DataTable from '../../components/dispatcher/DataTable'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import { useNotificationsStore } from '../../store/notificationsStore'
import MutualAidOfferModal from '../../components/dispatcher/MutualAidOfferModal'

export default function Notifications() {
  const navigate = useNavigate()
  const { items, markRead, loading } = useNotificationsStore()
  const [selectedMutualAid, setSelectedMutualAid] = useState(null)

  const columns = [
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusBadge
          label={row.read ? 'READ' : 'UNREAD'}
          variant={row.read ? 'info' : 'active'}
        />
      ),
    },
    { key: 'type', label: 'Type', render: (row) => row.type?.toUpperCase?.() ?? row.type },
    { key: 'title', label: 'Title' },
    { key: 'time', label: 'Time' },
    {
      key: 'action',
      label: '',
      render: (row) => {
        const canOpen = row.type === 'mutual_aid' || !!row.href
        if (!canOpen) return null
        return (
          <button
            type="button"
            className="text-[12px] text-(--accent) bg-transparent border-none cursor-pointer font-semibold"
            onClick={() => {
              if (row.type === 'mutual_aid') {
                setSelectedMutualAid(row)
              } else if (row.href) {
                navigate(row.href)
              }
            }}
          >
            Open →
          </button>
        )
      },
    },
  ]

  return (
    <div className="portal-page">
      <div className="mb-5">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[12px] text-(--text-muted)">Dispatcher</span>
          <ChevronRight size={12} className="text-(--text-muted)" />
          <span className="text-[12px] text-(--text-secondary)">Notifications</span>
        </div>
        <h1 className="text-2xl font-bold m-0" style={{ fontFamily: 'var(--font-display)' }}>
          All notifications
        </h1>
        <p className="text-[13px] text-(--text-secondary) m-0 mt-1">
          Complete notification history for your dispatch session.
        </p>
      </div>

      <div className="dispatcher-surface overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-(--text-muted) text-[13px]">
            Loading notifications…
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-(--text-muted)">
            <Bell size={36} className="opacity-30" />
            <p className="text-[14px] font-medium m-0">No notifications</p>
            <p className="text-[12px] m-0">You're all caught up. New alerts will appear here.</p>
          </div>
        ) : (
          <DataTable columns={columns} rows={items} />
        )}
      </div>

      <MutualAidOfferModal
        isOpen={!!selectedMutualAid}
        requestDetails={selectedMutualAid?.details || selectedMutualAid}
        onClose={() => setSelectedMutualAid(null)}
        onPledge={() => {
          if (selectedMutualAid) markRead(selectedMutualAid.id)
        }}
      />
    </div>
  )
}
