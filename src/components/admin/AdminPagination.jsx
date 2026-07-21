import { ChevronLeft, ChevronRight } from 'lucide-react'

// Same pagination footer design as district-commander/shift-reports
// (DCShiftReports.jsx), reused across every Admin table so all three
// (Users, Units, Agencies) paginate identically at 10 rows/page.
export default function AdminPagination({ page, totalPages, totalCount, pageSize, onPageChange }) {
  if (totalCount === 0) return null
  return (
    <div className="flex items-center justify-between gap-3 mt-3 text-[12px] text-(--text-secondary)">
      <span>
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="dispatcher-btn-ghost text-[12px] flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <span className="font-mono">{page} / {totalPages}</span>
        <button
          type="button"
          className="dispatcher-btn-ghost text-[12px] flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
