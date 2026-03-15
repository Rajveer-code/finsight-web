import * as React from "react"

import { cn } from "@/lib/utils"

type ChartCardProps = {
  title: React.ReactNode
  subtitle?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function ChartCard({
  title,
  subtitle,
  className,
  children,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-5 transition-colors hover:border-zinc-700/80",
        className,
      )}
    >
      <div className="mb-4">
        <div className="text-sm font-semibold text-zinc-300">{title}</div>
        {subtitle && (
          <div className="text-xs text-zinc-600 mt-0.5">{subtitle}</div>
        )}
      </div>
      {children}
    </div>
  )
}

