export function exportToCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: string; header: string }[],
  filename: string
) {
  const headers = columns.map((c) => `"${c.header}"`).join(',')
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key]
        if (val === null || val === undefined) return '""'
        const str = String(val).replace(/"/g, '""')
        return `"${str}"`
      })
      .join(',')
  )
  const csv = [headers, ...lines].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
