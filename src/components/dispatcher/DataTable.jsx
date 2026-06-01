export default function DataTable({ columns, rows, footer }) {
  return (
    <div className="dispatcher-table-wrap table-scroll">
      <table className="dispatcher-table w-full border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="field-label text-left px-4 py-3 border-b border-(--border) whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="dispatcher-table-row">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-[13px] text-(--text-primary) border-b border-(--border-subtle) align-middle">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {footer && <div className="dispatcher-table-footer">{footer}</div>}
    </div>
  )
}
