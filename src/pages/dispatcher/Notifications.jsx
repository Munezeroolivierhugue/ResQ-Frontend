import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import DataTable from '../../components/dispatcher/DataTable'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import { useNotificationsStore } from '../../store/notificationsStore'

export default function Notifications() {
  const navigate = useNavigate()
  const { items } = useNotificationsStore()

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
    { key: 'type', label: 'Type', render: (row) => row.type.toUpperCase() },
    { key: 'title', label: 'Title' },
    { key: 'time', label: 'Time' },
    {
      key: 'action',
      label: '',
      render: (row) => (
        <button
          type="button"
          className="text-[12px] text-(--accent) bg-transparent border-none cursor-pointer font-semibold"
          onClick={() => navigate(row.href)}
        >
          Open →
        </button>
      ),
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
        <DataTable columns={columns} rows={items} />
      </div>
    </div>
  )
}
