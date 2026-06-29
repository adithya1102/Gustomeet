'use client'

import { FileDown } from 'lucide-react'
import { exportToCSV } from '@/lib/csv-export'

interface CsvExportButtonProps<T extends Record<string, unknown>> {
  data: T[]
  columns: { key: string; header: string }[]
  filename: string
}

export default function CsvExportButton<T extends Record<string, unknown>>({
  data,
  columns,
  filename,
}: CsvExportButtonProps<T>) {
  return (
    <button
      onClick={() => exportToCSV(data, columns, filename)}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
    >
      <FileDown size={16} />
      Export CSV
    </button>
  )
}
