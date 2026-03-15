import React from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export function PerformanceBadge({ value }: { value: number }) {
  let label = 'Moderate'
  let color = 'bg-blue-500/10 text-blue-300 border-blue-500/30'
  let icon: React.ReactElement | null = null

  if (value > 0.02) {
    label = 'Strong'
    color = 'bg-green-500/10 text-green-300 border-green-500/30'
    icon = <ArrowUpRight className="w-3 h-3" />
  } else if (value < 0) {
    label = 'Weak'
    color = 'bg-red-500/10 text-red-300 border-red-500/30'
    icon = <ArrowDownRight className="w-3 h-3" />
  }

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${color}`}>
      {icon}
      <span>{label}</span>
    </span>
  )
}

