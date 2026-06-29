import { cn } from '@/lib/utils'

interface ChartCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export default function ChartCard({ title, children, className }: ChartCardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-6', className)}>
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-72">{children}</div>
    </div>
  )
}
