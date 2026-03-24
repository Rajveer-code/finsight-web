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
        "glass-panel rounded-2xl p-5 sm:p-6 transition-all hover:border-zinc-500/60 hover:shadow-[0_30px_60px_-35px_rgba(99,102,241,.75)]",
        className,
      )}
    >
      <div className="mb-5">
        <div className="text-sm font-semibold text-zinc-100">{title}</div>
        {subtitle && (
          <div className="text-xs text-zinc-400 mt-1">{subtitle}</div>
        )}
      </div>
      {children}
    </div>
  )
}
